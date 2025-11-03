/**
 * Profile Service
 * 
 * Consolidated profile management service that handles:
 * - Profile loading and caching
 * - Profile actions (upload photo, logout, delete account)
 * - Profile UI utilities (formatting, alerts)
 * 
 * This service combines functionality from:
 * - profileLoadingService.ts
 * - profileActionsService.ts
 * - profileUtilsService.ts
 */

import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUserCache } from './userService';
import { ProfileCacheService } from './profileCacheService';
import { signOut } from './sessionService';
import { processImageWithEdgeFunction, ImageType } from './imageProcessingService';
import { fetchUserProfile, fetchCurrentUserPhoto, createUserProfileCache, UserProfileCache, UserProfileData } from './userProfileService';
import { fetchUserPosts, updatePostsWithUserInfo, UserPost } from './userPostsService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// PROFILE LOADING & CACHING
// ============================================================================

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
      !currentUserPhotoUrl ? fetchCurrentUserPhoto() : Promise.resolve(null),
      fetchUserProfile(targetUserId)
    ];

    const [currentUserPhotoResult, userProfileData] = await Promise.all(criticalQueries);

    if (!userProfileData) {
      throw new Error('Failed to fetch user profile data');
    }

    const profileData = userProfileData as UserProfileData;

    // Phase 2: Load posts in background (non-blocking)
    const postsPromise = fetchUserPosts(targetUserId, 20).catch(error => {
      console.error('Error loading posts (non-critical):', error);
      return [];
    });

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

// ============================================================================
// PROFILE ACTIONS (Photo Upload, Logout, Delete)
// ============================================================================

/**
 * Handle profile photo upload
 */
export const uploadProfilePhoto = async (
  photoUri: string,
  profile: any,
  setPhotoUrl: (url: string) => void,
  setCurrentUserPhotoUrl: (url: string) => void,
  refreshProfile: () => Promise<void>
) => {
  try {
    console.log('Starting profile photo upload...');
    
    const result = await processImageWithEdgeFunction(photoUri, 'profile_image');
    
    if (!result.success || !result.metadataId) {
      Alert.alert('Upload Failed', result.error || 'Failed to process image');
      return;
    }
    
    console.log('Image processed successfully, metadataId:', result.metadataId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error: updateError } = await supabase
      .from('user')
      .update({ profile_photo_metadata_id: result.metadataId })
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      Alert.alert('Error', 'Failed to update profile photo');
      return;
    }
    
    const displayUrl = result.variants?.medium || result.variants?.small || result.variants?.thumbnail;
    if (displayUrl) {
      setPhotoUrl(displayUrl);
      setCurrentUserPhotoUrl(displayUrl);
    }
    
    await refreshProfile();
    Alert.alert('Success', 'Profile photo updated!');
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    Alert.alert('Error', 'Failed to upload photo');
  }
};

/**
 * Handle taking a photo
 */
export const handleTakePhoto = async (
  uploadPhoto: (uri: string) => Promise<void>
) => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo');
  }
};

/**
 * Handle choosing from library
 */
export const handleChooseFromLibrary = async (
  uploadPhoto: (uri: string) => Promise<void>
) => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error choosing photo:', error);
    Alert.alert('Error', 'Failed to select photo');
  }
};

/**
 * Handle user logout
 */
export const handleUserLogout = async () => {
  try {
    await signOut();
    await ProfileCacheService.clearCache();
    await AsyncStorage.multiRemove(['userData', 'userDataTimestamp', 'supabase_auth_session']);
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([
      'userData', 
      'userDataTimestamp', 
      'supabase_auth_session',
      'current_db_session_id',
      'db_session_start_time'
    ]);
  } catch (error) {
    console.error('Error during logout:', error);
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
  }
};

/**
 * Handle account deletion - removes all user data from the database
 */
export const handleAccountDeletion = async (profile: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      return false;
    }

    console.log('Starting comprehensive account deletion for user:', user.id);

    // Get all user's image metadata IDs before deletion for cleanup
    const { data: userImages } = await supabase
      .from('deal_template')
      .select('image_metadata_id')
      .eq('user_id', user.id)
      .not('image_metadata_id', 'is', null);

    const { data: profileImageMetadata } = await supabase
      .from('user')
      .select('profile_photo_metadata_id')
      .eq('user_id', user.id)
      .not('profile_photo_metadata_id', 'is', null);

    const imageMetadataIds = [
      ...(userImages?.map(img => img.image_metadata_id) || []),
      ...(profileImageMetadata?.map(img => img.profile_photo_metadata_id) || [])
    ].filter(Boolean);

    let cloudinaryPublicIds: string[] = [];
    if (imageMetadataIds.length > 0) {
      const { data: imageMetadata } = await supabase
        .from('image_metadata')
        .select('cloudinary_public_id')
        .in('image_metadata_id', imageMetadataIds);
      
      cloudinaryPublicIds = imageMetadata?.map(img => img.cloudinary_public_id).filter(Boolean) || [];
    }

    // Clear the user's profile photo metadata reference to avoid foreign key constraint
    const { error: clearPhotoError } = await supabase
      .from('user')
      .update({ profile_photo_metadata_id: null })
      .eq('user_id', user.id);

    if (clearPhotoError) {
      console.error('Error clearing profile photo metadata reference:', clearPhotoError);
    } else {
      console.log('Cleared profile photo metadata reference');
    }

    // Delete image metadata records
    if (imageMetadataIds.length > 0) {
      const { error: imageMetadataError } = await supabase
        .from('image_metadata')
        .delete()
        .in('image_metadata_id', imageMetadataIds);

      if (imageMetadataError) {
        console.error('Error deleting image metadata:', imageMetadataError);
      } else {
        console.log('Deleted image metadata records');
      }
    }

    // Delete Cloudinary images
    if (cloudinaryPublicIds.length > 0) {
      try {
        console.log('Attempting to delete Cloudinary images:', cloudinaryPublicIds.length);
        const { error: cloudinaryError } = await supabase.functions.invoke('delete-cloudinary-images', {
          body: { publicIds: cloudinaryPublicIds }
        });
        
        if (cloudinaryError) {
          console.error('Error deleting Cloudinary images:', cloudinaryError);
        } else {
          console.log('Successfully deleted Cloudinary images');
        }
      } catch (error) {
        console.error('Failed to call Cloudinary deletion function:', error);
      }
    }

    // Delete legacy profile photo from storage
    if (profile?.profile_photo && profile.profile_photo !== 'default_avatar.png') {
      const photoPath = profile.profile_photo.startsWith('public/') 
        ? profile.profile_photo 
        : `public/${profile.profile_photo}`;
        
      const { error: deletePhotoError } = await supabase.storage
        .from('avatars')
        .remove([photoPath]);
      
      if (deletePhotoError) {
        console.error('Error deleting legacy profile photo:', deletePhotoError);
      } else {
        console.log('Deleted legacy profile photo');
      }
    }

    // Delete user from public.user table (triggers CASCADE)
    console.log('Attempting to delete user from public.user table...');
    const { error: deleteUserError } = await supabase
      .from('user')
      .delete()
      .eq('user_id', user.id);

    if (deleteUserError) {
      console.error('Error deleting user from public.user:', deleteUserError);
      Alert.alert('Error', 'Failed to delete user profile. Please try again.');
      return false;
    } else {
      console.log('Deleted user profile - database cascades handled related data');
    }

    // Verify deletion
    const { data: remainingUser } = await supabase
      .from('user')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (remainingUser) {
      console.error('ERROR: User still exists after deletion attempt!');
      Alert.alert('Error', 'Failed to completely delete user profile. Please try again.');
      return false;
    }

    console.log('Confirmed: User successfully deleted');

    // Wait for database operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Delete from auth.users via edge function
    try {
      console.log('Attempting to delete user from auth.users via edge function');
      const { error: deleteAuthUserError } = await supabase.functions.invoke('delete-auth-user', {
        body: { userId: user.id }
      });
      
      if (deleteAuthUserError) {
        console.error('Error deleting user from auth.users:', deleteAuthUserError);
      } else {
        console.log('Successfully deleted user from auth.users');
      }
    } catch (error) {
      console.error('Failed to call auth user deletion function:', error);
    }

    // Clear local cache and sign out
    await clearUserCache();
    ProfileCacheService.clearCache();
    await AsyncStorage.clear();
    await supabase.auth.signOut();

    console.log('Account deletion completed successfully');
    Alert.alert(
      'Success', 
      'Account and all associated data deleted successfully. You will be automatically signed out.'
    );
    
    return true;
  } catch (error) {
    console.error('Error during account deletion:', error);
    Alert.alert('Error', 'An unexpected error occurred during account deletion. Please try again.');
    return false;
  }
};

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Format join date from various possible date fields
 */
export const formatJoinDate = (profile: any) => {
  if (!profile) return 'Joined recently';
  
  const dateString = profile.created_at || profile.createdAt || profile.date_created || 
                    profile.inserted_at || profile.created || profile.registered_at || profile.signup_date;
  
  if (!dateString) return 'Joined recently';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Joined recently';
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  } catch (error) {
    return 'Joined recently';
  }
};

/**
 * Get display name from userData or profile
 */
export const getDisplayName = (userData: any, profile: any) => {
  return userData?.username || profile?.display_name || '';
};

/**
 * Calculate username font size based on length
 */
export const getUsernameFontSize = (username: string) => {
  const length = username.length;
  
  if (length <= 8) return 26;
  if (length <= 12) return 24;
  return 22;
};

/**
 * Show profile photo picker options
 */
export const showProfilePhotoOptions = (
  handleTakePhoto: () => void,
  handleChooseFromLibrary: () => void
) => {
  Alert.alert(
    'Update Profile Photo',
    'Choose how you want to update your profile photo',
    [
      {
        text: 'Take Photo',
        onPress: handleTakePhoto,
      },
      {
        text: 'Choose from Library',
        onPress: handleChooseFromLibrary,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
};

/**
 * Show logout confirmation
 */
export const showLogoutConfirmation = (
  onConfirm: () => void,
  onCancel: () => void
) => {
  Alert.alert(
    'Log Out',
    'Are you sure you want to log out?',
    [
      {
        text: 'Cancel',
        onPress: onCancel,
        style: 'cancel',
      },
      {
        text: 'Log Out',
        onPress: onConfirm,
        style: 'destructive',
      },
    ]
  );
};

/**
 * Show delete account confirmation
 */
export const showDeleteAccountConfirmation = (
  onConfirm: () => void,
  onCancel: () => void
) => {
  Alert.alert(
    'Delete Account',
    'Are you sure? All your information is going to be deleted.',
    [
      {
        text: 'Cancel',
        onPress: onCancel,
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: onConfirm,
        style: 'destructive',
      },
    ]
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export types for convenience
export type { UserPost } from './userPostsService';
export type { UserProfileCache, UserProfileData } from './userProfileService';

