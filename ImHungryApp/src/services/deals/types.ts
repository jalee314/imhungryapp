/**
 * @file Deal domain types and interfaces
 * Shared types for deal-related operations
 */

import { ImageVariants, ImageType } from '../imageProcessingService';

// Re-export image types for convenience
export type { ImageVariants, ImageType };

// Interface for creating a deal
export interface CreateDealData {
  title: string;
  description: string;
  imageUris: string[];
  thumbnailIndex: number;
  expirationDate: string | null;
  restaurantId: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
}

// Interface for the ranking function response
export interface RankedDealMeta {
  deal_id: string;
  distance?: number | null;
}

// Database representation of a deal
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
  user_city?: string | null;
  user_state?: string | null;
  restaurant_id: string;
  // Image metadata (primary/thumbnail image)
  image_metadata?: {
    variants: ImageVariants;
    image_type: ImageType;
  };
  // All images from deal_images table
  deal_images?: Array<{
    image_metadata_id: string;
    display_order: number;
    is_thumbnail: boolean;
    variants: ImageVariants;
  }>;
  // User profile metadata
  user_profile_metadata?: {
    variants: ImageVariants;
  };
  // Distance
  distance_miles?: number | null;
  // Vote information
  votes?: number;
  is_upvoted?: boolean;
  is_downvoted?: boolean;
  is_favorited?: boolean;
}

// Interface for fetching deal data for editing
export interface DealEditData {
  templateId: string;
  dealId: string;
  title: string;
  description: string | null;
  expirationDate: string | null;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  categoryId: string | null;
  cuisineId: string | null;
  isAnonymous: boolean;
  images: Array<{
    imageMetadataId: string;
    displayOrder: number;
    isThumbnail: boolean;
    url: string;
  }>;
}

// Interface for updating deal
export interface UpdateDealData {
  title?: string;
  description?: string;
  expirationDate?: string | null;
  isAnonymous?: boolean;
}

// Operation result type
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
