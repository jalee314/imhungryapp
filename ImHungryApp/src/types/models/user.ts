/**
 * User Type Definitions
 * 
 * Centralized type definitions for users and profiles across the application.
 */

import { ImageVariants } from '../../services/imageProcessingService';

/**
 * User data from database
 */
export interface User {
  user_id: string;
  display_name: string | null;
  profile_photo: string | null;
  profile_photo_metadata_id?: string | null;
  created_at: string;
  location?: any; // PostGIS geography type
  city?: string | null;
  state?: string | null;
}

/**
 * User profile data (formatted for display)
 */
export interface UserProfileData {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
}

/**
 * User profile cache entry
 */
export interface UserProfileCache {
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
}

/**
 * User post data
 */
export interface UserPost {
  deal_id: string;
  title: string;
  restaurant_name: string;
  image_url: string | null;
  image_metadata?: {
    variants: ImageVariants;
  };
  created_at: string;
  votes: number;
  distance_miles: number | null;
  username?: string;
  profilePicture?: string | null;
}

/**
 * Basic user data (for UI display)
 */
export interface UserData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

