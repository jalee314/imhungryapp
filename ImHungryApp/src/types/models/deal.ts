/**
 * Deal Type Definitions
 * 
 * Centralized type definitions for deals across the application.
 * These types represent the domain model for deals.
 */

import { ImageVariants, ImageType } from '../../services/imageProcessingService';

/**
 * Deal as displayed in the UI (used by components)
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
  dealType?: string; // e.g., "BOGO", "50% Off", "Happy Hour", etc.
  timeAgo: string;
  author?: string;
  milesAway?: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
}

/**
 * Deal as stored in the database (from queries)
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
 * Ranked deal IDs from ranking function
 */
export interface RankedDealIds {
  deal_ids: string[];
}

