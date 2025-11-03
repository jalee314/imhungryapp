/**
 * Cuisine Configuration
 * 
 * Centralized configuration for cuisine mappings and business rules.
 * This separates business data from application logic, making it easier
 * to maintain and update cuisine mappings without touching service code.
 */

/**
 * Maps Google Places API types to cuisine names in our database
 * Based on the Google Places types returned in the search results
 */
export const GOOGLE_PLACES_CUISINE_MAPPING: Record<string, string> = {
  // American variations
  'american_restaurant': 'American',
  'hamburger_restaurant': 'American',
  'fast_food_restaurant': 'American',
  'steak_house': 'American',
  
  // Asian cuisines
  'chinese_restaurant': 'Chinese',
  'japanese_restaurant': 'Japanese',
  'korean_restaurant': 'Korean',
  'thai_restaurant': 'Thai',
  'vietnamese_restaurant': 'Vietnamese',
  'indian_restaurant': 'Indian',
  'sushi_restaurant': 'Japanese',
  'ramen_restaurant': 'Japanese',
  'noodle_house': 'Japanese', // Could also be Chinese/Vietnamese, but Japanese is common
  
  // European cuisines
  'italian_restaurant': 'Italian',
  'french_restaurant': 'French',
  'greek_restaurant': 'Greek',
  'german_restaurant': 'German',
  
  // Middle Eastern/Mediterranean
  'mediterranean_restaurant': 'Mediterranean',
  'middle_eastern_restaurant': 'MiddleEastern',
  
  // Mexican/Latin American
  'mexican_restaurant': 'Mexican',
  
  // Other specific types
  'seafood_restaurant': 'American', // Default to American for seafood
  'pizza_restaurant': 'Italian',
  'sandwich_shop': 'American',
  'vegetarian_restaurant': 'American', // Could be any cuisine, defaulting to American
  'vegan_restaurant': 'American',
  
  // General fallbacks
  'restaurant': 'American', // Default fallback
  'food': 'American',
  'cafe': 'American',
  'bakery': 'American',
  'meal_takeaway': 'American',
  'meal_delivery': 'American',
  'bar': 'American',
  'coffee_shop': 'American',
  'ice_cream_shop': 'American',
  'brunch_restaurant': 'American',
  'breakfast_restaurant': 'American',
};

/**
 * Priority order for cuisine type matching
 * More specific types take precedence over general ones
 */
export const CUISINE_PRIORITY_ORDER: readonly string[] = [
  // Highly specific cuisine types (highest priority)
  'chinese_restaurant',
  'japanese_restaurant', 
  'korean_restaurant',
  'thai_restaurant',
  'vietnamese_restaurant',
  'indian_restaurant',
  'italian_restaurant',
  'french_restaurant',
  'greek_restaurant',
  'mexican_restaurant',
  'mediterranean_restaurant',
  'middle_eastern_restaurant',
  'german_restaurant',
  'sushi_restaurant',
  'ramen_restaurant',
  
  // Moderately specific
  'pizza_restaurant',
  'seafood_restaurant',
  'steak_house',
  'hamburger_restaurant',
  
  // Less specific (lower priority)
  'american_restaurant',
  'fast_food_restaurant',
  'sandwich_shop',
  'vegetarian_restaurant',
  'vegan_restaurant',
  
  // General fallbacks (lowest priority)
  'restaurant',
  'food',
  'cafe',
  'bakery',
  'meal_takeaway',
  'meal_delivery',
  'bar',
  'coffee_shop'
] as const;

/**
 * Default cuisine when no match is found
 */
export const DEFAULT_CUISINE = 'American';

/**
 * cuisineConfig provides a centralized interface for cuisine-related configuration
 * 
 * This object encapsulates all cuisine business rules and mappings,
 * making it easy to access and modify cuisine configuration in one place.
 */
export const cuisineConfig = {
  /**
   * Get all Google Places cuisine mappings
   */
  get mappings(): Record<string, string> {
    return GOOGLE_PLACES_CUISINE_MAPPING;
  },

  /**
   * Get the priority order for cuisine matching
   */
  get priorityOrder(): readonly string[] {
    return CUISINE_PRIORITY_ORDER;
  },

  /**
   * Get the default cuisine name
   */
  get defaultCuisine(): string {
    return DEFAULT_CUISINE;
  },

  /**
   * Get cuisine name for a specific Google Places type
   */
  getCuisineForType(googlePlaceType: string): string | null {
    return this.mappings[googlePlaceType.toLowerCase()] || null;
  },

  /**
   * Check if a Google Places type has a cuisine mapping
   */
  hasMapping(googlePlaceType: string): boolean {
    return googlePlaceType.toLowerCase() in this.mappings;
  }
};

