// ==========================================
// Deal Domain Types
// ==========================================

import { ImageVariants, ImageType } from './common';

/**
 * Deal as displayed in the UI (transformed from DatabaseDeal)
 */
export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  imageVariants?: ImageVariants;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  cuisineId?: string;
  dealType?: string; // e.g., "BOGO", "50% Off", "Happy Hour"
  timeAgo: string;
  author?: string;
  milesAway?: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  userCity?: string;
  userState?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
  expirationDate?: string | null;
}

/**
 * Deal as stored in the database
 */
export interface DatabaseDeal {
  deal_id: string;
  template_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  restaurant_name: string;
  restaurant_address: string;
  cuisine_name: string | null;
  cuisine_id: string | null;
  category_name: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  is_anonymous: boolean;
  user_id: string;
  user_display_name: string | null;
  user_profile_photo: string | null;
  restaurant_id: string;
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
  user_profile_metadata?: {
    variants: ImageVariants;
  };
  distance_miles?: number | null;
  votes?: number;
  is_upvoted?: boolean;
  is_downvoted?: boolean;
  is_favorited?: boolean;
}

/**
 * Data required to create a new deal
 */
export interface CreateDealData {
  title: string;
  description: string;
  imageUri: string | null;
  expirationDate: string | null;
  restaurantId: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
}

/**
 * Metadata for ranked deals (used in feed algorithms)
 */
export interface RankedDealMeta {
  deal_id: string;
  distance?: number | null;
}

/**
 * Deal vote tracking
 */
export interface DealVote {
  deal_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}
