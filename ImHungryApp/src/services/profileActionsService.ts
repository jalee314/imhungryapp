import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { supabase } from '../../lib/supabase';
import { logger } from '../utils/logger';

import { processImageWithEdgeFunction } from './imageProcessingService';
import { ProfileCacheService } from './profileCacheService';
import { signOut } from './sessionService';
import { clearUserCache } from './userService';

interface ProfileWithPhoto {
  profile_photo?: string | null;
}



/**
 * Handle profile photo upload
 */
export const uploadProfilePhoto = async (
  photoUri: string,
  _profile: ProfileWithPhoto | null,
  setPhotoUrl: (url: string) => void,
  setCurrentUserPhotoUrl: (url: string) => void,
  refreshProfile: () => Promise<void>
) => {
  try {
    logger.info('Starting profile photo upload...');
    
    // Process image with Cloudinary via edge function
    const result = await processImageWithEdgeFunction(photoUri, 'profile_image');
    
    if (!result.success || !result.metadataId) {
      Alert.alert('Upload Failed', result.error || 'Failed to process image');
      return;
    }
    
    logger.info('Image processed successfully, metadataId:', result.metadataId);
    
    // Update user profile with image_metadata_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error: updateError } = await supabase
      .from('user')
      .update({ 
        profile_photo_metadata_id: result.metadataId  // Fixed: use correct column name
      })
      .eq('user_id', user.id);
    
    if (updateError) {
      logger.error('Error updating profile:', updateError);
      Alert.alert('Error', 'Failed to update profile photo');
      return;
    }
    
    // Use the optimized URL for display
    const displayUrl = result.variants?.medium || result.variants?.small || result.variants?.thumbnail;
    if (displayUrl) {
      setPhotoUrl(displayUrl);
      setCurrentUserPhotoUrl(displayUrl);
    }
    
    await refreshProfile();
    Alert.alert('Success', 'Profile photo updated!');
    
  } catch (error) {
    logger.error('Error uploading photo:', error);
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
      quality: 0.7,  // Add compression
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0].uri);
    }
  } catch (error) {
    logger.error('Error taking photo:', error);
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
      quality: 0.7,  // Add compression
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0].uri);
    }
  } catch (error) {
    logger.error('Error choosing photo:', error);
    Alert.alert('Error', 'Failed to select photo');
  }
};

/**
 * Handle user logout
 */
export const handleUserLogout = async () => {
  try {
    // Use the session service sign out
    await signOut();
    
    // Clear profile cache
    await ProfileCacheService.clearCache();
    
    // Clear any remaining auth data
    await AsyncStorage.multiRemove(['userData', 'userDataTimestamp', 'supabase_auth_session']);
    
    // Force a second signOut to ensure auth state is cleared
    await supabase.auth.signOut();
    
    // Clear additional cache
    await AsyncStorage.multiRemove([
      'userData', 
      'userDataTimestamp', 
      'supabase_auth_session',
      'current_db_session_id',
      'db_session_start_time'
    ]);
  } catch (error) {
    logger.error('Error during logout:', error);
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const collectDeletionImageData = async (userId: string) => {
  const { data: userImages } = await supabase
    .from('deal_template')
    .select('image_metadata_id')
    .eq('user_id', userId)
    .not('image_metadata_id', 'is', null);

  const { data: profileImageMetadata } = await supabase
    .from('user')
    .select('profile_photo_metadata_id')
    .eq('user_id', userId)
    .not('profile_photo_metadata_id', 'is', null);

  const imageMetadataIds = [
    ...(userImages?.map((img) => img.image_metadata_id) || []),
    ...(profileImageMetadata?.map((img) => img.profile_photo_metadata_id) || []),
  ].filter(Boolean);

  if (imageMetadataIds.length === 0) {
    return { imageMetadataIds, cloudinaryPublicIds: [] as string[] };
  }

  const { data: imageMetadata } = await supabase
    .from('image_metadata')
    .select('cloudinary_public_id')
    .in('image_metadata_id', imageMetadataIds);

  const cloudinaryPublicIds = imageMetadata
    ?.map((img) => img.cloudinary_public_id)
    .filter(Boolean) || [];

  return { imageMetadataIds, cloudinaryPublicIds };
};

const clearProfilePhotoMetadataReference = async (userId: string) => {
  const { error } = await supabase
    .from('user')
    .update({ profile_photo_metadata_id: null })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error clearing profile photo metadata reference:', error);
    return;
  }

  logger.info('Cleared profile photo metadata reference');
};

const deleteImageMetadataRecords = async (imageMetadataIds: string[]) => {
  if (imageMetadataIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('image_metadata')
    .delete()
    .in('image_metadata_id', imageMetadataIds);

  if (error) {
    logger.error('Error deleting image metadata:', error);
    return;
  }

  logger.info('Deleted image metadata records');
};

const deleteCloudinaryImages = async (cloudinaryPublicIds: string[]) => {
  if (cloudinaryPublicIds.length === 0) {
    return;
  }

  try {
    logger.info('Attempting to delete Cloudinary images:', cloudinaryPublicIds.length);
    const { error } = await supabase.functions.invoke('delete-cloudinary-images', {
      body: { publicIds: cloudinaryPublicIds },
    });

    if (error) {
      logger.error('Error deleting Cloudinary images:', error);
      return;
    }

    logger.info('Successfully deleted Cloudinary images');
  } catch (error) {
    logger.error('Failed to call Cloudinary deletion function:', error);
  }
};

const deleteLegacyProfilePhoto = async (profile: ProfileWithPhoto | null) => {
  if (!profile?.profile_photo || profile.profile_photo === 'default_avatar.png') {
    return;
  }

  const photoPath = profile.profile_photo.startsWith('public/')
    ? profile.profile_photo
    : `public/${profile.profile_photo}`;

  const { error } = await supabase.storage
    .from('avatars')
    .remove([photoPath]);

  if (error) {
    logger.error('Error deleting legacy profile photo:', error);
    return;
  }

  logger.info('Deleted legacy profile photo');
};

const logRemainingDeals = async (userId: string) => {
  logger.info('Checking for any remaining user references before deletion...');
  const { data: remainingDeals } = await supabase
    .from('deal_template')
    .select('template_id, user_id')
    .eq('user_id', userId);

  if (remainingDeals && remainingDeals.length > 0) {
    logger.error('WARNING: Found remaining deal templates:', remainingDeals);
    return;
  }

  logger.info('Good: No remaining deal templates found');
};

const deletePublicUserRecord = async (userId: string): Promise<boolean> => {
  logger.info('Attempting to delete user from public.user table...');
  const { error } = await supabase
    .from('user')
    .delete()
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting user from public.user:', error);
    Alert.alert('Error', 'Failed to delete user profile. Please try again.');
    return false;
  }

  logger.info('Deleted user profile - database cascades handled related data');
  return true;
};

const verifyPublicUserDeleted = async (userId: string): Promise<boolean> => {
  logger.info('Verifying user deletion from public.user table...');
  const { data: remainingUser } = await supabase
    .from('user')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (remainingUser) {
    logger.error('ERROR: User still exists in public.user table after deletion attempt!', remainingUser);
    Alert.alert('Error', 'Failed to completely delete user profile. Please try again.');
    return false;
  }

  logger.info('Confirmed: User successfully deleted from public.user table');
  return true;
};

const deleteAuthUser = async (userId: string) => {
  try {
    logger.info('Attempting to delete user from auth.users via edge function');
    const { error } = await supabase.functions.invoke('delete-auth-user', {
      body: { userId },
    });

    if (error) {
      logger.error('Error deleting user from auth.users:', error);
      logger.info('All app data has been deleted. Auth user remains - may affect re-registration with same email.');
      return;
    }

    logger.info('Successfully deleted user from auth.users - user can re-register with same credentials');
  } catch (error) {
    logger.error('Failed to call auth user deletion function:', error);
    logger.info('All app data has been successfully deleted. Auth user may need manual cleanup.');
  }
};

const clearLocalDeletionData = async () => {
  await clearUserCache();
  ProfileCacheService.clearCache();
  await AsyncStorage.clear();

  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('Error signing out user:', error);
  }
};

/**
 * Handle account deletion - removes all user data from the database
 */
export const handleAccountDeletion = async (profile: ProfileWithPhoto | null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      return false;
    }

    logger.info('Starting comprehensive account deletion for user:', user.id);

    const { imageMetadataIds, cloudinaryPublicIds } = await collectDeletionImageData(user.id);
    await clearProfilePhotoMetadataReference(user.id);
    await deleteImageMetadataRecords(imageMetadataIds);
    await deleteCloudinaryImages(cloudinaryPublicIds);
    await deleteLegacyProfilePhoto(profile);
    await logRemainingDeals(user.id);

    const didDeletePublicUser = await deletePublicUserRecord(user.id);
    if (!didDeletePublicUser) {
      return false;
    }

    const isPublicUserDeleted = await verifyPublicUserDeleted(user.id);
    if (!isPublicUserDeleted) {
      return false;
    }

    logger.info('Waiting for database operations to complete...');
    await wait(1000);
    await deleteAuthUser(user.id);
    await clearLocalDeletionData();

    logger.info('Account deletion completed successfully');
    Alert.alert(
      'Success', 
      'Account and all associated data (including posts) deleted successfully. You will be automatically signed out.'
    );
    
    return true; // Indicates successful deletion
  } catch (error) {
    logger.error('Error during account deletion:', error);
    Alert.alert('Error', 'An unexpected error occurred during account deletion. Please try again.');
    return false;
  }
};
