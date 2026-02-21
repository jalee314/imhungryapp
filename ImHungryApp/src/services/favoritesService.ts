/**
 * Favorites Service (Facade)
 *
 * Public API for favorites-related operations. This service maintains
 * backward compatibility with existing callers while the underlying logic
 * is being consolidated in src/features/interactions.
 *
 * For new code, consider using the interactions feature module directly:
 * @see src/features/interactions for centralized favorite selectors and mutations
 */

import { supabase } from '../../lib/supabase';
import { toggleRestaurantFavorite as canonicalToggleRestaurantFavorite } from '../features/interactions';
import type { FavoriteDeal, FavoriteRestaurant } from '../types/favorites';
import {
  estimatePayloadBytes,
  recordCacheAccess,
  recordCacheRefresh,
  startPerfSpan,
} from '../utils/perfMonitor';

import { getCurrentUserId } from './currentUserService';

export type { FavoriteDeal, FavoriteRestaurant } from '../types/favorites';

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

type FavoriteCacheType = 'deals' | 'restaurants';

export interface FavoritesFetchOptions {
  forceRefresh?: boolean;
}

// Simple cache to avoid redundant queries
const cache = {
  restaurants: new Map<string, FavoriteRestaurant[]>(),
  deals: new Map<string, FavoriteDeal[]>(),
  lastFetch: new Map<string, number>(),
  dirtyEntries: new Set<string>(),
  CACHE_DURATION: 30000, // 30 seconds
};

const FAVORITES_DEALS_CACHE_METRIC = 'favorites_deals_cache';
const FAVORITES_RESTAURANTS_CACHE_METRIC = 'favorites_restaurants_cache';

const buildCacheKey = (type: FavoriteCacheType, userId: string): string => `${type}_${userId}`;

const isCacheEntryFresh = (cacheKey: string, now: number): boolean => {
  const lastFetch = cache.lastFetch.get(cacheKey) || 0;
  const isExpired = now - lastFetch >= cache.CACHE_DURATION;
  const isDirty = cache.dirtyEntries.has(cacheKey);
  return !isExpired && !isDirty;
};

/**
 * Clear the favorites cache to force fresh data on next fetch
 */
export const clearFavoritesCache = () => {
  cache.restaurants.clear();
  cache.deals.clear();
  cache.lastFetch.clear();
  cache.dirtyEntries.clear();
  console.log('🗑️ Favorites cache cleared');
};

export const markFavoritesCacheDirty = (type?: FavoriteCacheType): void => {
  cache.lastFetch.forEach((_value, key) => {
    if (!type || key.startsWith(`${type}_`)) {
      cache.dirtyEntries.add(key);
    }
  });
};

export const isFavoritesCacheStale = async (type: FavoriteCacheType): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) return true;

  const cacheKey = buildCacheKey(type, userId);
  if (type === 'deals' && !cache.deals.has(cacheKey)) return true;
  if (type === 'restaurants' && !cache.restaurants.has(cacheKey)) return true;
  return !isCacheEntryFresh(cacheKey, Date.now());
};

/**
 * Fetch user's favorite deals
 */
export const fetchFavoriteDeals = async (
  options: FavoritesFetchOptions = {},
): Promise<FavoriteDeal[]> => {
  const span = startPerfSpan('screen.favorites.fetch_deals');

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      span.end({
        metadata: {
          reason: 'no_authenticated_user',
          deals: 0,
        },
      });
      return [];
    }

    // Check cache first
    const cacheKey = buildCacheKey('deals', userId);
    const now = Date.now();
    const cachedDeals = cache.deals.get(cacheKey);
    const canUseCachedDeals =
      !options.forceRefresh && Boolean(cachedDeals) && isCacheEntryFresh(cacheKey, now);

    if (canUseCachedDeals && cachedDeals) {
      recordCacheAccess(FAVORITES_DEALS_CACHE_METRIC, {
        hit: true,
        stale: false,
        source: 'memory',
      });
      span.addPayload(cachedDeals);
      span.end({
        metadata: {
          cacheHit: true,
          deals: cachedDeals.length,
        },
      });
      return cachedDeals;
    }

    const staleCachedDeals = Boolean(cachedDeals);
    recordCacheAccess(FAVORITES_DEALS_CACHE_METRIC, {
      hit: false,
      stale: staleCachedDeals,
      source: staleCachedDeals ? 'memory' : 'none',
    });
    const refreshReason = options.forceRefresh ? 'manual' : staleCachedDeals ? 'stale' : 'miss';
    const refreshStartedAt = Date.now();

    // Get favorite deal IDs first
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorite')
      .select('deal_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    span.recordRoundTrip({
      source: 'query.favorite.deals',
      responseCount: favoriteData?.length ?? 0,
      error: favoriteError?.message ?? null,
    });

    if (favoriteError) {
      console.error('Error fetching favorites:', favoriteError);
      span.end({ success: false, error: favoriteError });
      return [];
    }

    if (!favoriteData || favoriteData.length === 0) {
      cache.deals.set(cacheKey, []);
      cache.lastFetch.set(cacheKey, Date.now());
      cache.dirtyEntries.delete(cacheKey);
      recordCacheRefresh(FAVORITES_DEALS_CACHE_METRIC, {
        durationMs: Date.now() - refreshStartedAt,
        payloadBytes: 0,
        triggeredBy: refreshReason,
      });
      span.end({
        metadata: {
          cacheHit: false,
          deals: 0,
        },
      });
      return [];
    }

    // Filter out null values and dedupe dealIds
    const dealIds = [...new Set(
      favoriteData
        .map((fav) => fav.deal_id)
        .filter((id): id is string => id !== null),
    )];

    // Get deal details with all related data using separate queries
    const { data: deals, error: dealsError } = await supabase
      .from('deal_instance')
      .select('deal_id, template_id, start_date, end_date')
      .in('deal_id', dealIds);
    span.recordRoundTrip({
      source: 'query.deal_instance.by_deal_ids',
      responseCount: deals?.length ?? 0,
      error: dealsError?.message ?? null,
    });

    if (dealsError) {
      console.error('Error fetching deal details:', dealsError);
      span.end({ success: false, error: dealsError });
      return [];
    }

    // Get all template data in one batch query - NOW WITH IMAGE METADATA AND DEAL_IMAGES
    const templateIds = [...new Set(deals.map(d => d.template_id))];
    const { data: templatesData, error: templatesError } = await supabase
      .from('deal_template')
      .select(`
        template_id,
        title, 
        description, 
        image_url,
        image_metadata_id,
        restaurant_id, 
        cuisine_id, 
        category_id,
        user_id,
        is_anonymous,
        restaurant:restaurant_id (
          restaurant_id,
          name,
          address
        ),
        cuisine:cuisine_id (
          cuisine_id,
          cuisine_name
        ),
        category:category_id (
          category_id,
          category_name
        ),
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
        ),
        user:user_id (
          display_name,
          profile_photo,
          profile_photo_metadata_id,
          image_metadata:profile_photo_metadata_id (
            variants
          )
        )
      `)
      .in('template_id', templateIds);
    span.recordRoundTrip({
      source: 'query.deal_template.by_template_ids',
      responseCount: templatesData?.length ?? 0,
      error: templatesError?.message ?? null,
    });

    if (templatesError) {
      span.end({ success: false, error: templatesError });
      return [];
    }

    const templatesMap = new Map(templatesData?.map(t => [t.template_id, t]) || []);

    // Prefer relation data from deal_template query; only fetch missing references.
    const nestedRestaurantsMap = new Map<string, any>();
    const nestedCuisinesMap = new Map<string, any>();
    const nestedCategoriesMap = new Map<string, any>();

    (templatesData ?? []).forEach((template: any) => {
      const restaurantData = Array.isArray(template.restaurant)
        ? template.restaurant[0]
        : template.restaurant;
      if (restaurantData?.restaurant_id) {
        nestedRestaurantsMap.set(restaurantData.restaurant_id, restaurantData);
      }

      const cuisineData = Array.isArray(template.cuisine)
        ? template.cuisine[0]
        : template.cuisine;
      if (cuisineData?.cuisine_id) {
        nestedCuisinesMap.set(cuisineData.cuisine_id, cuisineData);
      }

      const categoryData = Array.isArray(template.category)
        ? template.category[0]
        : template.category;
      if (categoryData?.category_id) {
        nestedCategoriesMap.set(categoryData.category_id, categoryData);
      }
    });

    const restaurantIds = [...new Set(templatesData?.map(t => t.restaurant_id).filter(Boolean))];
    const cuisineIds = [...new Set(templatesData?.map(t => t.cuisine_id).filter(Boolean))];
    const categoryIds = [...new Set(templatesData?.map(t => t.category_id).filter(Boolean))];

    const missingRestaurantIds = restaurantIds.filter((id) => !nestedRestaurantsMap.has(id));
    const missingCuisineIds = cuisineIds.filter((id) => !nestedCuisinesMap.has(id));
    const missingCategoryIds = categoryIds.filter((id) => !nestedCategoriesMap.has(id));

    // Execute remaining queries in parallel, only when reference data is missing.
    const [restaurantsResult, cuisinesResult, categoriesResult, distancesResult, dealCountsResult] = await Promise.all([
      missingRestaurantIds.length > 0
        ? supabase
            .from('restaurant')
            .select('restaurant_id, name, address')
            .in('restaurant_id', missingRestaurantIds)
        : Promise.resolve({ data: [], error: null }),
      missingCuisineIds.length > 0
        ? supabase
            .from('cuisine')
            .select('cuisine_id, cuisine_name')
            .in('cuisine_id', missingCuisineIds)
        : Promise.resolve({ data: [], error: null }),
      missingCategoryIds.length > 0
        ? supabase
            .from('category')
            .select('category_id, category_name')
            .in('category_id', missingCategoryIds)
        : Promise.resolve({ data: [], error: null }),
      restaurantIds.length > 0
        ? supabase.rpc('get_restaurant_coords_with_distance', {
            restaurant_ids: restaurantIds,
            user_uuid: userId
          })
        : Promise.resolve({ data: [], error: null }),
      restaurantIds.length > 0
        ? supabase.rpc('get_deal_counts_for_restaurants', { r_ids: restaurantIds })
        : Promise.resolve({ data: [], error: null })
    ]);

    if (missingRestaurantIds.length > 0) {
      span.recordRoundTrip({
        source: 'query.restaurant.by_restaurant_ids',
        responseCount: restaurantsResult.data?.length ?? 0,
        error: restaurantsResult.error?.message ?? null,
      });
    }
    if (missingCuisineIds.length > 0) {
      span.recordRoundTrip({
        source: 'query.cuisine.by_cuisine_ids',
        responseCount: cuisinesResult.data?.length ?? 0,
        error: cuisinesResult.error?.message ?? null,
      });
    }
    if (missingCategoryIds.length > 0) {
      span.recordRoundTrip({
        source: 'query.category.by_category_ids',
        responseCount: categoriesResult.data?.length ?? 0,
        error: categoriesResult.error?.message ?? null,
      });
    }
    span.recordRoundTrip({
      source: 'rpc.get_restaurant_coords_with_distance',
      responseCount: distancesResult.data?.length ?? 0,
      error: distancesResult.error?.message ?? null,
    });
    span.recordRoundTrip({
      source: 'rpc.get_deal_counts_for_restaurants',
      responseCount: dealCountsResult.data?.length ?? 0,
      error: dealCountsResult.error?.message ?? null,
    });

    // Create lookup maps from nested relation data + fallback reference queries.
    const restaurantsMap = new Map<string, any>(nestedRestaurantsMap);
    (restaurantsResult.data ?? []).forEach((restaurant: any) => {
      restaurantsMap.set(restaurant.restaurant_id, restaurant);
    });

    const cuisinesMap = new Map<string, any>(nestedCuisinesMap);
    (cuisinesResult.data ?? []).forEach((cuisine: any) => {
      cuisinesMap.set(cuisine.cuisine_id, cuisine);
    });

    const categoriesMap = new Map<string, any>(nestedCategoriesMap);
    (categoriesResult.data ?? []).forEach((category: any) => {
      categoriesMap.set(category.category_id, category);
    });
    
    const distanceMap = new Map<string, number | null>();
    if (distancesResult.error) {
      console.error('Error fetching restaurant distances:', distancesResult.error);
    } else {
      distancesResult.data?.forEach((entry: any) => {
        if (entry.restaurant_id) {
          distanceMap.set(entry.restaurant_id, entry.distance_miles ?? null);
        }
      });
    }

    const dealCountsMap = new Map(dealCountsResult.data?.map((dc: any) => [dc.restaurant_id, dc.deal_count]) || []);
    const favoriteCreatedAtByDealId = new Map(
      favoriteData
        .filter((fav) => fav.deal_id)
        .map((fav) => [fav.deal_id as string, fav.created_at]),
    );

    const favoriteDeals: FavoriteDeal[] = [];

    for (const deal of deals || []) {
      const template = templatesMap.get(deal.template_id);
      if (!template) continue;

      const restaurant = restaurantsMap.get(template.restaurant_id);
      if (!restaurant) continue;

      const distance = formatDistance(distanceMap.get(restaurant.restaurant_id));

      // Handle image URL - prioritize first image by display_order, then fallback
      let imageUrl = 'placeholder'; // Default to placeholder
      let imageVariants = undefined; // Store variants for skeleton loading
      
      // Sort deal_images by display_order and get the first one (which is the cover/thumbnail)
      const dealImages = (template as any).deal_images || [];
      const sortedDealImages = [...dealImages].sort((a: any, b: any) => 
        (a.display_order ?? 999) - (b.display_order ?? 999)
      );
      const firstImageByOrder = sortedDealImages.find((img: any) => img.image_metadata?.variants);
      // Fallback: check for is_thumbnail flag (for backward compatibility)
      const thumbnailImage = !firstImageByOrder ? dealImages.find((img: any) => img.is_thumbnail && img.image_metadata?.variants) : null;
      
      if (firstImageByOrder?.image_metadata?.variants) {
        // Use first image by display_order (preferred - this is the cover)
        const variants = firstImageByOrder.image_metadata.variants;
        imageUrl = variants.medium || variants.small || variants.large || 'placeholder';
        imageVariants = variants;
      } else if (thumbnailImage?.image_metadata?.variants) {
        // Fallback to is_thumbnail flag
        const variants = thumbnailImage.image_metadata.variants;
        imageUrl = variants.medium || variants.small || variants.large || 'placeholder';
        imageVariants = variants;
      } else {
        // Fallback to deal_template.image_metadata (for old deals not yet migrated)
        const imageMetadata = Array.isArray(template.image_metadata) ? template.image_metadata[0] : template.image_metadata;
        if (imageMetadata?.variants) {
          const variants = imageMetadata.variants;
          imageUrl = variants.medium || variants.small || variants.large || 'placeholder';
          imageVariants = variants;
        }
      }
      // No image available = use 'placeholder' string

      // Process user data with Cloudinary support
      const userData = Array.isArray(template.user) ? template.user[0] : template.user;
      let userProfilePhotoUrl = null;
      if (userData && !template.is_anonymous) {
        // Try Cloudinary first
        const userImageMetadata = Array.isArray(userData.image_metadata) ? userData.image_metadata[0] : userData.image_metadata;
        if (userImageMetadata?.variants) {
          userProfilePhotoUrl = userImageMetadata.variants.small || userImageMetadata.variants.thumbnail || null;
        }
        // If no Cloudinary, leave as null (don't use old Supabase storage)
      }

      favoriteDeals.push({
        id: deal.deal_id,
        title: template.title,
        description: template.description || '',
        imageUrl,
        imageVariants, // Include variants for skeleton loading
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        distance,
        dealCount: Number(dealCountsMap.get(restaurant.restaurant_id)) || 0,
        cuisineName: cuisinesMap.get(template.cuisine_id)?.cuisine_name || 'Unknown',
        categoryName: categoriesMap.get(template.category_id)?.category_name || 'Unknown',
        createdAt: favoriteCreatedAtByDealId.get(deal.deal_id) || new Date().toISOString(),
        isFavorited: true,
        userId: template.user_id,
        userDisplayName: template.is_anonymous ? 'Anonymous' : (userData?.display_name || 'Unknown User'),
        userProfilePhoto: userProfilePhotoUrl,
        isAnonymous: template.is_anonymous,
      });
    }

    // Sort by createdAt descending (newest favorited first)
    favoriteDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Cache the results
    cache.deals.set(cacheKey, favoriteDeals);
    cache.lastFetch.set(cacheKey, Date.now());
    cache.dirtyEntries.delete(cacheKey);
    recordCacheRefresh(FAVORITES_DEALS_CACHE_METRIC, {
      durationMs: Date.now() - refreshStartedAt,
      payloadBytes: estimatePayloadBytes(favoriteDeals),
      triggeredBy: refreshReason,
    });

    span.addPayload(favoriteDeals);
    span.end({
      metadata: {
        cacheHit: false,
        deals: favoriteDeals.length,
      },
    });

    return favoriteDeals;
  } catch (error) {
    console.error('Error in fetchFavoriteDeals:', error);
    span.end({ success: false, error });
    return [];
  }
};

/**
 * Fetch user's favorite restaurants (restaurants with favorited deals)
 */
export const fetchFavoriteRestaurants = async (
  options: FavoritesFetchOptions = {},
): Promise<FavoriteRestaurant[]> => {
  const span = startPerfSpan('screen.favorites.fetch_restaurants');

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      span.end({
        metadata: {
          reason: 'no_authenticated_user',
          restaurants: 0,
        },
      });
      return [];
    }

    // Check cache first
    const cacheKey = buildCacheKey('restaurants', userId);
    const now = Date.now();
    const cachedRestaurants = cache.restaurants.get(cacheKey);
    const canUseCachedRestaurants =
      !options.forceRefresh && Boolean(cachedRestaurants) && isCacheEntryFresh(cacheKey, now);

    if (canUseCachedRestaurants && cachedRestaurants) {
      recordCacheAccess(FAVORITES_RESTAURANTS_CACHE_METRIC, {
        hit: true,
        stale: false,
        source: 'memory',
      });
      span.addPayload(cachedRestaurants);
      span.end({
        metadata: {
          cacheHit: true,
          restaurants: cachedRestaurants.length,
        },
      });
      return cachedRestaurants;
    }

    const staleCachedRestaurants = Boolean(cachedRestaurants);
    recordCacheAccess(FAVORITES_RESTAURANTS_CACHE_METRIC, {
      hit: false,
      stale: staleCachedRestaurants,
      source: staleCachedRestaurants ? 'memory' : 'none',
    });
    const refreshReason = options.forceRefresh
      ? 'manual'
      : staleCachedRestaurants
        ? 'stale'
        : 'miss';
    const refreshStartedAt = Date.now();

    // Get ONLY directly favorited restaurants (not restaurants with favorited deals)
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorite')
      .select('restaurant_id, created_at')
      .eq('user_id', userId)
      .not('restaurant_id', 'is', null)
      .order('created_at', { ascending: false });
    span.recordRoundTrip({
      source: 'query.favorite.restaurants',
      responseCount: favoriteData?.length ?? 0,
      error: favoriteError?.message ?? null,
    });

    if (favoriteError) {
      console.error('Error fetching favorites:', favoriteError);
      span.end({ success: false, error: favoriteError });
      return [];
    }

    if (!favoriteData || favoriteData.length === 0) {
      cache.restaurants.set(cacheKey, []);
      cache.lastFetch.set(cacheKey, Date.now());
      cache.dirtyEntries.delete(cacheKey);
      recordCacheRefresh(FAVORITES_RESTAURANTS_CACHE_METRIC, {
        durationMs: Date.now() - refreshStartedAt,
        payloadBytes: 0,
        triggeredBy: refreshReason,
      });
      span.end({
        metadata: {
          cacheHit: false,
          restaurants: 0,
        },
      });
      return [];
    }

    // Get ONLY directly favorited restaurants
    const directRestaurantIds = [...new Set(
      favoriteData
        .map((fav) => fav.restaurant_id)
        .filter((id): id is string => id !== null),
    )];

    // Create a map of restaurant_id to created_at for sorting
    const favoriteCreatedAtMap = new Map(
      favoriteData.map(fav => [fav.restaurant_id, fav.created_at])
    );

    if (directRestaurantIds.length === 0) {
      cache.restaurants.set(cacheKey, []);
      cache.lastFetch.set(cacheKey, Date.now());
      cache.dirtyEntries.delete(cacheKey);
      recordCacheRefresh(FAVORITES_RESTAURANTS_CACHE_METRIC, {
        durationMs: Date.now() - refreshStartedAt,
        payloadBytes: 0,
        triggeredBy: refreshReason,
      });
      span.end({
        metadata: {
          cacheHit: false,
          restaurants: 0,
        },
      });
      return [];
    }

    const allRestaurantIds = directRestaurantIds;

    // Execute all queries in parallel for much better performance
    const [
      distanceResult,
      restaurantsResult,
      cuisinesResult,
      dealCountsResult,
      mostLikedDealsResult
    ] = await Promise.all([
      // Use PostGIS to compute lat/lng and distances relative to the user
      allRestaurantIds.length > 0
        ? supabase.rpc('get_restaurant_coords_with_distance', {
            restaurant_ids: allRestaurantIds,
            user_uuid: userId
          })
        : Promise.resolve({ data: [], error: null }),
      
      // Get all restaurant details in one batch query
      supabase
        .from('restaurant')
        .select('restaurant_id, name, address, restaurant_image_metadata') // Changed
        .in('restaurant_id', allRestaurantIds),
      
      // Get cuisine details for restaurants
      allRestaurantIds.length > 0
        ? supabase
            .from('restaurant_cuisine')
            .select(`
              restaurant_id,
              cuisine!inner(
                cuisine_id,
                cuisine_name
              )
            `)
            .in('restaurant_id', allRestaurantIds)
        : Promise.resolve({ data: [], error: null }),
      
      // Get deal counts for all restaurants (simplified approach)
      allRestaurantIds.length > 0
        ? supabase
            .from('deal_template')
            .select('restaurant_id')
            .in('restaurant_id', allRestaurantIds)
            .then(result => {
              // Count deals per restaurant
              const counts: any[] = [];
              const dealCounts: Record<string, number> = {};
              result.data?.forEach(deal => {
                dealCounts[deal.restaurant_id] = (dealCounts[deal.restaurant_id] || 0) + 1;
              });
              Object.entries(dealCounts).forEach(([restaurant_id, deal_count]) => {
                counts.push({ restaurant_id, deal_count });
              });
              return { data: counts, error: null };
            })
        : Promise.resolve({ data: [], error: null }),
      
      // Get the most liked deal with an image for each restaurant to use as thumbnail
      allRestaurantIds.length > 0
        ? (async () => {
            try {
              // Step 1: Get all deal templates for these restaurants (with deal_images for thumbnail support)
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
                .in('restaurant_id', allRestaurantIds);

              if (templateError) {
                console.error('❌ Error fetching deal templates:', templateError);
                return { data: [], error: templateError };
              }

              if (!dealTemplates || dealTemplates.length === 0) {
                return { data: [], error: null };
              }

              // Step 2: Get deal instances for these templates
              const templateIds = dealTemplates.map(t => t.template_id);
              const { data: dealInstances, error: instanceError } = await supabase
                .from('deal_instance')
                .select('deal_id, template_id')
                .in('template_id', templateIds);

              if (instanceError) {
                console.error('❌ Error fetching deal instances:', instanceError);
                return { data: [], error: instanceError };
              }

              // Create a map of template_id -> deal_id
              const templateToDealMap: Record<string, string> = {};
              dealInstances?.forEach(instance => {
                if (!templateToDealMap[instance.template_id]) {
                  templateToDealMap[instance.template_id] = instance.deal_id;
                }
              });

              // Step 3: Count upvotes for all deal_ids
              const dealIds = Object.values(templateToDealMap);
              
              if (dealIds.length === 0) {
                return { data: [], error: null };
              }

              const upvoteCounts: Record<string, number> = {};
              const { data: upvoteRows, error: upvoteRpcError } = await supabase.rpc(
                'get_upvote_counts_for_deals',
                { p_deal_ids: dealIds },
              );

              if (upvoteRpcError && !isRpcUnavailableError(upvoteRpcError)) {
                console.error('❌ Error fetching upvote counts via RPC:', upvoteRpcError);
              }

              if (upvoteRpcError) {
                const { data: upvotes, error: voteError } = await supabase
                  .from('interaction')
                  .select('deal_id')
                  .in('deal_id', dealIds)
                  .eq('interaction_type', 'upvote');

                if (voteError) {
                  console.error('❌ Error fetching upvotes:', voteError);
                }

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
                    restaurant_id: restaurantId,
                    template_id: template.template_id,
                    image_url: template.image_url,
                    image_metadata_id: template.image_metadata_id,
                    image_metadata: template.image_metadata,
                    deal_images: template.deal_images, // Include deal_images for thumbnail support
                    upvote_count: upvoteCount
                  };
                }
              });

              return { data: Object.values(mostLikedByRestaurant), error: null };
            } catch (error) {
              console.error('❌ Error in most liked deals query:', error);
              return { data: [], error: error };
            }
          })()
        : Promise.resolve({ data: [], error: null })
    ]);
    span.recordRoundTrip({
      source: 'rpc.get_restaurant_coords_with_distance',
      responseCount: distanceResult.data?.length ?? 0,
      error: distanceResult.error?.message ?? null,
    });
    span.recordRoundTrip({
      source: 'query.restaurant.by_restaurant_ids',
      responseCount: restaurantsResult.data?.length ?? 0,
      error: restaurantsResult.error?.message ?? null,
    });
    span.recordRoundTrip({
      source: 'query.restaurant_cuisine.by_restaurant_ids',
      responseCount: cuisinesResult.data?.length ?? 0,
      error: cuisinesResult.error?.message ?? null,
    });
    span.recordRoundTrip({
      source: 'query.deal_template.count_by_restaurant',
      responseCount: dealCountsResult.data?.length ?? 0,
      error: dealCountsResult.error ? String(dealCountsResult.error) : null,
    });
    span.recordRoundTrip({
      source: 'query.most_liked_deals_by_restaurant',
      responseCount: mostLikedDealsResult.data?.length ?? 0,
      error:
        mostLikedDealsResult.error instanceof Error
          ? mostLikedDealsResult.error.message
          : (mostLikedDealsResult.error as { message?: string } | null | undefined)?.message ??
            null,
    });


    if (distanceResult.error) {
      console.error('Error fetching restaurant distances:', distanceResult.error);
    }
    const distanceMap = new Map<string, number | null>();
    distanceResult.data?.forEach((row: any) => {
      if (row.restaurant_id) {
        distanceMap.set(row.restaurant_id, row.distance_miles ?? null);
      }
    });

    // Create maps for quick lookup
    const restaurantsMap = new Map(restaurantsResult.data?.map(r => [r.restaurant_id, r]) || []);
    
    // Process cuisine data from restaurant_cuisine table
    const cuisinesMap = new Map();
    cuisinesResult.data?.forEach((item: any) => {
      const cuisine = Array.isArray(item.cuisine) ? item.cuisine[0] : item.cuisine;
      cuisinesMap.set(item.restaurant_id, cuisine);
    });
    
    const dealCountsMap = new Map(dealCountsResult.data?.map((dc: any) => [dc.restaurant_id, dc.deal_count]) || []);
    
    // Create a map of most liked deals for each restaurant
    const mostLikedDealsMap = new Map();
    mostLikedDealsResult.data?.forEach((deal: any) => {
      mostLikedDealsMap.set(deal.restaurant_id, deal);
    });

    // Create favorite restaurants from all restaurant IDs
    const restaurants: FavoriteRestaurant[] = [];

    for (const restaurantId of allRestaurantIds) {
      const restaurantData = restaurantsMap.get(restaurantId);
      if (!restaurantData) {
        continue;
      }

      // Find cuisine for this restaurant
      let cuisineName = 'Unknown';
      const cuisineData = cuisinesMap.get(restaurantId);
      if (cuisineData) {
        cuisineName = cuisineData.cuisine_name;
      }

      const distance = formatDistance(distanceMap.get(restaurantId));

      // Use the image from the most liked deal at this restaurant as the thumbnail
      let imageUrl = '';
      const mostLikedDeal = mostLikedDealsMap.get(restaurantId);
      
      if (mostLikedDeal) {
        // Sort deal_images by display_order and get the first one (which is the cover/thumbnail)
        const dealImages = mostLikedDeal.deal_images || [];
        const sortedDealImages = [...dealImages].sort((a: any, b: any) => 
          (a.display_order ?? 999) - (b.display_order ?? 999)
        );
        const firstImageByOrder = sortedDealImages.find((img: any) => img.image_metadata?.variants);
        // Fallback: check for is_thumbnail flag (for backward compatibility)
        const thumbnailImage = !firstImageByOrder ? dealImages.find((img: any) => img.is_thumbnail && img.image_metadata?.variants) : null;
        
        if (firstImageByOrder?.image_metadata?.variants) {
          // Use first image by display_order (preferred - this is the cover)
          const variants = firstImageByOrder.image_metadata.variants;
          imageUrl = variants.medium || variants.small || variants.large || '';
        } else if (thumbnailImage?.image_metadata?.variants) {
          // Fallback to is_thumbnail flag
          const variants = thumbnailImage.image_metadata.variants;
          imageUrl = variants.medium || variants.small || variants.large || '';
        } else {
          // Fallback to deal_template.image_metadata
          const imageMetadata = Array.isArray(mostLikedDeal.image_metadata) 
            ? mostLikedDeal.image_metadata[0] 
            : mostLikedDeal.image_metadata;
          
          // Try to get image from Cloudinary variants first (for new deals)
          if (imageMetadata?.variants) {
            const variants = imageMetadata.variants;
            imageUrl = variants.medium || variants.small || variants.large || '';
          }
          // Fallback to image_url if no variants (older deals might still use this)
          else if (mostLikedDeal.image_url) {
            imageUrl = mostLikedDeal.image_url;
          }
        }
      }

      restaurants.push({
        id: restaurantId,
        name: restaurantData.name,
        address: restaurantData.address,
        imageUrl,
        distance,
        dealCount: Number(dealCountsMap.get(restaurantId)) || 0,
        cuisineName,
        isFavorited: true,
        createdAt: favoriteCreatedAtMap.get(restaurantId) || new Date().toISOString(),
      });
    }

    // Sort by createdAt descending (newest favorited first)
    restaurants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Cache the results
    cache.restaurants.set(cacheKey, restaurants);
    cache.lastFetch.set(cacheKey, Date.now());
    cache.dirtyEntries.delete(cacheKey);
    recordCacheRefresh(FAVORITES_RESTAURANTS_CACHE_METRIC, {
      durationMs: Date.now() - refreshStartedAt,
      payloadBytes: estimatePayloadBytes(restaurants),
      triggeredBy: refreshReason,
    });

    span.addPayload(restaurants);
    span.end({
      metadata: {
        cacheHit: false,
        restaurants: restaurants.length,
      },
    });

    return restaurants;
  } catch (error) {
    console.error('Error in fetchFavoriteRestaurants:', error);
    span.end({ success: false, error });
    return [];
  }
};

/**
 * Toggle restaurant favorite status
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string, 
  isCurrentlyFavorited: boolean
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId({ forceRefresh: true });
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await canonicalToggleRestaurantFavorite(
      restaurantId,
      isCurrentlyFavorited,
      'favorites',
    );

    if (!result.success) {
      throw { message: result.error || 'Failed to toggle restaurant favorite' };
    }

    markFavoritesCacheDirty('restaurants');
    return result.isFavorited ?? !isCurrentlyFavorited;
  } catch (error) {
    console.error('Error toggling restaurant favorite:', error);
    throw error;
  }
};

/**
 * Format a numeric distance (in miles) for display.
 */
const formatDistance = (distanceMiles?: number | null): string => {
  if (distanceMiles === null || distanceMiles === undefined || Number.isNaN(distanceMiles)) {
    return 'Unknown';
  }
  if (distanceMiles < 1) {
    return `${Math.round(distanceMiles * 1609)}m`;
  }
  return `${distanceMiles.toFixed(1)}mi`;
};
