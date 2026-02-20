import { supabase } from '../../../lib/supabase';
import type { FavoriteRestaurant } from '../../types/favorites';
import { logger } from '../../utils/logger';

import { favoritesCache, getRestaurantsCacheKey } from './cache';
import { formatDistance, getPreferredImageUrl, type ImageSource } from './shared';

interface FavoriteRestaurantRow {
  restaurant_id: string | null;
  created_at: string;
}

interface MostLikedDealRecord {
  restaurant_id: string;
  upvote_count: number;
  [key: string]: unknown;
}

const readRestaurantsCache = (cacheKey: string, now: number): FavoriteRestaurant[] | null => {
  const lastFetch = favoritesCache.lastFetch.get(cacheKey) || 0;
  const hasFreshCache = now - lastFetch < favoritesCache.CACHE_DURATION_MS;

  if (!hasFreshCache || !favoritesCache.restaurants.has(cacheKey)) {
    return null;
  }

  return favoritesCache.restaurants.get(cacheKey) || null;
};

const fetchFavoriteRestaurantRows = async (userId: string): Promise<FavoriteRestaurantRow[]> => {
  const { data, error } = await supabase
    .from('favorite')
    .select('restaurant_id, created_at')
    .eq('user_id', userId)
    .not('restaurant_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching favorites:', error);
    return [];
  }

  return (data || []) as FavoriteRestaurantRow[];
};

const buildDealCounts = (rows: Array<{ restaurant_id: string }>) => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const currentCount = counts.get(row.restaurant_id) || 0;
    counts.set(row.restaurant_id, currentCount + 1);
  });

  return Array.from(counts.entries()).map(([restaurant_id, deal_count]) => ({
    restaurant_id,
    deal_count,
  }));
};

const fetchDealTemplates = async (restaurantIds: string[]) => {
  if (restaurantIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
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

  if (error) {
    logger.error('❌ Error fetching deal templates:', error);
    return [];
  }

  return data || [];
};

const fetchTemplateDealMap = async (templateIds: string[]) => {
  if (templateIds.length === 0) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from('deal_instance')
    .select('deal_id, template_id')
    .in('template_id', templateIds);

  if (error) {
    logger.error('❌ Error fetching deal instances:', error);
    return {} as Record<string, string>;
  }

  const templateToDealMap: Record<string, string> = {};
  (data || []).forEach((instance) => {
    if (!templateToDealMap[instance.template_id]) {
      templateToDealMap[instance.template_id] = instance.deal_id;
    }
  });

  return templateToDealMap;
};

const fetchUpvoteCounts = async (dealIds: string[]) => {
  if (dealIds.length === 0) {
    return {} as Record<string, number>;
  }

  const { data, error } = await supabase
    .from('interaction')
    .select('deal_id')
    .in('deal_id', dealIds)
    .eq('interaction_type', 'upvote');

  if (error) {
    logger.error('❌ Error fetching upvotes:', error);
  }

  const upvoteCounts: Record<string, number> = {};
  (data || []).forEach((vote) => {
    upvoteCounts[vote.deal_id] = (upvoteCounts[vote.deal_id] || 0) + 1;
  });

  return upvoteCounts;
};

const buildMostLikedDealsByRestaurant = (
  templates: Array<{ template_id: string; restaurant_id: string } & Record<string, unknown>>,
  templateToDealMap: Record<string, string>,
  upvoteCounts: Record<string, number>
): MostLikedDealRecord[] => {
  const mostLikedByRestaurant: Record<string, MostLikedDealRecord> = {};

  templates.forEach((template) => {
    const dealId = templateToDealMap[template.template_id];
    const upvoteCount = dealId ? (upvoteCounts[dealId] || 0) : 0;
    const existing = mostLikedByRestaurant[template.restaurant_id];

    if (existing && upvoteCount <= existing.upvote_count) {
      return;
    }

    mostLikedByRestaurant[template.restaurant_id] = {
      ...template,
      restaurant_id: template.restaurant_id,
      upvote_count: upvoteCount,
    };
  });

  return Object.values(mostLikedByRestaurant);
};

const fetchMostLikedDealsForRestaurants = async (restaurantIds: string[]) => {
  try {
    const templates = await fetchDealTemplates(restaurantIds);
    const templateIds = templates.map((template) => template.template_id);
    const templateToDealMap = await fetchTemplateDealMap(templateIds);
    const upvoteCounts = await fetchUpvoteCounts(Object.values(templateToDealMap));
    return buildMostLikedDealsByRestaurant(templates, templateToDealMap, upvoteCounts);
  } catch (error) {
    logger.error('❌ Error in most liked deals query:', error);
    return [];
  }
};

const fetchRestaurantLookupData = async (restaurantIds: string[], userId: string) => {
  const shouldQueryRestaurants = restaurantIds.length > 0;

  const [distanceResult, restaurantsResult, cuisinesResult, dealCountsResult, mostLikedDeals] = await Promise.all([
    shouldQueryRestaurants
      ? supabase.rpc('get_restaurant_coords_with_distance', {
          restaurant_ids: restaurantIds,
          user_uuid: userId,
        })
      : Promise.resolve({ data: [], error: null }),

    supabase
      .from('restaurant')
      .select('restaurant_id, name, address, restaurant_image_metadata')
      .in('restaurant_id', restaurantIds),

    shouldQueryRestaurants
      ? supabase
          .from('restaurant_cuisine')
          .select(`
            restaurant_id,
            cuisine!inner(
              cuisine_id,
              cuisine_name
            )
          `)
          .in('restaurant_id', restaurantIds)
      : Promise.resolve({ data: [] }),

    shouldQueryRestaurants
      ? supabase
          .from('deal_template')
          .select('restaurant_id')
          .in('restaurant_id', restaurantIds)
          .then((result) => ({ data: buildDealCounts((result.data || []) as Array<{ restaurant_id: string }>), error: null }))
      : Promise.resolve({ data: [] }),

    shouldQueryRestaurants
      ? fetchMostLikedDealsForRestaurants(restaurantIds)
      : Promise.resolve([]),
  ]);

  return {
    distanceResult,
    restaurantsResult,
    cuisinesResult,
    dealCountsResult,
    mostLikedDeals,
  };
};

const buildFavoriteRestaurants = (
  restaurantIds: string[],
  createdAtMap: Map<string | null, string>,
  lookupData: Awaited<ReturnType<typeof fetchRestaurantLookupData>>,
): FavoriteRestaurant[] => {
  if (lookupData.distanceResult.error) {
    logger.error('Error fetching restaurant distances:', lookupData.distanceResult.error);
  }

  const distanceMap = new Map<string, number | null>();
  (lookupData.distanceResult.data || []).forEach((row: { restaurant_id?: string | null; distance_miles?: number | null }) => {
    if (!row.restaurant_id) {
      return;
    }
    distanceMap.set(row.restaurant_id, row.distance_miles ?? null);
  });

  const restaurantsMap = new Map(
    (lookupData.restaurantsResult.data || []).map((restaurant) => [restaurant.restaurant_id, restaurant])
  );

  const cuisinesMap = new Map<string, { cuisine_name?: string }>();
  (lookupData.cuisinesResult.data || []).forEach((item) => {
    const cuisine = Array.isArray(item.cuisine) ? item.cuisine[0] : item.cuisine;
    cuisinesMap.set(item.restaurant_id, cuisine);
  });

  const dealCountsMap = new Map<string, number>(
    ((lookupData.dealCountsResult.data || []) as Array<{ restaurant_id: string; deal_count: number }>)
      .map((count) => [count.restaurant_id, count.deal_count])
  );

  const mostLikedDealsMap = new Map(
    lookupData.mostLikedDeals.map((deal) => [deal.restaurant_id, deal])
  );

  const restaurants: FavoriteRestaurant[] = [];

  for (const restaurantId of restaurantIds) {
    const restaurantData = restaurantsMap.get(restaurantId);
    if (!restaurantData) {
      continue;
    }

    const mostLikedDeal = mostLikedDealsMap.get(restaurantId);
    const imageUrl = mostLikedDeal
      ? getPreferredImageUrl(mostLikedDeal as ImageSource, '').imageUrl
      : '';

    restaurants.push({
      id: restaurantId,
      name: restaurantData.name,
      address: restaurantData.address,
      imageUrl,
      distance: formatDistance(distanceMap.get(restaurantId)),
      dealCount: Number(dealCountsMap.get(restaurantId)) || 0,
      cuisineName: cuisinesMap.get(restaurantId)?.cuisine_name || 'Unknown',
      isFavorited: true,
      createdAt: createdAtMap.get(restaurantId) || new Date().toISOString(),
    });
  }

  restaurants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return restaurants;
};

export const fetchFavoriteRestaurantsForUser = async (userId: string): Promise<FavoriteRestaurant[]> => {
  const cacheKey = getRestaurantsCacheKey(userId);
  const now = Date.now();

  const cached = readRestaurantsCache(cacheKey, now);
  if (cached) {
    return cached;
  }

  favoritesCache.restaurants.delete(cacheKey);
  favoritesCache.lastFetch.delete(cacheKey);

  const favoriteRows = await fetchFavoriteRestaurantRows(userId);
  if (favoriteRows.length === 0) {
    return [];
  }

  const restaurantIds = favoriteRows
    .map((favorite) => favorite.restaurant_id)
    .filter((id): id is string => id !== null);
  if (restaurantIds.length === 0) {
    return [];
  }

  const createdAtMap = new Map(favoriteRows.map((favorite) => [favorite.restaurant_id, favorite.created_at]));
  const lookupData = await fetchRestaurantLookupData(restaurantIds, userId);
  const restaurants = buildFavoriteRestaurants(restaurantIds, createdAtMap, lookupData);

  favoritesCache.restaurants.set(cacheKey, restaurants);
  favoritesCache.lastFetch.set(cacheKey, now);
  return restaurants;
};
