/**
 * Types Index - Main entry point for type definitions
 * 
 * This file re-exports types from:
 * 1. Feature-specific types (from src/features/*)
 * 2. Common shared types (from src/types/common.ts)
 * 3. Navigation types (from src/types/navigation.ts)
 * 
 * For new code, prefer importing directly from the feature modules.
 */

// ==========================================
// Re-export from feature modules
// ==========================================

// Auth feature types
export type {
  AuthUser,
  AuthContextType,
  AuthProviderProps,
  PasswordResetResult,
  SignUpData,
  OnboardingUserData,
} from '../features/auth/types';

// Feed feature types
export type {
  Deal,
  DatabaseDeal,
  CreateDealData,
  DealCardProps,
} from '../features/feed/types';

// Favorites feature types
export type {
  FavoriteDealData,
} from '../features/favorites/types';

// Discover feature types
export type {
  DiscoverRestaurant,
  RestaurantDeal,
} from '../features/discover/types';

// Contribution feature types
export type {
  Restaurant as ContributionRestaurant,
  DealFormData,
  UserData,
} from '../features/contribution/types';

// Admin feature types
export type {
  AdminReport,
  AdminDeal as AdminDealType,
  AdminUser as AdminUserType,
} from '../features/admin/types';

// ==========================================
// Re-export from common types
// ==========================================

export type {
  ImageType,
  ImageVariants,
  VariantContext,
  InteractionType,
  InteractionSource,
  Category,
  Cuisine,
  Restaurant,
  GooglePlaceResult,
  RestaurantSearchResult,
} from './common';

// ==========================================
// Re-export from navigation types
// ==========================================

export type {
  RootStackParamList,
  MainTabParamList,
} from './navigation';

// ==========================================
// Legacy types (to be migrated to features)
// ==========================================

// User Types
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
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
}

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

// Discover Result
export interface DiscoverResult {
  success: boolean;
  restaurants: DiscoverRestaurant[];
  count: number;
  error?: string;
}

// Favorites Types (legacy - use features/favorites/types instead)
export interface FavoriteDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageVariants?: any;
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  dealCount: number;
  cuisineName: string;
  categoryName: string;
  createdAt: string;
  isFavorited: boolean;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  isAnonymous: boolean;
}

export interface FavoriteRestaurant {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  distance: string;
  dealCount: number;
  cuisineName: string;
  isFavorited: boolean;
}

export interface RestaurantFavoriteResult {
  success: boolean;
  error?: string;
}

// Admin Types (legacy)
export interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  is_admin: boolean;
}

export interface Report {
  report_id: string;
  deal_id: string;
  reporter_user_id: string;
  uploader_user_id: string;
  reason_code_id: string;
  reason_text: string | null;
  status: 'pending' | 'review' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_by: string | null;
  resolution_action: string | null;
  deal?: {
    title: string;
    description: string;
    image_url?: string;
    restaurant_name?: string;
  };
  reporter?: {
    display_name: string;
  };
  uploader?: {
    display_name: string;
  };
  reason_code?: {
    reason_code: string;
    description: string;
  };
}

export interface AdminDeal {
  deal_instance_id: string;
  template_id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  is_hidden: boolean;
  restaurant_name: string;
  restaurant_id: string;
  user_id: string;
  user_display_name: string;
  report_count: number;
}

export interface ReasonCode {
  reason_code_id: string;
  reason_code: string;
  description: string;
}

export interface BlockedUser {
  block_id: string;
  blocker_user_id: string;
  blocked_user_id: string;
  created_at: string;
  blocked_user?: {
    display_name: string;
    profile_photo: string | null;
  };
}

// RankedDealMeta for deal ranking
export interface RankedDealMeta {
  deal_id: string;
  distance?: number | null;
}
