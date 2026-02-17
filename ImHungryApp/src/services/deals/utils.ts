/**
 * @file Deal service internal utilities
 * Private helper functions used across deal modules
 */

import { supabase } from '../../../lib/supabase';
import { processImageWithEdgeFunction } from '../imageProcessingService';

/**
 * Get current authenticated user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get user's location coordinates from database
 */
export const getUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }

    const { data: userData, error } = await supabase
      .rpc('get_user_location_coords', { user_uuid: user.id });

    if (error) {
      return null;
    }

    if (!userData || userData.length === 0) {
      return null;
    }

    const locationData = userData[0];

    if (!locationData.lat || !locationData.lng) {
      return null;
    }

    return {
      lat: locationData.lat,
      lng: locationData.lng
    };
  } catch (error) {
    return null;
  }
};

/**
 * Upload image and get metadata ID via Cloudinary
 */
export const uploadDealImage = async (imageUri: string): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return null;
    }

    const result = await processImageWithEdgeFunction(imageUri, 'deal_image');

    if (!result.success || !result.metadataId) {
      console.error('Failed to process image:', result.error);
      return null;
    }

    return result.metadataId;
  } catch (error) {
    console.error('Error in uploadDealImage:', error);
    return null;
  }
};

/**
 * Parse and format date string to ISO format
 */
export const parseDate = (dateString: string | null): string | null => {
  if (!dateString || dateString === 'Unknown') {
    return null;
  }
  try {
    let date: Date;
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
};

/**
 * Calculate human-readable time ago string
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};
