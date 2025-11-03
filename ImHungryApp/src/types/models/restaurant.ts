/**
 * Restaurant Type Definitions
 * 
 * Centralized type definitions for restaurants across the application.
 */

/**
 * Google Place result from search
 */
export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
  types: string[]; // Google Places API types for cuisine mapping
}

/**
 * Restaurant search result
 */
export interface RestaurantSearchResult {
  success: boolean;
  restaurants: GooglePlaceResult[];
  count: number;
  error?: string;
}

/**
 * Restaurant data from database
 */
export interface Restaurant {
  restaurant_id: string;
  name: string;
  address: string;
  location: any; // PostGIS geography type
  google_place_id: string;
  brand_id?: string | null;
  created_at: string;
  logo_image?: string | null;
}

/**
 * Restaurant with deals (for discover feed)
 */
export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  logo_image?: string | null;
  deal_count: number;
  distance_miles: number;
}

/**
 * Restaurant location coordinates
 */
export interface RestaurantLocation {
  lat: number;
  lng: number;
}

