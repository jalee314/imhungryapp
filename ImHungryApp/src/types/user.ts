// ==========================================
// User Domain Types
// ==========================================

import { ImageVariants } from './common';

/**
 * Core user type from database
 */
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

/**
 * User data for display purposes
 */
export interface UserDisplayData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

/**
 * User's posted deal (for profile page)
 */
export interface UserPost {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: { uri: string } | any;
  imageVariants?: ImageVariants;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine: string;
  cuisineId?: string;
  timeAgo: string;
  author: string;
  milesAway: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
}

/**
 * Profile data loaded for display
 */
export interface UserProfileData {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: UserDisplayData;
}

/**
 * Cached profile data including posts
 */
export interface UserProfileCache {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: UserDisplayData;
  userPosts: UserPost[];
}

/**
 * Full profile with admin fields (for admin panel)
 */
export interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
  profile_photo: string | null;
  location_city: string | null;
  is_admin: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspension_until: string | null;
  ban_reason: string | null;
  suspended_reason: string | null;
  warning_count: number;
  created_at: string;
}

/**
 * Result from profile loading service
 */
export interface ProfileLoadingResult {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: UserDisplayData;
  userPosts: UserPost[];
  currentUserPhotoUrl?: string | null;
}
