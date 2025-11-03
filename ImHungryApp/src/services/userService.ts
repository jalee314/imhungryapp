import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { getCurrentUserId as getAuthUserId } from '../utils/authUtils';

// Get public URL for a file in Supabase Storage
const getPublicUrl = (path: string) => {
  // Profile photos are stored in the 'avatars' bucket
  // The path in the database is just the filename (e.g., "public/user_jasonklee1003_jasklee_1757535543645.jpg")
  const { data } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(path);
  
  return data.publicUrl;
};


// Define the User interface to match your database schema
export interface User {
  user_id: string;
  display_name: string;
  email: string;
  profile_photo: string | null;
  location_city: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  location_lat: number | null;
  location_long: number | null;
}

// Interface for the component (simplified)
export interface UserDisplayData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

// Note: getCurrentUserId is now imported from authUtils as getAuthUserId
// Use getAuthUserId() instead
const getCurrentUserId = getAuthUserId;

/**
 * Fetches user data from Supabase
 */
export const fetchUserData = async (): Promise<UserDisplayData> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No authenticated user');

    const { data: user, error } = await supabase
      .from('user')
      .select(`
        *,
        image_metadata:profile_photo_metadata_id (
          variants
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!user) throw new Error('User not found');

    console.log('📸 User data fetched:', {
      hasImageMetadata: !!user.image_metadata,
      variants: user.image_metadata?.variants,
      oldProfilePhoto: user.profile_photo
    });

    // Use the medium variant for profile display
    const profilePicture = user.image_metadata?.variants?.medium 
      || user.image_metadata?.variants?.small
      || user.image_metadata?.variants?.thumbnail
      || user.profile_photo;  // Fallback to old path

    console.log('📸 Final profilePicture URL:', profilePicture);

    return {
      username: user.display_name || 'User',
      profilePicture,
      city: user.location_city || 'City',
      state: 'CA'
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Updates user data in Supabase
 */
export const updateUserData = async (updates: Partial<User>): Promise<UserDisplayData> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('user')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    // Process the profile photo URL
    let profilePicture = null;
    if (data.profile_photo) {
      if (data.profile_photo.startsWith('http')) {
        profilePicture = data.profile_photo;
      } else {
        profilePicture = getPublicUrl(data.profile_photo);
      }
    }

    // Transform and cache the updated data
    const displayData: UserDisplayData = {
      username: data.display_name,
      profilePicture: profilePicture,
      city: data.location_city || 'Unknown',
      state: 'CA',
    };

    await AsyncStorage.setItem('userData', JSON.stringify(displayData));
    await AsyncStorage.setItem('userDataTimestamp', Date.now().toString());

    return displayData;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw new Error('Failed to update user data');
  }
};

/**
 * Get full user profile data (for profile screens)
 */
export const getFullUserProfile = async (): Promise<User | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching full user profile:', error);
    return null;
  }
};

/**
 * Check if an email exists in the system
 * 
 * This function uses a database RPC call to securely check email existence
 * without exposing sensitive user data. The database function is callable
 * by anonymous users specifically for authentication purposes.
 * 
 * @param email - The email address to check
 * @returns Promise<boolean> - true if email exists, false otherwise
 * @throws Error if database connection fails or RPC call errors
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_email_exists', { 
      email_input: email.toLowerCase().trim() 
    });

    if (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Unable to verify email address');
    }

    return data || false;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    throw error;
  }
};

/**
 * Clear user data cache
 */
export const clearUserCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userDataTimestamp');
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
};