import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import { clearUserCache } from './userService';
import { ProfileCacheService } from './profileCacheService';
import { signOut } from './sessionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
    const userEmail = user.email || 'unknown';
    const emailPrefix = userEmail.split('@')[0];
    const username = profile?.username || profile?.display_name || 'user';
    
    // Use the same filename format as onboarding
    const fileName = `user_${emailPrefix}_${username}_${Date.now()}.${fileExt}`;

    // Store reference to old photo before upload
    const oldPhotoPath = profile?.profile_photo && profile.profile_photo !== 'default_avatar.png' 
      ? (profile.profile_photo.startsWith('public/') ? profile.profile_photo : `public/${profile.profile_photo}`)
      : null;

    // Read the file as base64 and convert using toByteArray (same as onboarding)
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const byteArray = toByteArray(base64);

    // Upload new photo using the same pattern as onboarding
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`public/${fileName}`, byteArray, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false // Same as onboarding - timestamp prevents collisions
      });

    if (uploadError) throw uploadError;

    // The uploaded path will be `public/${fileName}`, which matches onboarding
    const uploadedPath = data?.path || `public/${fileName}`;

    // Update profile with new photo path
    await supabase.from('user').update({ profile_photo: uploadedPath }).eq('user_id', user.id);
    await supabase.auth.updateUser({ data: { profile_photo_url: uploadedPath } });

    // Clear ALL caches so everything updates
    await clearUserCache();
    await ProfileCacheService.clearCache();

    // Only delete old photo after successful upload and database update
    if (oldPhotoPath) {
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([oldPhotoPath]);
      
      if (deleteError) {
        console.warn('Failed to delete old photo:', deleteError);
        // Don't throw here - the upload was successful, deletion is cleanup
      }
    }

    // Update UI with new URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadedPath);
    setPhotoUrl(urlData.publicUrl);
    setCurrentUserPhotoUrl(urlData.publicUrl); // Also update current user's photo
    
    // Force refresh to update everything including BottomNavigation
    await refreshProfile();
    
    // Add a small delay and trigger a re-render
    setTimeout(() => {
      const newUrl = urlData.publicUrl + `?t=${Date.now()}`;
      setPhotoUrl(newUrl);
      setCurrentUserPhotoUrl(newUrl); // Also update current user's photo
    }, 100);
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    Alert.alert('Error', 'Failed to update profile photo. Please try again.');
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
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
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
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a photo!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
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
