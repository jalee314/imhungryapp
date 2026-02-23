import { supabase } from '../../lib/supabase';
import type { DiscoverRestaurant, DiscoverResult } from '../types/discover';
import { startPerfSpan } from '../utils/perfMonitor';

import { getCurrentUserLocation } from './locationService';

export type { DiscoverRestaurant, DiscoverResult } from '../types/discover';

const isRpcUnavailableError = (error: unknown): boolean => {
  const maybeError = error as { code?: string; message?: string } | null;
  const code = maybeError?.code ?? '';
  const message = (maybeError?.message ?? '').toLowerCase();

  return (
    code === '42883' ||
    code === 'PGRST202' ||
    message.includes('could not find the function') ||
    message.includes('does not exist')
  );
};

/**
 * Get all unique restaurants that have deals, with deal counts and distances
 * @param customCoordinates - Optional custom coordinates to use for distance calculation instead of user's location
 */
export const getRestaurantsWithDeals = async (customCoordinates?: { lat: number; lng: number }): Promise<DiscoverResult> => {
  const span = startPerfSpan('service.discover.get_restaurants_with_deals', {
    path: 'rpc',
    hasCustomCoordinates: Boolean(customCoordinates),
  });

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
        span.end({
          success: false,
          metadata: {
            path: 'rpc',
            reason: 'user_location_unavailable',
          },
        });
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
    span.recordRoundTrip({
      source: 'rpc.get_restaurants_with_deal_counts',
      responseCount: data?.length ?? 0,
      error: error?.message ?? null,
    });

    if (error) {
      console.error('Error fetching restaurants with deals:', error);
      span.end({
        success: false,
        error,
        metadata: {
          path: 'rpc',
        },
      });
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurants'
      };
    }

    if (!data || data.length === 0) {
      console.log('No restaurants found');
      span.end({
        metadata: {
          path: 'rpc',
          restaurants: 0,
        },
      });
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
    span.recordRoundTrip({
      source: 'helper.fetchMostLikedDealsForRestaurants',
      restaurantCount: restaurantIds.length,
      imageCount: mostLikedDeals.size,
    });

    // Map the images to restaurants
    restaurants.forEach(restaurant => {
      const dealImage = mostLikedDeals.get(restaurant.restaurant_id);
      if (dealImage) {
        restaurant.logo_image = dealImage;
      }
    });

    // Filter to 20-mile maximum distance and sort by distance (closest first)
    const MAX_DISTANCE_MILES = 31;
    const filteredRestaurants = restaurants
      .filter(r => r.distance_miles <= MAX_DISTANCE_MILES)
      .sort((a, b) => a.distance_miles - b.distance_miles);

    span.addPayload(filteredRestaurants);
    span.end({
      metadata: {
        path: 'rpc',
        restaurants: filteredRestaurants.length,
      },
    });

    console.log(`✅ Found ${filteredRestaurants.length} restaurants with deals within ${MAX_DISTANCE_MILES} miles`);
    return {
      success: true,
      restaurants: filteredRestaurants,
      count: filteredRestaurants.length
    };

  } catch (error) {
    console.error('Error in getRestaurantsWithDeals:', error);
    span.end({
      success: false,
      error,
      metadata: {
        path: 'rpc',
      },
    });
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
  const span = startPerfSpan('service.discover.get_restaurants_with_deals', {
    path: 'direct',
    hasCustomCoordinates: Boolean(customCoordinates),
  });

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
        span.end({
          success: false,
          metadata: {
            path: 'direct',
            reason: 'user_location_unavailable',
          },
        });
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
    span.recordRoundTrip({
      source: 'query.deal_instance.restaurant_ids',
      responseCount: restaurantIds?.length ?? 0,
      error: idsError?.message ?? null,
    });

    if (idsError) {
      console.error('Error fetching restaurant IDs:', idsError);
      span.end({ success: false, error: idsError, metadata: { path: 'direct' } });
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
      span.end({
        metadata: {
          path: 'direct',
          restaurants: 0,
        },
      });
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
    span.recordRoundTrip({
      source: 'query.restaurants_with_coords.fetch',
      responseCount: restaurants?.length ?? 0,
      error: restaurantsError?.message ?? null,
    });

    if (restaurantsError) {
      console.error('Error fetching restaurant details:', restaurantsError);
      span.end({ success: false, error: restaurantsError, metadata: { path: 'direct' } });
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
      span.recordRoundTrip({
        source: 'rpc.get_restaurant_coords_with_distance',
        responseCount: distanceRows?.length ?? 0,
        error: distanceError?.message ?? null,
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

    // Get deal counts for all restaurants in one batch call
    const { data: dealCountRows, error: dealCountsError } = await supabase.rpc(
      'get_deal_counts_for_restaurants',
      { r_ids: uniqueRestaurantIds },
    );
    span.recordRoundTrip({
      source: 'rpc.get_deal_counts_for_restaurants',
      responseCount: dealCountRows?.length ?? 0,
      error: dealCountsError?.message ?? null,
    });

    const dealCounts: Record<string, number> = {};
    if (dealCountsError) {
      // Fallback to one batched query and aggregate locally if RPC is unavailable.
      const { data: templates, error: templateError } = await supabase
        .from('deal_template')
        .select('restaurant_id')
        .in('restaurant_id', uniqueRestaurantIds);

      span.recordRoundTrip({
        source: 'query.deal_template.count_by_restaurant_fallback',
        responseCount: templates?.length ?? 0,
        error: templateError?.message ?? null,
      });

      if (!templateError) {
        templates?.forEach((template) => {
          const restaurantId = template.restaurant_id;
          if (!restaurantId) return;
          dealCounts[restaurantId] = (dealCounts[restaurantId] ?? 0) + 1;
        });
      }
    } else {
      (dealCountRows ?? []).forEach((row: any) => {
        if (row.restaurant_id) {
          dealCounts[row.restaurant_id] = Number(row.deal_count) || 0;
        }
      });
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
    span.recordRoundTrip({
      source: 'helper.fetchMostLikedDealsForRestaurants',
      restaurantCount: restaurantIdsForImages.length,
      imageCount: mostLikedDeals.size,
    });

    // Map the images to restaurants
    result.forEach(restaurant => {
      const dealImage = mostLikedDeals.get(restaurant.restaurant_id);
      if (dealImage) {
        restaurant.logo_image = dealImage;
      }
    });

    // Filter to 20-mile maximum distance and sort by distance (closest first)
    const MAX_DISTANCE_MILES = 31;
    const filteredResult = result
      .filter(r => r.distance_miles <= MAX_DISTANCE_MILES)
      .sort((a, b) => a.distance_miles - b.distance_miles);

    span.addPayload(filteredResult);
    span.end({
      metadata: {
        path: 'direct',
        restaurants: filteredResult.length,
      },
    });

    console.log(`✅ Found ${filteredResult.length} restaurants with deals within ${MAX_DISTANCE_MILES} miles`);
    return {
      success: true,
      restaurants: filteredResult,
      count: filteredResult.length
    };

  } catch (error) {
    console.error('Error in getRestaurantsWithDealsDirect:', error);
    span.end({
      success: false,
      error,
      metadata: {
        path: 'direct',
      },
    });
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
  const span = startPerfSpan('query.discover.fetch_most_liked_deals_for_restaurants', {
    restaurantsRequested: restaurantIds.length,
  });

  try {
    if (restaurantIds.length === 0) {
      span.end({
        metadata: {
          restaurantsRequested: 0,
          imagesReturned: 0,
        },
      });
      return new Map();
    }

    // Step 1: Get all deal templates for these restaurants with deal_images
    const { data: dealTemplates, error: templateError } = await supabase
      .from('deal_template')
      .select(`
        template_id,
        restaurant_id,
        image_url,
        image_metadata_id,
        image_metadata:image_metadata_id (
          variants
        ),
        deal_images (
          image_metadata_id,
          display_order,
          is_thumbnail,
          image_metadata:image_metadata_id (
            variants
          )
        )
      `)
      .in('restaurant_id', restaurantIds);
    span.recordRoundTrip({
      source: 'query.deal_template.fetch_for_restaurants',
      responseCount: dealTemplates?.length ?? 0,
      error: templateError?.message ?? null,
    });

    if (templateError || !dealTemplates || dealTemplates.length === 0) {
      if (templateError) {
        span.end({ success: false, error: templateError });
      } else {
        span.end({
          metadata: {
            restaurantsRequested: restaurantIds.length,
            templates: 0,
          },
        });
      }
      return new Map();
    }

    // Step 2: Get deal instances for these templates
    const templateIds = dealTemplates.map(t => t.template_id);
    const { data: dealInstances, error: instanceError } = await supabase
      .from('deal_instance')
      .select('deal_id, template_id')
      .in('template_id', templateIds);
    span.recordRoundTrip({
      source: 'query.deal_instance.fetch_for_templates',
      responseCount: dealInstances?.length ?? 0,
      error: instanceError?.message ?? null,
    });

    if (instanceError || !dealInstances) {
      if (instanceError) {
        span.end({ success: false, error: instanceError });
      } else {
        span.end({
          metadata: {
            restaurantsRequested: restaurantIds.length,
            instances: 0,
          },
        });
      }
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
      span.end({
        metadata: {
          restaurantsRequested: restaurantIds.length,
          dealsConsidered: 0,
        },
      });
      return new Map();
    }

    const upvoteCounts: Record<string, number> = {};
    const { data: upvoteRows, error: upvoteRpcError } = await supabase.rpc(
      'get_upvote_counts_for_deals',
      { p_deal_ids: dealIds },
    );
    span.recordRoundTrip({
      source: 'rpc.get_upvote_counts_for_deals',
      responseCount: upvoteRows?.length ?? 0,
      error: upvoteRpcError?.message ?? null,
      dealIds: dealIds.length,
    });

    if (upvoteRpcError && !isRpcUnavailableError(upvoteRpcError)) {
      span.end({ success: false, error: upvoteRpcError });
      return new Map();
    }

    if (upvoteRpcError) {
      const { data: upvotes } = await supabase
        .from('interaction')
        .select('deal_id')
        .in('deal_id', dealIds)
        .eq('interaction_type', 'upvote');

      span.recordRoundTrip({
        source: 'query.interaction.upvotes_for_deals.fallback',
        responseCount: upvotes?.length ?? 0,
        dealIds: dealIds.length,
      });

      upvotes?.forEach(vote => {
        upvoteCounts[vote.deal_id] = (upvoteCounts[vote.deal_id] || 0) + 1;
      });
    } else {
      (upvoteRows ?? []).forEach((row: any) => {
        if (row.deal_id) {
          upvoteCounts[row.deal_id] = Number(row.upvote_count) || 0;
        }
      });
    }

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

    // Step 5: Extract image URLs - prioritize first image by display_order
    const result = new Map<string, string>();

    Object.entries(mostLikedByRestaurant).forEach(([restaurantId, data]) => {
      const template = data.template;

      // Sort deal_images by display_order and get the first one (which is the cover/thumbnail)
      const dealImages = template.deal_images || [];
      const sortedDealImages = [...dealImages].sort((a: any, b: any) =>
        (a.display_order ?? 999) - (b.display_order ?? 999)
      );
      const firstImageByOrder = sortedDealImages.find((img: any) => img.image_metadata?.variants);
      // Fallback: check for is_thumbnail flag (for backward compatibility)
      const thumbnailImage = !firstImageByOrder ? dealImages.find((img: any) => img.is_thumbnail && img.image_metadata?.variants) : null;

      if (firstImageByOrder?.image_metadata?.variants) {
        // Use first image by display_order (preferred - this is the cover)
        const variants = firstImageByOrder.image_metadata.variants;
        const imageUrl = variants.medium || variants.small || variants.large || '';
        if (imageUrl) {
          result.set(restaurantId, imageUrl);
          return;
        }
      }

      if (thumbnailImage?.image_metadata?.variants) {
        // Fallback to is_thumbnail flag
        const variants = thumbnailImage.image_metadata.variants;
        const imageUrl = variants.medium || variants.small || variants.large || '';
        if (imageUrl) {
          result.set(restaurantId, imageUrl);
          return;
        }
      }

      // Fallback: Handle image_metadata from deal_template
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

    span.addPayload(Array.from(result.entries()));
    span.end({
      metadata: {
        restaurantsRequested: restaurantIds.length,
        imagesReturned: result.size,
      },
    });

    return result;
  } catch (error) {
    console.error('Error fetching most liked deals:', error);
    span.end({ success: false, error });
    return new Map();
  }
}
