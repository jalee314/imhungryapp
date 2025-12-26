// ==========================================
// Cuisine & Category Domain Types
// ==========================================

/**
 * Deal category (e.g., "BOGO", "Happy Hour")
 */
export interface Category {
  id: string;
  name: string;
}

/**
 * Cuisine type (e.g., "Italian", "Mexican")
 */
export interface Cuisine {
  id: string;
  name: string;
}

/**
 * User's cuisine preference
 */
export interface CuisinePreference {
  user_id: string;
  cuisine_id: string;
  preference_level: number;
  created_at: string;
  updated_at: string;
}

/**
 * Result from cuisine update operation
 */
export interface CuisineUpdateResult {
  success: boolean;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
  summary: string;
  details: Array<{
    restaurant_id: string;
    name: string;
    google_place_id: string | null;
    types: string[];
    detected_cuisine: string | null;
    updated: boolean;
  }>;
}
