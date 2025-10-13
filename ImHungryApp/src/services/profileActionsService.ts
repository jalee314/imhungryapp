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

    // Get the actual image metadata with Cloudinary public IDs for deletion
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

    // Delete user's deal templates (posts) BEFORE deleting user
    // This will also cascade delete deal_instances
    const { error: dealError } = await supabase
      .from('deal_template')
      .delete()
      .eq('user_id', user.id);

    if (dealError) {
      console.error('Error deleting user deal templates:', dealError);
    } else {
      console.log('Deleted user deal templates and associated instances');
    }

    // Delete image metadata records for user's images
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

    // Try to delete Cloudinary images if we have public IDs
    if (cloudinaryPublicIds.length > 0) {
      try {
        console.log('Attempting to delete Cloudinary images:', cloudinaryPublicIds.length);
        // Call edge function to delete Cloudinary images
        const { error: cloudinaryError } = await supabase.functions.invoke('delete-cloudinary-images', {
          body: { publicIds: cloudinaryPublicIds }
        });
        
        if (cloudinaryError) {
          console.error('Error deleting Cloudinary images:', cloudinaryError);
          // Don't fail the deletion if Cloudinary cleanup fails
        } else {
          console.log('Successfully deleted Cloudinary images');
        }
      } catch (error) {
        console.error('Failed to call Cloudinary deletion function:', error);
        // Continue with account deletion even if image cleanup fails
      }
    }

    // Delete legacy profile photo from storage if it exists
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

    // Delete user from public.user table
    // This will trigger CASCADE deletes for:
    // - favorites, interactions, notifications, sessions
    // - user_blocks, user_cuisine_preferences, user_feedback  
    // - user_reports (as reporter)
    // - deal_template already deleted above
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

    // Try to delete user from auth.users table using edge function with service role permissions
    try {
      console.log('Attempting to delete user from auth.users via edge function');
      const { error: deleteAuthUserError } = await supabase.functions.invoke('delete-auth-user', {
        body: { userId: user.id }
      });
      
      if (deleteAuthUserError) {
        console.error('Error deleting user from auth.users:', deleteAuthUserError);
        console.log('User can still be manually deleted from Supabase dashboard for re-registration');
      } else {
        console.log('Successfully deleted user from auth.users - user can now re-register');
      }
    } catch (error) {
      console.error('Failed to call auth user deletion function:', error);
      console.log('User remains in auth.users table - manual deletion required for re-registration');
    }

    // Clear local cache
    await clearUserCache();
    ProfileCacheService.clearCache();
    await AsyncStorage.clear();

    // Sign out the user (this will end their session)
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out user:', signOutError);
      // Continue with deletion even if sign out fails
    }

    console.log('Account deletion completed successfully');
    Alert.alert(
      'Success', 
      'Account and all associated data (including posts) deleted successfully. You will be automatically signed out.'
    );
    
    return true; // Indicates successful deletion
  } catch (error) {
    console.error('Error during account deletion:', error);
    Alert.alert('Error', 'An unexpected error occurred during account deletion. Please try again.');
    return false;
  }
};
