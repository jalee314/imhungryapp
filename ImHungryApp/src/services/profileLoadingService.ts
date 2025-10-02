import { fetchUserProfile, fetchCurrentUserPhoto, createUserProfileCache, UserProfileCache, UserProfileData } from './userProfileService';
import { fetchUserPosts, updatePostsWithUserInfo, UserPost } from './userPostsService';

export interface ProfileLoadingResult {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
  userPosts: UserPost[];
  currentUserPhotoUrl?: string | null;
}

/**
 * Load complete user profile with optimized parallel queries and progressive loading
 */
export const loadCompleteUserProfile = async (
  targetUserId: string,
  currentUserPhotoUrl: string | null,
  userProfileCache: Map<string, UserProfileCache>
): Promise<ProfileLoadingResult> => {
  try {
    // Check cache first
    const cachedData = userProfileCache.get(targetUserId);
    if (cachedData) {
      console.log('Using cached data for user:', targetUserId);
      return {
        profile: cachedData.profile,
        photoUrl: cachedData.photoUrl,
        dealCount: cachedData.dealCount,
        userData: cachedData.userData,
        userPosts: cachedData.userPosts,
        currentUserPhotoUrl
      };
    }

    // Progressive loading: Load critical data first, then posts
    console.log('Starting progressive loading for user:', targetUserId);
    
    // Phase 1: Load critical profile data immediately
    const criticalQueries = [
      // Get current user's photo URL if not already set (only if needed)
      !currentUserPhotoUrl ? fetchCurrentUserPhoto() : Promise.resolve(null),
      
      // Fetch the other user's profile data (critical for UI)
      fetchUserProfile(targetUserId)
    ];

    // Execute critical queries first
    const [currentUserPhotoResult, userProfileData] = await Promise.all(criticalQueries);

    // Check if user profile data exists
    if (!userProfileData) {
      throw new Error('Failed to fetch user profile data');
    }

    // Type assertion to help TypeScript understand the types
    const profileData = userProfileData as UserProfileData;

    // Phase 2: Load posts in background (non-blocking)
    const postsPromise = fetchUserPosts(targetUserId, 20).catch(error => {
      console.error('Error loading posts (non-critical):', error);
      return []; // Return empty array if posts fail to load
    });

    // Update posts with user information (when posts are ready)
    const userPosts = await postsPromise;
    const updatedPosts = updatePostsWithUserInfo(
      userPosts,
      profileData.userData.username,
      profileData.photoUrl
    );

    // Create cache data for future use
    const cacheData = createUserProfileCache(
      profileData.profile,
      profileData.photoUrl,
      profileData.dealCount,
      profileData.userData,
      updatedPosts
    );

    return {
      profile: profileData.profile,
      photoUrl: profileData.photoUrl,
      dealCount: profileData.dealCount,
      userData: profileData.userData,
      userPosts: updatedPosts,
      currentUserPhotoUrl: (currentUserPhotoResult as string) || currentUserPhotoUrl
    };
  } catch (error) {
    console.error('Error in loadCompleteUserProfile:', error);
    throw error;
  }
};

/**
 * Load only critical profile data (for fast initial display)
 */
export const loadCriticalProfileData = async (
  targetUserId: string,
  currentUserPhotoUrl: string | null
): Promise<{
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
  currentUserPhotoUrl?: string | null;
}> => {
  try {
    // Load only critical data for fast display
    const [currentUserPhotoResult, userProfileData] = await Promise.all([
      !currentUserPhotoUrl ? fetchCurrentUserPhoto() : Promise.resolve(null),
      fetchUserProfile(targetUserId)
    ]);

    if (!userProfileData) {
      throw new Error('Failed to fetch user profile data');
    }

    return {
      profile: userProfileData.profile,
      photoUrl: userProfileData.photoUrl,
      dealCount: userProfileData.dealCount,
      userData: userProfileData.userData,
      currentUserPhotoUrl: currentUserPhotoResult || currentUserPhotoUrl
    };
  } catch (error) {
    console.error('Error in loadCriticalProfileData:', error);
    throw error;
  }
};

/**
 * Update cache with new data
 */
export const updateUserProfileCache = (
  cache: Map<string, UserProfileCache>,
  userId: string,
  data: UserProfileCache
): Map<string, UserProfileCache> => {
  return new Map(cache).set(userId, data);
};
