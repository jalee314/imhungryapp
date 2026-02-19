import { supabase } from '../../lib/supabase';

// Simple cache for profile data
const profileCache = new Map<string, {
  data: UserProfileData;
  timestamp: number;
}>();

const CACHE_DURATION = 60000; // 1 minute cache

export interface UserProfileData {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
}

export interface UserProfileCache {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
  userPosts: any[];
}

/**
 * Fetch user profile data including basic info, photo, and deal count
 */
export const fetchUserProfile = async (targetUserId: string): Promise<UserProfileData> => {
  try {
    // Check cache first
    const cached = profileCache.get(targetUserId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached profile data for user:', targetUserId);
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
      console.error('Error fetching user profile:', profileError);
      throw new Error('Could not load user profile');
    }

    const { count: dealCount, error: dealCountError } = dealCountResult;
    if (dealCountError) {
      console.error('Error fetching deal count:', dealCountError);
    }

    // Process profile photo URL
    const variants = (userProfile as any)?.image_metadata?.variants as any;
    const photoUrl = variants?.medium || null;

    const result = {
      profile: userProfile,
      photoUrl,
      dealCount: dealCount || 0,
      userData: {
        username: userProfile.display_name,
        profilePicture: photoUrl,
        city: userProfile.location_city || 'Unknown',
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
    console.error('Error in fetchUserProfile:', error);
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

    if (currentUserData) {
      const variants = (currentUserData as any)?.image_metadata?.variants as any;
      return variants?.thumbnail || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching current user photo:', error);
    return null;
  }
};

/**
 * Create cache data for user profile
 */
export const createUserProfileCache = (
  profile: any,
  photoUrl: string | null,
  dealCount: number,
  userData: any,
  userPosts: any[]
): UserProfileCache => {
  return {
    profile,
    photoUrl,
    dealCount,
    userData,
    userPosts
  };
};

