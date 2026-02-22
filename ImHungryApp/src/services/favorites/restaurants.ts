import { supabase } from '../../../lib/supabase';
import type { FavoriteRestaurant } from '../../types/favorites';

import {
  buildDistanceMap,
  DealCountRow,
  DealImageRow,
  DealInstanceRow,
  DealTemplateRow,
  DistanceRow,
  FavoriteRestaurantRow,
  formatDistance,
  getFavoriteRestaurantImageUrl,
  getSingleRelation,
  isRpcUnavailableError,
  MostLikedDealRow,
  PerfSpanLike,
  RestaurantCuisineRow,
  RestaurantRow,
  UpvoteCountRow,
} from './shared';

interface QueryResult<T> {
  data: T[] | null;
  error: unknown;
}

const emptyQueryResult = <T>(): QueryResult<T> => ({
  data: [],
  error: null,
});

const asQueryResult = <T>(value: unknown): QueryResult<T> => value as QueryResult<T>;

const getErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }
  return String(error);
};

const uniqueDefined = (values: Array<string | null | undefined>): string[] => {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
};

const fetchDealCountsForRestaurants = async (restaurantIds: string[]): Promise<QueryResult<DealCountRow>> => {
  if (restaurantIds.length === 0) {
    return emptyQueryResult<DealCountRow>();
  }

  const result = await supabase
    .from('deal_template')
    .select('restaurant_id')
    .in('restaurant_id', restaurantIds);

  const dealCounts: Record<string, number> = {};
  (result.data ?? []).forEach((row: { restaurant_id: string }) => {
    dealCounts[row.restaurant_id] = (dealCounts[row.restaurant_id] || 0) + 1;
  });

  return {
    data: Object.entries(dealCounts).map(([restaurant_id, deal_count]) => ({
      restaurant_id,
      deal_count,
    })),
    // Keep historical behavior where count-query errors do not fail the request.
    error: null,
  };
};

const fetchUpvoteCountsForDeals = async (dealIds: string[]): Promise<Record<string, number>> => {
  if (dealIds.length === 0) {
    return {};
  }

  const counts: Record<string, number> = {};
  const { data: upvoteRowsRaw, error: upvoteRpcError } = await supabase.rpc(
    'get_upvote_counts_for_deals',
    { p_deal_ids: dealIds },
  );
  const upvoteRows = (upvoteRowsRaw ?? []) as UpvoteCountRow[];

  if (upvoteRpcError && !isRpcUnavailableError(upvoteRpcError)) {
    console.error('Error fetching upvote counts via RPC:', upvoteRpcError);
  }

  if (upvoteRpcError) {
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('interaction')
      .select('deal_id')
      .in('deal_id', dealIds)
      .eq('interaction_type', 'upvote');

    if (fallbackError) {
      console.error('Error fetching upvotes fallback:', fallbackError);
      return counts;
    }

    (fallbackRows ?? []).forEach((vote: { deal_id: string }) => {
      counts[vote.deal_id] = (counts[vote.deal_id] || 0) + 1;
    });
    return counts;
  }

  upvoteRows.forEach((row) => {
    if (row.deal_id) {
      counts[row.deal_id] = Number(row.upvote_count) || 0;
    }
  });
  return counts;
};

const fetchMostLikedDealsByRestaurant = async (
  restaurantIds: string[],
): Promise<QueryResult<MostLikedDealRow>> => {
  if (restaurantIds.length === 0) {
    return emptyQueryResult<MostLikedDealRow>();
  }

  try {
    const { data: dealTemplatesRaw, error: templateError } = await supabase
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

    if (templateError) {
      return {
        data: [],
        error: templateError,
      };
    }

    const dealTemplates = (dealTemplatesRaw ?? []) as DealTemplateRow[];
    if (dealTemplates.length === 0) {
      return emptyQueryResult<MostLikedDealRow>();
    }

    const templateIds = uniqueDefined(dealTemplates.map((template) => template.template_id));
    const { data: dealInstancesRaw, error: instanceError } = await supabase
      .from('deal_instance')
      .select('deal_id, template_id')
      .in('template_id', templateIds);

    if (instanceError) {
      return {
        data: [],
        error: instanceError,
      };
    }

    const dealInstances = (dealInstancesRaw ?? []) as DealInstanceRow[];
    const templateToDealMap = new Map<string, string>();
    dealInstances.forEach((instance) => {
      if (instance.template_id && !templateToDealMap.has(instance.template_id)) {
        templateToDealMap.set(instance.template_id, instance.deal_id);
      }
    });

    const dealIds = [...new Set(templateToDealMap.values())];
    const upvoteCounts = await fetchUpvoteCountsForDeals(dealIds);
    const mostLikedByRestaurant = new Map<string, MostLikedDealRow>();

    dealTemplates.forEach((template) => {
      const dealId = templateToDealMap.get(template.template_id);
      const upvoteCount = dealId ? (upvoteCounts[dealId] || 0) : 0;
      const existing = mostLikedByRestaurant.get(template.restaurant_id);
      if (!existing || upvoteCount > existing.upvote_count) {
        mostLikedByRestaurant.set(template.restaurant_id, {
          restaurant_id: template.restaurant_id,
          template_id: template.template_id,
          image_url: template.image_url,
          image_metadata_id: template.image_metadata_id,
          image_metadata: template.image_metadata,
          deal_images: (template.deal_images as DealImageRow[] | null | undefined) ?? [],
          upvote_count: upvoteCount,
        });
      }
    });

    return {
      data: [...mostLikedByRestaurant.values()],
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error,
    };
  }
};

const buildFavoriteRestaurant = (
  restaurantId: string,
  restaurantsMap: Map<string, RestaurantRow>,
  cuisinesMap: Map<string, string>,
  distanceMap: Map<string, number | null>,
  dealCountsMap: Map<string, number>,
  mostLikedDealsMap: Map<string, MostLikedDealRow>,
  favoriteCreatedAtMap: Map<string, string>,
): FavoriteRestaurant | null => {
  const restaurant = restaurantsMap.get(restaurantId);
  if (!restaurant) {
    return null;
  }

  const mostLikedDeal = mostLikedDealsMap.get(restaurantId);
  const imageUrl = mostLikedDeal
    ? getFavoriteRestaurantImageUrl(
        mostLikedDeal.deal_images,
        mostLikedDeal.image_metadata,
        mostLikedDeal.image_url,
      )
    : '';

  return {
    id: restaurantId,
    name: restaurant.name,
    address: restaurant.address,
    imageUrl,
    distance: formatDistance(distanceMap.get(restaurantId)),
    dealCount: dealCountsMap.get(restaurantId) || 0,
    cuisineName: cuisinesMap.get(restaurantId) || 'Unknown',
    isFavorited: true,
    createdAt: favoriteCreatedAtMap.get(restaurantId) || new Date().toISOString(),
  };
};

export const fetchFavoriteRestaurantsFromDatabase = async (
  userId: string,
  span: PerfSpanLike,
): Promise<FavoriteRestaurant[]> => {
  const { data: favoriteDataRaw, error: favoriteError } = await supabase
    .from('favorite')
    .select('restaurant_id, created_at')
    .eq('user_id', userId)
    .not('restaurant_id', 'is', null)
    .order('created_at', { ascending: false });
  const favoriteData = (favoriteDataRaw ?? []) as FavoriteRestaurantRow[];
  span.recordRoundTrip({
    source: 'query.favorite.restaurants',
    responseCount: favoriteData.length,
    error: favoriteError?.message ?? null,
  });

  if (favoriteError) {
    throw favoriteError;
  }

  if (favoriteData.length === 0) {
    return [];
  }

  const directRestaurantIds = uniqueDefined(
    favoriteData.map((favorite) => favorite.restaurant_id),
  );
  if (directRestaurantIds.length === 0) {
    return [];
  }

  const favoriteCreatedAtMap = new Map<string, string>(
    favoriteData
      .filter(
        (favorite): favorite is FavoriteRestaurantRow & { restaurant_id: string } =>
          Boolean(favorite.restaurant_id),
      )
      .map((favorite) => [favorite.restaurant_id, favorite.created_at]),
  );

  const [distanceResultRaw, restaurantsResultRaw, cuisinesResultRaw, dealCountsResultRaw, mostLikedDealsResultRaw] =
    await Promise.all([
      supabase.rpc('get_restaurant_coords_with_distance', {
        restaurant_ids: directRestaurantIds,
        user_uuid: userId,
      }),
      supabase
        .from('restaurant')
        .select('restaurant_id, name, address, restaurant_image_metadata')
        .in('restaurant_id', directRestaurantIds),
      supabase
        .from('restaurant_cuisine')
        .select(`
          restaurant_id,
          cuisine!inner(
            cuisine_id,
            cuisine_name
          )
        `)
        .in('restaurant_id', directRestaurantIds),
      fetchDealCountsForRestaurants(directRestaurantIds),
      fetchMostLikedDealsByRestaurant(directRestaurantIds),
    ]);

  const distanceResult = asQueryResult<DistanceRow>(distanceResultRaw);
  const restaurantsResult = asQueryResult<RestaurantRow>(restaurantsResultRaw);
  const cuisinesResult = asQueryResult<RestaurantCuisineRow>(cuisinesResultRaw);
  const dealCountsResult = asQueryResult<DealCountRow>(dealCountsResultRaw);
  const mostLikedDealsResult = asQueryResult<MostLikedDealRow>(mostLikedDealsResultRaw);

  span.recordRoundTrip({
    source: 'rpc.get_restaurant_coords_with_distance',
    responseCount: distanceResult.data?.length ?? 0,
    error: getErrorMessage(distanceResult.error),
  });
  span.recordRoundTrip({
    source: 'query.restaurant.by_restaurant_ids',
    responseCount: restaurantsResult.data?.length ?? 0,
    error: getErrorMessage(restaurantsResult.error),
  });
  span.recordRoundTrip({
    source: 'query.restaurant_cuisine.by_restaurant_ids',
    responseCount: cuisinesResult.data?.length ?? 0,
    error: getErrorMessage(cuisinesResult.error),
  });
  span.recordRoundTrip({
    source: 'query.deal_template.count_by_restaurant',
    responseCount: dealCountsResult.data?.length ?? 0,
    error: getErrorMessage(dealCountsResult.error),
  });
  span.recordRoundTrip({
    source: 'query.most_liked_deals_by_restaurant',
    responseCount: mostLikedDealsResult.data?.length ?? 0,
    error: getErrorMessage(mostLikedDealsResult.error),
  });

  if (distanceResult.error) {
    console.error('Error fetching restaurant distances:', distanceResult.error);
  }

  const distanceMap = buildDistanceMap(distanceResult.data);
  const restaurantsMap = new Map<string, RestaurantRow>(
    (restaurantsResult.data ?? []).map((restaurant) => [restaurant.restaurant_id, restaurant]),
  );
  const cuisinesMap = new Map<string, string>();
  (cuisinesResult.data ?? []).forEach((row) => {
    const cuisine = getSingleRelation(row.cuisine);
    if (cuisine) {
      cuisinesMap.set(row.restaurant_id, cuisine.cuisine_name);
    }
  });

  const dealCountsMap = new Map<string, number>();
  (dealCountsResult.data ?? []).forEach((row) => {
    dealCountsMap.set(row.restaurant_id, Number(row.deal_count) || 0);
  });

  const mostLikedDealsMap = new Map<string, MostLikedDealRow>();
  (mostLikedDealsResult.data ?? []).forEach((deal) => {
    mostLikedDealsMap.set(deal.restaurant_id, deal);
  });

  const restaurants = directRestaurantIds.reduce<FavoriteRestaurant[]>((accumulator, restaurantId) => {
    const favoriteRestaurant = buildFavoriteRestaurant(
      restaurantId,
      restaurantsMap,
      cuisinesMap,
      distanceMap,
      dealCountsMap,
      mostLikedDealsMap,
      favoriteCreatedAtMap,
    );
    if (favoriteRestaurant) {
      accumulator.push(favoriteRestaurant);
    }
    return accumulator;
  }, []);

  restaurants.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return restaurants;
};

