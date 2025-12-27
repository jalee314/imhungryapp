/**
 * state/queries/profile/useProfileQuery.ts
 *
 * React Query hooks for fetching user profile data.
 * Handles both current user and other user profiles.
 *
 * @example
 * // Fetch another user's profile
 * function UserProfileScreen({ userId }) {
 *   const { data: profile, isLoading } = useProfileQuery(userId)
 *   // ...
 * }
 *
 * @example
 * // Fetch current user's profile
 * function MyProfileScreen() {
 *   const { data: profile, isLoading } = useCurrentUserProfile()
 *   // ...
 * }
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserProfile,
  type UserProfileData,
} from '#/services/userProfileService'
import { loadCompleteUserProfile, type ProfileLoadingResult } from '#/services/profileLoadingService'
import { fetchUserPosts, type UserPost } from '#/services/userPostsService'
import { supabase } from '../../../../lib/supabase'

// ==========================================
// Query Keys
// ==========================================

/**
 * Query key factory for profile queries.
 */
export const profileKeys = {
  /** Base key for all profile queries */
  all: ['profile'] as const,

  /** Key for a user's basic profile */
  user: (userId: string) => [...profileKeys.all, 'user', userId] as const,

  /** Key for a user's full profile (with posts) */
  full: (userId: string) => [...profileKeys.all, 'full', userId] as const,

  /** Key for a user's posts only */
  posts: (userId: string) => [...profileKeys.all, 'posts', userId] as const,

  /** Key for current user's profile */
  currentUser: () => [...profileKeys.all, 'current'] as const,
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hook for fetching a user's basic profile data.
 * Use this for quick profile loads (header, cards, etc.)
 *
 * @param userId - The user ID to fetch
 *
 * @example
 * const { data, isLoading } = useProfileQuery('user-123')
 * if (data) {
 *   console.log(data.userData.username)
 * }
 */
export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.user(userId ?? ''),
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching a user's complete profile with posts.
 * Use this for full profile screens.
 *
 * @param userId - The user ID to fetch
 * @param currentUserPhotoUrl - Current user's photo URL (for comparison/display)
 *
 * @example
 * const { data, isLoading } = useFullProfileQuery('user-123')
 * if (data) {
 *   console.log(data.userPosts.length, 'posts')
 * }
 */
export function useFullProfileQuery(
  userId: string | undefined,
  currentUserPhotoUrl: string | null = null
) {
  // Use a persistent cache map (React Query handles this)
  const userProfileCache = new Map()

  return useQuery({
    queryKey: profileKeys.full(userId ?? ''),
    queryFn: () => loadCompleteUserProfile(userId!, currentUserPhotoUrl, userProfileCache),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching a user's posts only.
 * Use when you already have profile data but need posts.
 *
 * @param userId - The user ID to fetch posts for
 * @param limit - Maximum number of posts to fetch (default: 20)
 */
export function useUserPostsQuery(userId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: profileKeys.posts(userId ?? ''),
    queryFn: () => fetchUserPosts(userId!, limit),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute (posts change more frequently)
  })
}

/**
 * Hook for fetching the current authenticated user's profile.
 *
 * @example
 * const { data: myProfile, isLoading } = useCurrentUserProfile()
 */
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: profileKeys.currentUser(),
    queryFn: async (): Promise<UserProfileData | null> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      return fetchUserProfile(user.id)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to invalidate a user's profile cache.
 * Use after profile updates.
 *
 * @example
 * const invalidateProfile = useInvalidateProfile()
 * // After profile edit:
 * invalidateProfile('user-123')
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient()

  return (userId?: string) => {
    if (userId) {
      // Invalidate specific user's profile
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) })
      queryClient.invalidateQueries({ queryKey: profileKeys.full(userId) })
      queryClient.invalidateQueries({ queryKey: profileKeys.posts(userId) })
    } else {
      // Invalidate all profile queries
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    }
  }
}
