import { supabase } from '../../lib/supabase';

/**
 * Maps Google Places API types to cuisine names in our database
 * Based on the Google Places types returned in the search results
 */
const GOOGLE_PLACES_CUISINE_MAPPING: Record<string, string> = {
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
 * Determines the best cuisine match for a restaurant based on Google Places types
 * @param googlePlacesTypes - Array of types from Google Places API
 * @returns cuisine name that exists in our database, or null if no match
 */
const getCuisineFromGooglePlacesTypes = (googlePlacesTypes: string[]): string | null => {
  if (!googlePlacesTypes || googlePlacesTypes.length === 0) {
    return 'American'; // Default to American if no types provided
  }

  // Priority mapping: more specific types take precedence
  const priorityOrder = [
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
  ];

  // Check types in priority order
  for (const priorityType of priorityOrder) {
    if (googlePlacesTypes.includes(priorityType)) {
      const cuisine = GOOGLE_PLACES_CUISINE_MAPPING[priorityType];
      if (cuisine) {
        console.log(`🍽️ Mapped Google Places type '${priorityType}' to cuisine '${cuisine}'`);
        return cuisine;
      }
    }
  }

  // If no priority match found, check all types for any match
  for (const type of googlePlacesTypes) {
    const cuisine = GOOGLE_PLACES_CUISINE_MAPPING[type.toLowerCase()];
    if (cuisine) {
      console.log(`🍽️ Mapped Google Places type '${type}' to cuisine '${cuisine}'`);
      return cuisine;
    }
  }

  // Default fallback
  console.log(`🍽️ No cuisine mapping found for types [${googlePlacesTypes.join(', ')}], defaulting to 'American'`);
  return 'American';
};

/**
 * Gets the cuisine_id for a given cuisine name from the database
 * @param cuisineName - Name of the cuisine (e.g., 'Italian', 'Chinese')
 * @returns cuisine_id or null if not found
 */
const getCuisineIdByName = async (cuisineName: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('cuisine')
      .select('cuisine_id')
      .eq('cuisine_name', cuisineName)
      .single();

    if (error) {
      console.error(`Error fetching cuisine_id for ${cuisineName}:`, error);
      return null;
    }

    return data?.cuisine_id || null;
  } catch (error) {
    console.error(`Unexpected error fetching cuisine_id for ${cuisineName}:`, error);
    return null;
  }
};

/**
 * Creates a restaurant_cuisine entry for a restaurant
 * @param restaurantId - ID of the restaurant
 * @param cuisineId - ID of the cuisine
 * @returns success boolean
 */
const createRestaurantCuisineEntry = async (
  restaurantId: string,
  cuisineId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('restaurant_cuisine')
      .insert({
        restaurant_id: restaurantId,
        cuisine_id: cuisineId
      });

    if (error) {
      console.error('Error creating restaurant_cuisine entry:', error);
      return false;
    }

    console.log(`✅ Created restaurant_cuisine entry: ${restaurantId} -> ${cuisineId}`);
    return true;
  } catch (error) {
    console.error('Unexpected error creating restaurant_cuisine entry:', error);
    return false;
  }
};

/**
 * Maps Google Places types to cuisine and creates restaurant_cuisine entry
 * This should be called after a restaurant is created
 * @param restaurantId - ID of the newly created restaurant
 * @param googlePlacesTypes - Array of types from Google Places API
 * @returns success boolean
 */
export const mapAndCreateRestaurantCuisine = async (
  restaurantId: string,
  googlePlacesTypes: string[]
): Promise<boolean> => {
  try {
    // Get the best cuisine match
    const cuisineName = getCuisineFromGooglePlacesTypes(googlePlacesTypes);
    if (!cuisineName) {
      console.log('⚠️ No cuisine mapping found, skipping restaurant_cuisine creation');
      return false;
    }

    // Get the cuisine_id from database  
    const cuisineId = await getCuisineIdByName(cuisineName);
    if (!cuisineId) {
      console.error(`❌ Cuisine '${cuisineName}' not found in database`);
      return false;
    }

    // Check if entry already exists to avoid duplicates
    const { data: existingEntry } = await supabase
      .from('restaurant_cuisine')
      .select('restaurant_id')
      .eq('restaurant_id', restaurantId)
      .eq('cuisine_id', cuisineId)
      .single();

    if (existingEntry) {
      console.log(`ℹ️ Restaurant_cuisine entry already exists for ${restaurantId} -> ${cuisineId}`);
      return true;
    }

    // Create the restaurant_cuisine entry
    return await createRestaurantCuisineEntry(restaurantId, cuisineId);
  } catch (error) {
    console.error('Error in mapAndCreateRestaurantCuisine:', error);
    return false;
  }
};
