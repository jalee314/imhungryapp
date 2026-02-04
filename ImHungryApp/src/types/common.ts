/**
 * Common Types - Shared across features
 */

// Image Processing Types
export type ImageType = 'profile_image' | 'deal_image' | 'restaurant_image' | 'franchise_logo_image';

export interface ImageVariants {
  original?: string;
  large?: string;
  medium?: string;
  small?: string;
  thumbnail?: string;
}

export interface VariantContext {
  devicePixelRatio?: number;
  screenWidth?: number;
  componentType: 'profile' | 'deal' | 'restaurant' | 'franchise_logo';
  displaySize: { width: number; height: number };
  networkType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
}

// Interaction & Analytics Types
export type InteractionType = 
  | 'impression'
  | 'click-open'
  | 'click-through'
  | 'upvote'
  | 'downvote'
  | 'save'
  | 'favorite'
  | 'redemption_proxy'
  | 'report'
  | 'block'
  | 'share';

export type InteractionSource = 
  | 'feed'
  | 'search'
  | 'favorites'
  | 'profile'
  | 'discover';

// Category and Cuisine Types
export interface Category {
  id: string;
  name: string;
}

export interface Cuisine {
  id: string;
  name: string;
}

// Restaurant base types
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageMetadataId?: string;
  brandId?: string;
}

export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
  types: string[];
}

export interface RestaurantSearchResult {
  success: boolean;
  restaurants: GooglePlaceResult[];
  count: number;
  error?: string;
}
