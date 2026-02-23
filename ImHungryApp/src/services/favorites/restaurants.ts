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

interface FavoriteRestaurantContext { cuisinesMap: Map<string, string>; dealCountsMap: Map<string, number>; distanceMap: Map<string, number | null>; favoriteCreatedAtMap: Map<string, string>; mostLikedDealsMap: Map<string, MostLikedDealRow>; restaurantsMap: Map<string, RestaurantRow>; }

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

const buildFavoriteCreatedAtMap = (favoriteData: FavoriteRestaurantRow[]): Map<string, string> => {
  return new Map(
    favoriteData
      .filter(
        (favorite): favorite is FavoriteRestaurantRow & { restaurant_id: string } =>
          Boolean(favorite.restaurant_id),
      )
      .map((favorite) => [favorite.restaurant_id, favorite.created_at]),
  );
};

const fetchFavoriteRestaurantRows = async (
  userId: string,
  span: PerfSpanLike,
): Promise<FavoriteRestaurantRow[]> => {
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

  return favoriteData;
};

const fetchDealCountsForRestaurants = async (
  restaurantIds: string[],
): Promise<QueryResult<DealCountRow>> => {
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

const buildMostLikedDealMap = (
  dealTemplates: DealTemplateRow[],
  templateToDealMap: Map<string, string>,
  upvoteCounts: Record<string, number>,
): Map<string, MostLikedDealRow> => {
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

  return mostLikedByRestaurant;
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

    return {
      data: [...buildMostLikedDealMap(dealTemplates, templateToDealMap, upvoteCounts).values()],
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error,
    };
  }
};

const fetchRestaurantDataBundle = async (
  directRestaurantIds: string[],
  userId: string,
): Promise<{
  cuisinesResult: QueryResult<RestaurantCuisineRow>;
  dealCountsResult: QueryResult<DealCountRow>;
  distanceResult: QueryResult<DistanceRow>;
  mostLikedDealsResult: QueryResult<MostLikedDealRow>;
  restaurantsResult: QueryResult<RestaurantRow>;
}> => {
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

  return {
    cuisinesResult: asQueryResult<RestaurantCuisineRow>(cuisinesResultRaw),
    dealCountsResult: asQueryResult<DealCountRow>(dealCountsResultRaw),
    distanceResult: asQueryResult<DistanceRow>(distanceResultRaw),
    mostLikedDealsResult: asQueryResult<MostLikedDealRow>(mostLikedDealsResultRaw),
    restaurantsResult: asQueryResult<RestaurantRow>(restaurantsResultRaw),
  };
};

const recordRestaurantRoundTrips = (
  span: PerfSpanLike,
  results: {
    cuisinesResult: QueryResult<RestaurantCuisineRow>;
    dealCountsResult: QueryResult<DealCountRow>;
    distanceResult: QueryResult<DistanceRow>;
    mostLikedDealsResult: QueryResult<MostLikedDealRow>;
    restaurantsResult: QueryResult<RestaurantRow>;
  },
) => {
  span.recordRoundTrip({
    source: 'rpc.get_restaurant_coords_with_distance',
    responseCount: results.distanceResult.data?.length ?? 0,
    error: getErrorMessage(results.distanceResult.error),
  });
  span.recordRoundTrip({
    source: 'query.restaurant.by_restaurant_ids',
    responseCount: results.restaurantsResult.data?.length ?? 0,
    error: getErrorMessage(results.restaurantsResult.error),
  });
  span.recordRoundTrip({
    source: 'query.restaurant_cuisine.by_restaurant_ids',
    responseCount: results.cuisinesResult.data?.length ?? 0,
    error: getErrorMessage(results.cuisinesResult.error),
  });
  span.recordRoundTrip({
    source: 'query.deal_template.count_by_restaurant',
    responseCount: results.dealCountsResult.data?.length ?? 0,
    error: getErrorMessage(results.dealCountsResult.error),
  });
  span.recordRoundTrip({
    source: 'query.most_liked_deals_by_restaurant',
    responseCount: results.mostLikedDealsResult.data?.length ?? 0,
    error: getErrorMessage(results.mostLikedDealsResult.error),
  });
};

const buildRestaurantContext = (
  favoriteCreatedAtMap: Map<string, string>,
  results: {
    cuisinesResult: QueryResult<RestaurantCuisineRow>;
    dealCountsResult: QueryResult<DealCountRow>;
    distanceResult: QueryResult<DistanceRow>;
    mostLikedDealsResult: QueryResult<MostLikedDealRow>;
    restaurantsResult: QueryResult<RestaurantRow>;
  },
): FavoriteRestaurantContext => {
  if (results.distanceResult.error) {
    console.error('Error fetching restaurant distances:', results.distanceResult.error);
  }

  const cuisinesMap = new Map<string, string>();
  (results.cuisinesResult.data ?? []).forEach((row) => {
    const cuisine = getSingleRelation(row.cuisine);
    if (cuisine) {
      cuisinesMap.set(row.restaurant_id, cuisine.cuisine_name);
    }
  });

  const dealCountsMap = new Map<string, number>();
  (results.dealCountsResult.data ?? []).forEach((row) => {
    dealCountsMap.set(row.restaurant_id, Number(row.deal_count) || 0);
  });

  const mostLikedDealsMap = new Map<string, MostLikedDealRow>();
  (results.mostLikedDealsResult.data ?? []).forEach((deal) => {
    mostLikedDealsMap.set(deal.restaurant_id, deal);
  });

  return {
    cuisinesMap,
    dealCountsMap,
    distanceMap: buildDistanceMap(results.distanceResult.data),
    favoriteCreatedAtMap,
    mostLikedDealsMap,
    restaurantsMap: new Map(
      (results.restaurantsResult.data ?? []).map((restaurant) => [restaurant.restaurant_id, restaurant]),
    ),
  };
};

const buildFavoriteRestaurant = (
  restaurantId: string,
  context: FavoriteRestaurantContext,
): FavoriteRestaurant | null => {
  const restaurant = context.restaurantsMap.get(restaurantId);
  if (!restaurant) {
    return null;
  }

  const mostLikedDeal = context.mostLikedDealsMap.get(restaurantId);
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
    distance: formatDistance(context.distanceMap.get(restaurantId)),
    dealCount: context.dealCountsMap.get(restaurantId) || 0,
    cuisineName: context.cuisinesMap.get(restaurantId) || 'Unknown',
    isFavorited: true,
    createdAt: context.favoriteCreatedAtMap.get(restaurantId) || new Date().toISOString(),
  };
};

export const fetchFavoriteRestaurantsFromDatabase = async (
  userId: string,
  span: PerfSpanLike,
): Promise<FavoriteRestaurant[]> => {
  const favoriteData = await fetchFavoriteRestaurantRows(userId, span);
  if (favoriteData.length === 0) {
    return [];
  }

  const directRestaurantIds = uniqueDefined(
    favoriteData.map((favorite) => favorite.restaurant_id),
  );
  if (directRestaurantIds.length === 0) {
    return [];
  }

  const favoriteCreatedAtMap = buildFavoriteCreatedAtMap(favoriteData);
  const results = await fetchRestaurantDataBundle(directRestaurantIds, userId);
  recordRestaurantRoundTrips(span, results);

  const context = buildRestaurantContext(favoriteCreatedAtMap, results);

  const restaurants = directRestaurantIds.reduce<FavoriteRestaurant[]>((accumulator, restaurantId) => {
    const favoriteRestaurant = buildFavoriteRestaurant(restaurantId, context);
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
