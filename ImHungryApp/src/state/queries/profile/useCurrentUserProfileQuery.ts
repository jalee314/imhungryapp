/**
 * state/queries/profile/useCurrentUserProfileQuery.ts
 *
 * React Query hook for current user's profile data.
 * Replaces ProfileCacheService with React Query caching (Bluesky pattern).
 *
 * Key changes from ProfileCacheService:
 * - React Query IS the cache (no AsyncStorage needed for runtime)
 * - Automatic background refetch on stale
 * - Query invalidation for updates
 * - Simpler API with built-in loading/error states
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase'
import { profileKeys } from './useProfileQuery'

// ==========================================
// Types
// ==========================================

export interface CurrentUserProfile {
  user_id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  location_city: string | null
  profile_photo: string | null
  profile_photo_metadata_id: string | null
  created_at: string
  image_metadata?: {
    variants?: {
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
    }
  }
  [key: string]: any
}

export interface CurrentUserProfileData {
  profile: CurrentUserProfile
  photoUrl: string | null
  dealCount: number
}

// ==========================================
// Query Key
// ==========================================

export const currentUserProfileKeys = {
  all: ['currentUserProfile'] as const,
  data: () => [...currentUserProfileKeys.all, 'data'] as const,
  posts: () => [...currentUserProfileKeys.all, 'posts'] as const,
}

// ==========================================
// Query Functions
// ==========================================

async function fetchCurrentUserProfile(): Promise<CurrentUserProfileData | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch profile and deal count in parallel
  const [profileResult, dealCountResult] = await Promise.all([
    supabase
      .from('user')
      .select(`
        *,
        image_metadata:profile_photo_metadata_id (
          variants
        )
      `)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('deal_template')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  if (profileResult.error) throw profileResult.error

  const profile = profileResult.data
  const dealCount = dealCountResult.count || 0

  // Resolve photo URL from Cloudinary or legacy storage
  let photoUrl = null
  if (profile.image_metadata?.variants) {
    photoUrl =
      profile.image_metadata.variants.medium ||
      profile.image_metadata.variants.small ||
      profile.image_metadata.variants.thumbnail
  } else if (profile.profile_photo && profile.profile_photo !== 'default_avatar.png') {
    const photoPath = profile.profile_photo.startsWith('public/')
      ? profile.profile_photo
      : `public/${profile.profile_photo}`
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(photoPath)
    photoUrl = urlData.publicUrl
  }

  return { profile, photoUrl, dealCount }
}

async function fetchCurrentUserPosts(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Import dynamically to avoid circular deps
  const { fetchUserPosts, transformDealForUI } = await import('../../../services/dealService')
  const posts = await fetchUserPosts()
  return posts.map(transformDealForUI)
}

// ==========================================
// Hook
// ==========================================

export function useCurrentUserProfileQuery() {
  const queryClient = useQueryClient()

  // Main profile data query
  const profileQuery = useQuery({
    queryKey: currentUserProfileKeys.data(),
    queryFn: fetchCurrentUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // User posts query (separate, lazy-loaded)
  const postsQuery = useQuery({
    queryKey: currentUserProfileKeys.posts(),
    queryFn: fetchCurrentUserPosts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: false, // Lazy - call refetch manually
  })

  // Invalidate profile (after edits)
  const invalidateProfile = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: currentUserProfileKeys.data() })
  }, [queryClient])

  // Invalidate posts
  const invalidatePosts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: currentUserProfileKeys.posts() })
  }, [queryClient])

  // Force refresh (background)
  const refresh = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: currentUserProfileKeys.data() })
  }, [queryClient])

  // Load posts (first time or refresh)
  const loadPosts = useCallback(async () => {
    await postsQuery.refetch()
  }, [postsQuery])

  // Update deal count optimistically (after creating/deleting a deal)
  const updateDealCountOptimistic = useCallback(
    (delta: number) => {
      queryClient.setQueryData<CurrentUserProfileData | null>(
        currentUserProfileKeys.data(),
        (old) => {
          if (!old) return old
          return { ...old, dealCount: Math.max(0, old.dealCount + delta) }
        }
      )
    },
    [queryClient]
  )

  // Update photo URL optimistically
  const updatePhotoUrlOptimistic = useCallback(
    (newPhotoUrl: string | null) => {
      queryClient.setQueryData<CurrentUserProfileData | null>(
        currentUserProfileKeys.data(),
        (old) => {
          if (!old) return old
          return { ...old, photoUrl: newPhotoUrl }
        }
      )
    },
    [queryClient]
  )

  return {
    // Profile data
    profile: profileQuery.data?.profile ?? null,
    photoUrl: profileQuery.data?.photoUrl ?? null,
    dealCount: profileQuery.data?.dealCount ?? 0,
    hasData: !!profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error as Error | null,

    // Posts data
    posts: postsQuery.data ?? [],
    postsLoading: postsQuery.isLoading || postsQuery.isFetching,
    postsError: postsQuery.error as Error | null,

    // Actions
    refresh,
    loadPosts,
    invalidateProfile,
    invalidatePosts,
    updateDealCountOptimistic,
    updatePhotoUrlOptimistic,
  }
}

// ==========================================
// Other User Profile Query
// ==========================================

export function useOtherUserProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: [...profileKeys.all, 'other', userId],
    queryFn: async () => {
      if (!userId) return null

      const [profileResult, postsResult, dealCountResult] = await Promise.all([
        supabase
          .from('user')
          .select(`
            *,
            image_metadata:profile_photo_metadata_id (
              variants
            )
          `)
          .eq('user_id', userId)
          .single(),
        // Fetch user's posts
        (async () => {
          const { fetchUserPosts } = await import('../../../services/userPostsService')
          return fetchUserPosts(userId, 20)
        })(),
        // Deal count
        supabase
          .from('deal_template')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ])

      if (profileResult.error) throw profileResult.error

      const profile = profileResult.data
      const posts = postsResult || []
      const dealCount = dealCountResult.count || 0

      // Resolve photo URL
      let photoUrl = null
      if (profile.image_metadata?.variants) {
        photoUrl =
          profile.image_metadata.variants.medium ||
          profile.image_metadata.variants.small ||
          profile.image_metadata.variants.thumbnail
      } else if (profile.profile_photo && profile.profile_photo !== 'default_avatar.png') {
        const photoPath = profile.profile_photo.startsWith('public/')
          ? profile.profile_photo
          : `public/${profile.profile_photo}`
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(photoPath)
        photoUrl = urlData.publicUrl
      }

      return { profile, photoUrl, dealCount, posts }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}
