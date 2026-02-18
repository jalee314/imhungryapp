/**
 * @file useProfileData — Profile & user data loading, caching and refresh.
 *
 * Manages: profile, userData, photoUrl, currentUserPhotoUrl, dealCount,
 *          hasData, userProfileCache, and the load routines for both
 *          own-profile and other-user-profile flows.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileCacheService } from '../../../services/profileCacheService';
import { loadCriticalProfileData, updateUserProfileCache } from '../../../services/profileLoadingService';
import type { UserProfileCache } from '../../../types/user';
import type { ProfileDataState } from '../types';

// ============================================================================
// Hook
// ============================================================================

export interface UseProfileDataParams {
  viewUser: boolean | undefined;
  userId: string | undefined;
}

export interface UseProfileDataResult extends ProfileDataState {
  userData: any;
  userProfileCache: Map<string, UserProfileCache>;
  /** Re-fetch own profile data (for use after post-added, photo upload, etc.) */
  refreshProfile: () => Promise<void>;
  /** Load own profile data from cache + network */
  loadProfileData: () => Promise<void>;
  /** Load another user's profile & posts, returning posts via callback */
  loadOtherUserProfile: (
    targetUserId: string,
    onPostsLoaded: (posts: any[]) => void,
    onPostsLoadStart: () => void,
    onPostsLoadEnd: (initialized: boolean) => void,
  ) => Promise<void>;
  // Setters needed by sibling hooks
  setProfile: React.Dispatch<React.SetStateAction<any | null>>;
  setPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentUserPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setDealCount: React.Dispatch<React.SetStateAction<number>>;
  setHasData: React.Dispatch<React.SetStateAction<boolean>>;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
}

export function useProfileData({ viewUser, userId }: UseProfileDataParams): UseProfileDataResult {
  const [profile, setProfile] = useState<any | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);
  const [dealCount, setDealCount] = useState<number>(0);
  const [hasData, setHasData] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, UserProfileCache>>(new Map());

  // ---------- Data Loading (current user) ----------
  const loadProfileData = useCallback(async () => {
    try {
      const cached = await ProfileCacheService.getCachedProfile();
      if (cached) {
        setProfile(cached.profile);
        setPhotoUrl(cached.photoUrl);
        setCurrentUserPhotoUrl(cached.photoUrl);
        setDealCount(cached.dealCount);
        setHasData(true);
      }
      const freshData = await ProfileCacheService.fetchFreshProfile();
      if (freshData) {
        setProfile(freshData.profile);
        setPhotoUrl(freshData.photoUrl);
        setCurrentUserPhotoUrl(freshData.photoUrl);
        setDealCount(freshData.dealCount);
        await ProfileCacheService.setCachedProfile(
          freshData.profile,
          freshData.photoUrl,
          freshData.dealCount,
        );
      }
      if (!cached) setHasData(true);
    } catch (err) {
      console.error('Error loading profile:', err);
      setHasData(true);
    }
  }, []);

  // ---------- Data Loading (other user) ----------
  const loadOtherUserProfile = useCallback(
    async (
      targetUserId: string,
      onPostsLoaded: (posts: any[]) => void,
      onPostsLoadStart: () => void,
      onPostsLoadEnd: (initialized: boolean) => void,
    ) => {
      try {
        onPostsLoadStart();
        const criticalData = await loadCriticalProfileData(targetUserId, currentUserPhotoUrl);
        setProfile(criticalData.profile);
        setPhotoUrl(criticalData.photoUrl);
        setCurrentUserPhotoUrl(criticalData.currentUserPhotoUrl || null);
        setUserData(criticalData.userData);
        setDealCount(criticalData.dealCount);
        setHasData(true);
        // Posts in background
        try {
          const { fetchUserPosts } = await import('../../../services/userPostsService');
          const posts = await fetchUserPosts(targetUserId, 20);
          const { updatePostsWithUserInfo } = await import('../../../services/userPostsService');
          const updatedPosts = updatePostsWithUserInfo(
            posts,
            criticalData.userData.username,
            criticalData.photoUrl,
          );
          onPostsLoaded(updatedPosts);
          const cacheData = {
            profile: criticalData.profile,
            photoUrl: criticalData.photoUrl,
            dealCount: criticalData.dealCount,
            userData: criticalData.userData,
            userPosts: updatedPosts,
          } as any;
          setUserProfileCache((prev) =>
            updateUserProfileCache(prev, targetUserId, cacheData),
          );
        } catch (postsErr) {
          console.error('Error loading other user posts (non-critical):', postsErr);
        } finally {
          onPostsLoadEnd(true);
        }
      } catch (err) {
        console.error('Error loading other user profile:', err);
        Alert.alert('Error', 'Could not load user profile');
        onPostsLoadEnd(false);
      }
    },
    [currentUserPhotoUrl],
  );

  // Refresh after changes (own profile only)
  const refreshProfile = useCallback(async () => {
    const freshData = await ProfileCacheService.forceRefresh();
    if (!freshData) return;
    const samePhoto = freshData.photoUrl === photoUrl;
    const sameDeals = freshData.dealCount === dealCount;
    const sameProfile = JSON.stringify(freshData.profile) === JSON.stringify(profile);
    if (samePhoto && sameDeals && sameProfile) return;
    setProfile(freshData.profile);
    setPhotoUrl(freshData.photoUrl);
    setCurrentUserPhotoUrl(freshData.photoUrl);
    setDealCount(freshData.dealCount);
  }, [photoUrl, dealCount, profile]);

  // Focus refresh — only for own profile
  useFocusEffect(
    useCallback(() => {
      if (!hasData && !viewUser) {
        loadProfileData();
      }
    }, [hasData, viewUser, loadProfileData]),
  );

  return {
    profile,
    userData,
    photoUrl,
    currentUserPhotoUrl,
    dealCount,
    hasData,
    userProfileCache,
    refreshProfile,
    loadProfileData,
    loadOtherUserProfile,
    setProfile,
    setPhotoUrl,
    setCurrentUserPhotoUrl,
    setDealCount,
    setHasData,
    setUserData,
  };
}
