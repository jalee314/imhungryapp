// ==========================================
// Restaurant Domain Types
// ==========================================

import { ImageVariants } from './common';

/**
 * Core restaurant type
 */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageMetadataId?: string;
  brandId?: string;
}

/**
 * Restaurant from Google Places API
 */
export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
  types: string[];
}

/**
 * Result from restaurant search
 */
export interface RestaurantSearchResult {
  success: boolean;
  restaurants: GooglePlaceResult[];
  count: number;
  error?: string;
}

/**
 * Restaurant in discover feed
 */
export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  logo_image?: string;
  deal_count: number;
  distance_miles: number;
  lat: number;
  lng: number;
}

/**
 * Result from discover feed
 */
export interface DiscoverResult {
  success: boolean;
  restaurants: DiscoverRestaurant[];
  count: number;
  error?: string;
}

/**
 * Deal associated with a restaurant
 */
export interface RestaurantDeal {
  deal_id: string;
  template_id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
  start_date: string;
  end_date: string | null;
  votes: number;
  is_upvoted: boolean;
  is_downvoted: boolean;
  is_favorited: boolean;
  image_variants?: ImageVariants;
}
