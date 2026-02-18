import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import type { User, UserDisplayData } from '../types/user';

export type { User, UserDisplayData } from '../types/user';

/**
 * Get the current authenticated user's ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

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
 * Check if a phone number exists in the system (expects E.164 or normalized input used by RPC)
 */
export const checkPhoneExists = async (phoneInput: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_phone_exists', { phone_input: phoneInput });
    if (error) {
      console.error('Error checking phone existence:', error);
      throw new Error('Unable to verify phone number');
    }
    return data || false;
  } catch (error) {
    console.error('Error in checkPhoneExists:', error);
    throw error as any;
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