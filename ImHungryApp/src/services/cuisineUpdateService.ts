import { supabase } from '../../lib/supabase';

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

/**
 * Update restaurant cuisines using Google Places API data
 * This function calls the update-restaurant-cuisines edge function
 */
export const updateRestaurantCuisines = async (
  batchSize: number = 50,
  dryRun: boolean = false
): Promise<CuisineUpdateResult> => {
  try {
    console.log(`🔄 Starting cuisine update process (batch: ${batchSize}, dryRun: ${dryRun})`);

    const { data, error } = await supabase.functions.invoke('update-restaurant-cuisines', {
      body: {
        batchSize,
        dryRun,
      },
    });

    if (error) {
      throw error;
    }

    console.log('✅ Cuisine update completed:', data.summary);
    return data;
  } catch (error) {
    console.error('❌ Error updating restaurant cuisines:', error);
    throw new Error(`Failed to update restaurant cuisines: ${error.message}`);
  }
};

/**
 * Get restaurants without cuisine assignments
 */
export const getRestaurantsWithoutCuisines = async (): Promise<{
  count: number;
  restaurants: Array<{
    restaurant_id: string;
    name: string;
    address: string;
    google_place_id: string | null;
  }>;
}> => {
  try {
    const { data, error } = await supabase
      .from('restaurant')
      .select(`
        restaurant_id,
        name,
        address,
        google_place_id,
        restaurant_cuisine!left (
          cuisine_id
        )
      `)
      .is('restaurant_cuisine.cuisine_id', null)
      .limit(100);

    if (error) throw error;

    return {
      count: data.length,
      restaurants: data.map(r => ({
        restaurant_id: r.restaurant_id,
        name: r.name,
        address: r.address,
        google_place_id: r.google_place_id,
      })),
    };
  } catch (error) {
    console.error('Error fetching restaurants without cuisines:', error);
    throw error;
  }
};

/**
 * Get all available cuisines
 */
export const getAvailableCuisines = async (): Promise<Array<{
  cuisine_id: string;
  cuisine_name: string;
}>> => {
  try {
    const { data, error } = await supabase
      .from('cuisine')
      .select('cuisine_id, cuisine_name')
      .order('cuisine_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    throw error;
  }
};

/**
 * Manually assign cuisine to a restaurant
 */
export const assignCuisineToRestaurant = async (
  restaurantId: string,
  cuisineId: string
): Promise<boolean> => {
  try {
    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('restaurant_cuisine')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('cuisine_id', cuisineId)
      .single();

    if (existing) {
      console.log('Cuisine already assigned to this restaurant');
      return true;
    }

    // Insert new relationship
    const { error } = await supabase
      .from('restaurant_cuisine')
      .insert({
        restaurant_id: restaurantId,
        cuisine_id: cuisineId
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error assigning cuisine to restaurant:', error);
    throw error;
  }
};

/**
 * Remove cuisine assignment from restaurant
 */
export const removeCuisineFromRestaurant = async (
  restaurantId: string,
  cuisineId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('restaurant_cuisine')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('cuisine_id', cuisineId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing cuisine from restaurant:', error);
    throw error;
  }
};
