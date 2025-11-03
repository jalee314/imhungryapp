/**
 * Cuisine Type Definitions
 * 
 * Centralized type definitions for cuisines across the application.
 */

/**
 * Cuisine data from database
 */
export interface Cuisine {
  cuisine_id: string;
  cuisine_name: string;
  created_at?: string;
}

/**
 * Category data from database
 */
export interface Category {
  category_id: string;
  category_name: string;
  created_at?: string;
}

