import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

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
    // First try to get from cache
    const cachedUser = await AsyncStorage.getItem('userData');
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      // Check if cache is recent (less than 5 minutes old)
      const cacheTime = await AsyncStorage.getItem('userDataTimestamp');
      if (cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
        return parsed;
      }
    }

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Fetch user data from Supabase
    const { data: userData, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Important: Process the profile photo URL
    let profilePicture = null;
      if (userData.profile_photo) {
        if (userData.profile_photo.startsWith('http')) {
          profilePicture = userData.profile_photo;
        } else {
          profilePicture = getPublicUrl(userData.profile_photo);
        }
      }

      const displayData: UserDisplayData = {
        username: userData.display_name,
        profilePicture: profilePicture,
        city: userData.location_city || 'Unknown',
        state: 'CA',
      };

    // Cache the data
    await AsyncStorage.setItem('userData', JSON.stringify(displayData));
    await AsyncStorage.setItem('userDataTimestamp', Date.now().toString());
    
    return displayData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      username: 'Guest User',
      profilePicture: null,
      city: 'Unknown',
      state: 'Location',
    };
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