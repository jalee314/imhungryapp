/**
 * @file useProfile — Orchestrator hook for the Profile screen.
 *
 * Composes focused sub-hooks (data, posts, interactions, actions, modals)
 * while preserving the original UseProfileResult API contract.
 *
 * Sub-hooks live in features/profile/hooks/ for focused unit-testing.
 */

import { useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useRef, useCallback } from 'react';


import { useProfileActions } from '../features/profile/hooks/useProfileActions';
import { useProfileData } from '../features/profile/hooks/useProfileData';
import { useProfileInteractions } from '../features/profile/hooks/useProfileInteractions';
import { useProfileModals } from '../features/profile/hooks/useProfileModals';
import { useProfilePosts } from '../features/profile/hooks/useProfilePosts';
import { formatJoinDate, getDisplayName } from '../services/profileUtilsService';
import { useAdminStore } from '../stores/AdminStore';

// Re-export types from the feature module for back-compat
export type { UseProfileResult } from '../features/profile/types';

// Types kept intentionally broad to avoid tight coupling; can refine later
export interface UseProfileParams {
  navigation: any; // React Navigation object
  route: any;      // Route (expects params viewUser?: boolean, userId?: string)
}

// Hook encapsulating all profile/business logic previously in the screen
export const useProfile = ({ navigation, route }: UseProfileParams) => {
  const { viewUser, userId } = (route?.params as any) || {};

  // Check if we should navigate to settings tab (from admin mode exit)
  const navigateToProfileSettings = useAdminStore((s) => s.navigateToProfileSettings);
  const clearNavigateToProfileSettings = useAdminStore((s) => s.clearNavigateToProfileSettings);

  // Determine initial tab based on navigation flag
  const getInitialTab = (): 'posts' | 'settings' => {
    if (navigateToProfileSettings) {
      setTimeout(() => clearNavigateToProfileSettings(), 0);
      return 'settings';
    }
    return 'posts';
  };

  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>(getInitialTab());

  // ---- Sub-hooks ----
  const data = useProfileData({ viewUser, userId });

  const posts = useProfilePosts({
    viewUser,
    hasData: data.hasData,
    activeTab,
    refreshProfile: data.refreshProfile,
  });

  const interactions = useProfileInteractions({
    userPosts: posts.userPosts,
    setUserPosts: posts.setUserPosts,
    setDealCount: data.setDealCount,
    navigation,
  });

  const actions = useProfileActions({
    navigation,
    profile: data.profile,
    userData: data.userData,
    photoUrl: data.photoUrl,
    viewUser,
    setProfile: data.setProfile,
    setPhotoUrl: data.setPhotoUrl,
    setCurrentUserPhotoUrl: data.setCurrentUserPhotoUrl,
    setUserData: data.setUserData,
    setDealCount: data.setDealCount,
    setHasData: data.setHasData,
    setUserPosts: posts.setUserPosts,
    setPostsInitialized: posts.setPostsInitialized,
    refreshProfile: data.refreshProfile,
    loadProfileData: data.loadProfileData,
  });

  const modals = useProfileModals({ navigation, profile: data.profile });

  // ---- Profile switching logic (own ↔ other) ----
  const prevViewUserRef = useRef<boolean | undefined>(undefined);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const wasViewingOther = prevViewUserRef.current;
    const prevUserId = prevUserIdRef.current;
    prevViewUserRef.current = viewUser;
    prevUserIdRef.current = userId;

    if (viewUser && userId) {
      const isNewUser = prevUserId !== userId || !wasViewingOther;
      if (isNewUser) {
        console.log('📸 Profile: Loading other user profile, showing skeleton');
        data.setProfile(null);
        data.setPhotoUrl(null);
        data.setUserData(null);
        posts.setUserPosts([]);
        data.setDealCount(0);
        data.setHasData(false);
        posts.setPostsInitialized(false);
      }
      data.loadOtherUserProfile(
        userId,
        (loadedPosts) => posts.setUserPosts(loadedPosts),
        () => posts.setPostsLoading(true),
        (initialized) => {
          posts.setPostsLoading(false);
          if (initialized) posts.setPostsInitialized(true);
        },
      );
    } else {
      if (wasViewingOther) {
        console.log('📸 Profile: Switching from other user to own profile, resetting state');
        data.setProfile(null);
        data.setPhotoUrl(null);
        data.setUserData(null);
        posts.setUserPosts([]);
        data.setDealCount(0);
        data.setHasData(false);
        posts.setPostsInitialized(false);
      }
      data.loadProfileData();
    }
    // Intentionally exclude function identities to avoid effect re-triggers on state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewUser, userId]);

  // ---- Derived values ----
  const displayName = getDisplayName(data.userData, data.profile);
  const joinDateText = formatJoinDate(data.profile);
  const locationCity = data.profile?.location_city || 'Location not set';

  return {
    profile: data.profile,
    photoUrl: data.photoUrl,
    dealCount: data.dealCount,
    userPosts: posts.userPosts,
    hasData: data.hasData,
    activeTab,
    postsLoading: posts.postsLoading,
    postsInitialized: posts.postsInitialized,
    postsError: posts.postsError,
    displayName,
    joinDateText,
    locationCity,
    isViewingOtherUser: !!viewUser,
    showLogoutModal: modals.showLogoutModal,
    showDeleteModal: modals.showDeleteModal,
    setActiveTab,
    onRetryLoadPosts: posts.loadUserPosts,
    onUpvote: interactions.onUpvote,
    onDownvote: interactions.onDownvote,
    onFavorite: interactions.onFavorite,
    onDealPress: interactions.onDealPress,
    onDeletePost: interactions.onDeletePost,
    onEditProfile: actions.onEditProfile,
    onProfilePhotoPress: actions.onProfilePhotoPress,
    onProfileTabReselect: actions.onProfileTabReselect,
    onShareProfile: actions.onShareProfile,
    onGoBack: actions.onGoBack,
    openLogoutModal: modals.openLogoutModal,
    closeLogoutModal: modals.closeLogoutModal,
    confirmLogout: modals.confirmLogout,
    openDeleteModal: modals.openDeleteModal,
    closeDeleteModal: modals.closeDeleteModal,
    confirmDeleteAccount: modals.confirmDeleteAccount,
  };
};
