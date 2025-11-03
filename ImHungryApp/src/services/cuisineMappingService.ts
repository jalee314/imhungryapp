import { supabase } from '../../lib/supabase';
import { 
  cuisineConfig, 
  GOOGLE_PLACES_CUISINE_MAPPING,
  CUISINE_PRIORITY_ORDER,
  DEFAULT_CUISINE
} from '../config/cuisineConfig';

/**
 * Re-export for backwards compatibility
 * @deprecated Import directly from '../config/cuisine.config' instead
 */
export { GOOGLE_PLACES_CUISINE_MAPPING };

/**
 * Determines the best cuisine match for a restaurant based on Google Places types
 * @param googlePlacesTypes - Array of types from Google Places API
 * @returns cuisine name that exists in our database, or null if no match
 */
export const getCuisineFromGooglePlacesTypes = (googlePlacesTypes: string[]): string | null => {
  if (!googlePlacesTypes || googlePlacesTypes.length === 0) {
    return cuisineConfig.defaultCuisine; // Default to American if no types provided
  }

  // Check types in priority order (more specific types take precedence)
  for (const priorityType of cuisineConfig.priorityOrder) {
    if (googlePlacesTypes.includes(priorityType)) {
      const cuisine = cuisineConfig.getCuisineForType(priorityType);
      if (cuisine) {
        console.log(`🍽️ Mapped Google Places type '${priorityType}' to cuisine '${cuisine}'`);
        return cuisine;
      }
    }
  }

  // If no priority match found, check all types for any match
  for (const type of googlePlacesTypes) {
    const cuisine = cuisineConfig.getCuisineForType(type);
    if (cuisine) {
      console.log(`🍽️ Mapped Google Places type '${type}' to cuisine '${cuisine}'`);
      return cuisine;
    }
  }

  // Default fallback
  console.log(`🍽️ No cuisine mapping found for types [${googlePlacesTypes.join(', ')}], defaulting to '${cuisineConfig.defaultCuisine}'`);
  return cuisineConfig.defaultCuisine;
};

/**
 * Gets the cuisine_id for a given cuisine name from the database
 * @param cuisineName - Name of the cuisine (e.g., 'Italian', 'Chinese')
 * @returns cuisine_id or null if not found
 */
export const getCuisineIdByName = async (cuisineName: string): Promise<string | null> => {
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
export const createRestaurantCuisineEntry = async (
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
