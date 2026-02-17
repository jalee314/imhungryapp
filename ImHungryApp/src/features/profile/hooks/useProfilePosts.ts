/**
 * @file useProfilePosts — Post loading, post-added refresh, and deal-update
 * synchronisation for the profile screen.
 *
 * Manages: userPosts, postsLoading, postsInitialized, postsError.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserPosts, transformDealForUI } from '../../../services/dealService';
import { useDealUpdate } from '../../../hooks/useDealUpdate';
import type { ProfilePostsState } from '../types';

// ============================================================================
// Hook
// ============================================================================

export interface UseProfilePostsParams {
  viewUser: boolean | undefined;
  hasData: boolean;
  activeTab: 'posts' | 'settings';
  refreshProfile: () => Promise<void>;
}

export interface UseProfilePostsResult extends ProfilePostsState {
  setUserPosts: React.Dispatch<React.SetStateAction<any[]>>;
  loadUserPosts: () => Promise<void>;
  setPostsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPostsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useProfilePosts({
  viewUser,
  hasData,
  activeTab,
  refreshProfile,
}: UseProfilePostsParams): UseProfilePostsResult {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsInitialized, setPostsInitialized] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const postsLoadedRef = useRef(false);

  const { postAdded, setPostAdded, getUpdatedDeal, clearUpdatedDeal } = useDealUpdate();

  // Load posts for current user (lazy)
  const loadUserPosts = useCallback(async () => {
    try {
      if (viewUser) return;
      if (postsLoading) return;
      setPostsLoading(true);
      setPostsError(null);
      const posts = await fetchUserPosts();
      const transformed = posts.map(transformDealForUI);
      const unique = Array.from(new Map(transformed.map((p) => [p.id, p])).values());
      setUserPosts(unique);
    } catch (err) {
      console.error('Error loading user posts:', err);
      setPostsError('Failed to load your posts');
    } finally {
      setPostsLoading(false);
      setPostsInitialized(true);
    }
  }, [viewUser, postsLoading]);

  // Lazy load effect
  useEffect(() => {
    if (activeTab === 'posts' && hasData && !viewUser && !postsLoadedRef.current) {
      postsLoadedRef.current = true;
      loadUserPosts();
    }
  }, [activeTab, hasData, viewUser, loadUserPosts]);

  // Reset postsLoadedRef when screen unmounts/loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        postsLoadedRef.current = false;
      };
    }, []),
  );

  // Focus-triggered refresh and post-added handling
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        if (postAdded) {
          console.log('📸 Profile: postAdded detected, refreshing posts');
          await loadUserPosts();
          if (!cancelled) setPostAdded(false);
        }

        // Also check for individual deal updates from the store
        if (!viewUser) {
          setUserPosts((prevPosts) => {
            let hasChanges = false;
            const dealIdsToClear: string[] = [];
            const updatedPosts = prevPosts.map((post) => {
              const updatedDeal = getUpdatedDeal(post.id);
              if (updatedDeal) {
                hasChanges = true;
                dealIdsToClear.push(post.id);
                return {
                  ...post,
                  title: updatedDeal.title,
                  details: updatedDeal.details,
                  isAnonymous: updatedDeal.isAnonymous,
                  author: updatedDeal.author,
                  imageVariants: updatedDeal.imageVariants,
                };
              }
              return post;
            });

            if (hasChanges) {
              console.log('📸 Profile: Applying deal updates from store');
              setTimeout(() => {
                dealIdsToClear.forEach((id) => clearUpdatedDeal(id));
              }, 0);
            }

            return hasChanges ? updatedPosts : prevPosts;
          });

          await refreshProfile();
        }
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [viewUser, postAdded, refreshProfile, loadUserPosts, setPostAdded, getUpdatedDeal, clearUpdatedDeal]),
  );

  return {
    userPosts,
    postsLoading,
    postsInitialized,
    postsError,
    setUserPosts,
    loadUserPosts,
    setPostsLoading,
    setPostsInitialized,
  };
}
