import {
  fetchCurrentUserPhoto,
  fetchUserProfile,
  type ProfileRecord,
  type ProfileUserData,
  type UserProfileCache
} from './userProfileService';


/**
 * Load only critical profile data (for fast initial display)
 */
export const loadCriticalProfileData = async (
  targetUserId: string,
  currentUserPhotoUrl: string | null
): Promise<{
  profile: ProfileRecord;
  photoUrl: string | null;
  dealCount: number;
  userData: ProfileUserData;
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
