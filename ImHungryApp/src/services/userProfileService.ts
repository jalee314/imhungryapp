import { supabase } from '../../lib/supabase';
import type { ImageVariants } from '../types/image';
import { logger } from '../utils/logger';

import type { UserPost } from './userPostsService';

// Simple cache for profile data
const profileCache = new Map<string, {
  data: UserProfileData;
  timestamp: number;
}>();

const CACHE_DURATION = 60000; // 1 minute cache

type ProfileImageMetadata = {
  variants?: ImageVariants | null;
} | null;

export interface ProfileRecord {
  user_id: string;
  display_name: string | null;
  location_city: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_photo?: string | null;
  image_metadata?: ProfileImageMetadata;
  [key: string]: unknown;
}

export interface ProfileUserData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

export interface UserProfileData {
  profile: ProfileRecord;
  photoUrl: string | null;
  dealCount: number;
  userData: ProfileUserData;
}

export interface UserProfileCache {
  profile: ProfileRecord;
  photoUrl: string | null;
  dealCount: number;
  userData: ProfileUserData;
  userPosts: UserPost[];
}

const getPreferredPhotoUrl = (
  imageMetadata: ProfileImageMetadata,
  preferred: 'medium' | 'thumbnail'
): string | null => {
  const variants = imageMetadata?.variants;
  if (!variants) return null;

  if (preferred === 'medium') {
    return variants.medium || variants.small || variants.thumbnail || null;
  }

  return variants.thumbnail || variants.small || variants.medium || null;
};

/**
 * Fetch user profile data including basic info, photo, and deal count
 */
export const fetchUserProfile = async (targetUserId: string): Promise<UserProfileData> => {
  try {
    // Check cache first
    const cached = profileCache.get(targetUserId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      logger.info('Using cached profile data for user:', targetUserId);
      return cached.data;
    }

    // Start profile and deal count queries in parallel
    const [userProfileResult, dealCountResult] = await Promise.all([
      supabase
        .from('user')
        .select(`
          *,
          image_metadata!profile_photo_metadata_id(
            variants
          )
        `)
        .eq('user_id', targetUserId)
        .single(),

      supabase
        .from('deal_template')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
    ]);

    const { data: userProfile, error: profileError } = userProfileResult;
    if (profileError) {
      logger.error('Error fetching user profile:', profileError);
      throw new Error('Could not load user profile');
    }

    const { count: dealCount, error: dealCountError } = dealCountResult;
    if (dealCountError) {
      logger.error('Error fetching deal count:', dealCountError);
    }

    const profile = userProfile as ProfileRecord;
    const photoUrl = getPreferredPhotoUrl(profile.image_metadata ?? null, 'medium');

    const result: UserProfileData = {
      profile,
      photoUrl,
      dealCount: dealCount || 0,
      userData: {
        username: profile.display_name || '',
        profilePicture: photoUrl,
        city: profile.location_city || 'Unknown',
        state: 'CA',
      }
    };

    // Cache the result
    profileCache.set(targetUserId, {
      data: result,
      timestamp: now
    });

    return result;
  } catch (error) {
    logger.error('Error in fetchUserProfile:', error);
    throw error;
  }
};

/**
 * Fetch current user's photo URL for bottom navigation
 */
export const fetchCurrentUserPhoto = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: currentUserData } = await supabase
      .from('user')
      .select(`
        profile_photo_metadata_id,
        image_metadata!profile_photo_metadata_id(
          variants
        )
      `)
      .eq('user_id', user.id)
      .single();

    const currentProfile = currentUserData as { image_metadata?: ProfileImageMetadata } | null;
    return getPreferredPhotoUrl(currentProfile?.image_metadata ?? null, 'thumbnail');
  } catch (error) {
    logger.error('Error fetching current user photo:', error);
    return null;
  }
};

/**
 * Create cache data for user profile
 */
export const createUserProfileCache = (
  profile: ProfileRecord,
  photoUrl: string | null,
  dealCount: number,
  userData: ProfileUserData,
  userPosts: UserPost[]
): UserProfileCache => {
  return {
    profile,
    photoUrl,
    dealCount,
    userData,
    userPosts
  };
};
