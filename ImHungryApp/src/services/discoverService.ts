import { supabase } from '../../lib/supabase';
import { getCurrentUserLocation } from './locationService';

export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  logo_image?: string; // Image URL from most liked deal
  deal_count: number;
  distance_miles: number;
  lat: number;
  lng: number;
}

export interface DiscoverResult {
  success: boolean;
  restaurants: DiscoverRestaurant[];
  count: number;
  error?: string;
}

/**
 * Get all unique restaurants that have deals, with deal counts and distances
 * @param customCoordinates - Optional custom coordinates to use for distance calculation instead of user's location
 */
export const getRestaurantsWithDeals = async (customCoordinates?: { lat: number; lng: number }): Promise<DiscoverResult> => {
  try {
    console.log('🔍 Fetching restaurants with deals...');

    // Get location for distance calculation
    let locationToUse: { lat: number; lng: number } | null = null;
    
    if (customCoordinates) {
      console.log('📍 Using custom coordinates:', customCoordinates);
      locationToUse = customCoordinates;
    } else {
      // Get current user location for distance calculation
      const userLocation = await getCurrentUserLocation();
      if (!userLocation) {
        return {
          success: false,
          restaurants: [],
          count: 0,
          error: 'User location not available'
        };
      }
      console.log('📍 User location:', userLocation);
      locationToUse = userLocation;
    }

    // Query to get unique restaurants with deal counts
    // This uses a CTE to get restaurant counts and then joins with restaurant data
    const { data, error } = await supabase.rpc('get_restaurants_with_deal_counts', {
      user_lat: locationToUse.lat,
      user_lng: locationToUse.lng
    });

    if (error) {
      console.error('Error fetching restaurants with deals:', error);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurants'
      };
    }

    if (!data || data.length === 0) {
      console.log('No restaurants found');
      return {
        success: true,
        restaurants: [],
        count: 0
      };
    }

    // Transform the data to match our interface
    const restaurants: DiscoverRestaurant[] = data.map((restaurant: any) => ({
      restaurant_id: restaurant.restaurant_id,
      name: restaurant.name,
      address: restaurant.address,
      logo_image: '', // Will be populated below
      deal_count: parseInt(restaurant.deal_count) || 0,
      distance_miles: parseFloat(restaurant.distance_miles) || 0,
      lat: parseFloat(restaurant.lat),
      lng: parseFloat(restaurant.lng)
    }));

    // Fetch the most liked deal's image for each restaurant
    const restaurantIds = restaurants.map(r => r.restaurant_id);
    const mostLikedDeals = await fetchMostLikedDealsForRestaurants(restaurantIds);
    
    // Map the images to restaurants
    restaurants.forEach(restaurant => {
      const dealImage = mostLikedDeals.get(restaurant.restaurant_id);
      if (dealImage) {
        restaurant.logo_image = dealImage;
      }
    });

    // Sort by distance (closest first)
    restaurants.sort((a, b) => a.distance_miles - b.distance_miles);

    console.log(`✅ Found ${restaurants.length} restaurants with deals`);
    return {
      success: true,
      restaurants,
      count: restaurants.length
    };

  } catch (error) {
    console.error('Error in getRestaurantsWithDeals:', error);
    return {
      success: false,
      restaurants: [],
      count: 0,
      error: 'An unexpected error occurred'
    };
  }
};

/**
 * Alternative implementation using direct SQL query (if RPC function doesn't exist)
 * This can be used as a fallback or if you prefer to implement the logic in the client
 * @param customCoordinates - Optional custom coordinates to use for distance calculation instead of user's location
 */
export const getRestaurantsWithDealsDirect = async (customCoordinates?: { lat: number; lng: number }): Promise<DiscoverResult> => {
  try {
    console.log('🔍 Fetching restaurants with deals (direct query)...');

    // Get location for distance calculation
    let locationToUse: { lat: number; lng: number } | null = null;
    
    if (customCoordinates) {
      console.log('📍 Using custom coordinates:', customCoordinates);
      locationToUse = customCoordinates;
    } else {
      // Get current user location
      const userLocation = await getCurrentUserLocation();
      if (!userLocation) {
        return {
          success: false,
          restaurants: [],
          count: 0,
          error: 'User location not available'
        };
      }
      locationToUse = userLocation;
    }

    // First, get all unique restaurant IDs that have deals
    const { data: restaurantIds, error: idsError } = await supabase
      .from('deal_instance')
      .select(`
        deal_template!inner(
          restaurant_id
        )
      `)
      .not('deal_template.restaurant_id', 'is', null);

    if (idsError) {
      console.error('Error fetching restaurant IDs:', idsError);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurant IDs'
      };
    }

    // Extract unique restaurant IDs
    const uniqueRestaurantIds = Array.from(
      new Set(restaurantIds.map((item: any) => item.deal_template.restaurant_id))
    );

    if (uniqueRestaurantIds.length === 0) {
      return {
        success: true,
        restaurants: [],
        count: 0
      };
    }

    // Get restaurant details with coordinates
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants_with_coords')
      .select('restaurant_id, name, address, restaurant_image_metadata, lat, lng')
      .in('restaurant_id', uniqueRestaurantIds);

    if (restaurantsError) {
      console.error('Error fetching restaurant details:', restaurantsError);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurant details'
      };
    }

    // Fetch PostGIS distances (using either custom coordinates or the user's location)
    const distanceMap = new Map<string, number | null>();
    if (uniqueRestaurantIds.length > 0 && locationToUse) {
      const { data: distanceRows, error: distanceError } = await supabase.rpc('get_restaurant_coords_with_distance', {
        restaurant_ids: uniqueRestaurantIds,
        ref_lat: locationToUse.lat,
        ref_lng: locationToUse.lng
      });

      if (distanceError) {
        console.error('Error fetching restaurant distances:', distanceError);
      } else {
        distanceRows?.forEach((row: any) => {
          if (row.restaurant_id) {
            distanceMap.set(row.restaurant_id, row.distance_miles ?? null);
          }
        });
      }
    }

    // Get deal counts for each restaurant
    const dealCounts: Record<string, number> = {};
    for (const restaurantId of uniqueRestaurantIds) {
      const { count, error: countError } = await supabase
        .from('deal_instance')
        .select('*', { count: 'exact', head: true })
        .eq('deal_template.restaurant_id', restaurantId)
        .not('deal_template.restaurant_id', 'is', null);

      if (!countError && count !== null) {
        dealCounts[restaurantId] = count;
      } else {
        dealCounts[restaurantId] = 0;
      }
    }

    // Transform and calculate distances
    const result: DiscoverRestaurant[] = restaurants
      .filter(restaurant => restaurant.lat && restaurant.lng)
      .map(restaurant => {
        const rawDistance = distanceMap.get(restaurant.restaurant_id);

        return {
          restaurant_id: restaurant.restaurant_id,
          name: restaurant.name,
          address: restaurant.address,
          logo_image: '', // Will be populated below
          deal_count: dealCounts[restaurant.restaurant_id] || 0,
          distance_miles: rawDistance !== undefined && rawDistance !== null
            ? Math.round(rawDistance * 10) / 10
            : 0,
          lat: restaurant.lat,
          lng: restaurant.lng
        };
      })
      .filter(restaurant => restaurant.deal_count > 0); // Only include restaurants with deals
    
    // Fetch the most liked deal's image for each restaurant
    const restaurantIdsForImages = result.map(r => r.restaurant_id);
    const mostLikedDeals = await fetchMostLikedDealsForRestaurants(restaurantIdsForImages);
    
    // Map the images to restaurants
    result.forEach(restaurant => {
      const dealImage = mostLikedDeals.get(restaurant.restaurant_id);
      if (dealImage) {
        restaurant.logo_image = dealImage;
      }
    });
    
    // Sort by distance
    result.sort((a, b) => a.distance_miles - b.distance_miles);

    console.log(`✅ Found ${result.length} restaurants with deals`);
    return {
      success: true,
      restaurants: result,
      count: result.length
    };

  } catch (error) {
    console.error('Error in getRestaurantsWithDealsDirect:', error);
    return {
      success: false,
      restaurants: [],
      count: 0,
      error: 'An unexpected error occurred'
    };
  }
};

/**
 * Helper function to fetch the most liked deal's image for each restaurant
 * Returns a Map of restaurant_id -> image_url
 */
async function fetchMostLikedDealsForRestaurants(restaurantIds: string[]): Promise<Map<string, string>> {
  try {
    if (restaurantIds.length === 0) {
      return new Map();
    }

    // Step 1: Get all deal templates for these restaurants
    const { data: dealTemplates, error: templateError } = await supabase
      .from('deal_template')
      .select(`
        template_id,
        restaurant_id,
        image_url,
        image_metadata_id,
        image_metadata:image_metadata_id (
          variants
        )
      `)
      .in('restaurant_id', restaurantIds);

    if (templateError || !dealTemplates || dealTemplates.length === 0) {
      return new Map();
    }

    // Step 2: Get deal instances for these templates
    const templateIds = dealTemplates.map(t => t.template_id);
    const { data: dealInstances, error: instanceError } = await supabase
      .from('deal_instance')
      .select('deal_id, template_id')
      .in('template_id', templateIds);

    if (instanceError || !dealInstances) {
      return new Map();
    }

    // Create a map of template_id -> deal_id
    const templateToDealMap: Record<string, string> = {};
    dealInstances.forEach(instance => {
      if (!templateToDealMap[instance.template_id]) {
        templateToDealMap[instance.template_id] = instance.deal_id;
      }
    });

    // Step 3: Count upvotes for all deal_ids
    const dealIds = Object.values(templateToDealMap);
    
    if (dealIds.length === 0) {
      return new Map();
    }

    const { data: upvotes } = await supabase
      .from('interaction')
      .select('deal_id')
      .in('deal_id', dealIds)
      .eq('interaction_type', 'upvote');

    // Count upvotes per deal_id
    const upvoteCounts: Record<string, number> = {};
    upvotes?.forEach(vote => {
      upvoteCounts[vote.deal_id] = (upvoteCounts[vote.deal_id] || 0) + 1;
    });

    // Step 4: For each restaurant, find the deal with most upvotes
    const mostLikedByRestaurant: Record<string, any> = {};
    
    dealTemplates.forEach(template => {
      const restaurantId = template.restaurant_id;
      const dealId = templateToDealMap[template.template_id];
      const upvoteCount = dealId ? (upvoteCounts[dealId] || 0) : 0;
      
      if (!mostLikedByRestaurant[restaurantId] || 
          upvoteCount > mostLikedByRestaurant[restaurantId].upvote_count) {
        mostLikedByRestaurant[restaurantId] = {
          template,
          upvote_count: upvoteCount
        };
      }
    });

    // Step 5: Extract image URLs
    const result = new Map<string, string>();
    
    Object.entries(mostLikedByRestaurant).forEach(([restaurantId, data]) => {
      const template = data.template;
      
      // Handle image_metadata - might be an array or object
      const imageMetadata = Array.isArray(template.image_metadata) 
        ? template.image_metadata[0] 
        : template.image_metadata;
      
      // Try to get image from Cloudinary variants first
      if (imageMetadata?.variants) {
        const variants = imageMetadata.variants;
        const imageUrl = variants.medium || variants.small || variants.large || '';
        if (imageUrl) {
          result.set(restaurantId, imageUrl);
        }
      }
      // Fallback to image_url
      else if (template.image_url) {
        result.set(restaurantId, template.image_url);
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching most liked deals:', error);
    return new Map();
  }
}
