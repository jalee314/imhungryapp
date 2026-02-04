/**
 * Profile Feature Types
 * 
 * Domain-specific types for user profiles.
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

export interface UserDisplayData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

export interface UserPost {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: { uri: string } | any;
  imageVariants?: any;
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

export interface UserProfileData {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: UserDisplayData;
}

export interface UserProfileCache {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: UserDisplayData;
  userPosts: UserPost[];
}

export interface ProfileLoadingResult {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: UserDisplayData;
  userPosts: UserPost[];
  currentUserPhotoUrl?: string | null;
}
