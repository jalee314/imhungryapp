import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import { clearUserCache } from './userService';
import { ProfileCacheService } from './profileCacheService';
import { signOut } from './sessionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processImageWithEdgeFunction, ImageType } from './imageProcessingService';

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
    
    // Process image with Cloudinary via edge function
    const result = await processImageWithEdgeFunction(photoUri, 'profile_image');
    
    if (!result.success || !result.metadataId) {
      Alert.alert('Upload Failed', result.error || 'Failed to process image');
      return;
    }
    
    console.log('Image processed successfully, metadataId:', result.metadataId);
    
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
      console.error('Error updating profile:', updateError);
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
      quality: 0.7,  // Add compression
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
      quality: 0.7,  // Add compression
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
    console.error('Error during logout:', error);
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
  }
};

/**
 * Handle account deletion
 */
export const handleAccountDeletion = async (profile: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    // Delete profile photo from storage if it exists
    if (profile?.profile_photo && profile.profile_photo !== 'default_avatar.png') {
      const photoPath = profile.profile_photo.startsWith('public/') 
        ? profile.profile_photo 
        : `public/${profile.profile_photo}`;
        
      const { error: deletePhotoError } = await supabase.storage
        .from('avatars')
        .remove([photoPath]);
      
      if (deletePhotoError) {
        console.error('Error deleting profile photo:', deletePhotoError);
      }
    }

    // Delete user from public.user table (if record exists)
    const { error: deleteUserError } = await supabase
      .from('user')
      .delete()
      .eq('user_id', user.id);

    if (deleteUserError) {
      console.error('Error deleting user from public.user:', deleteUserError);
      // Don't fail if user record doesn't exist in public.user table
    }

    // Note: User will remain in auth.users table - delete manually from Supabase dashboard
    console.log('User deleted from app. Manual deletion from auth.users required.');

    // Sign out the user (this will end their session)
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out user:', signOutError);
      // Continue with deletion even if sign out fails
    }

    Alert.alert('Success', 'Account deleted successfully');
    
    return true; // Indicates successful deletion
  } catch (error) {
    console.error('Error during account deletion:', error);
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    return false;
  }
};
