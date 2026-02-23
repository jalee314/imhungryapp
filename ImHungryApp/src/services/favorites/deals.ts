import { supabase } from '../../../lib/supabase';
import type { FavoriteDeal } from '../../types/favorites';

import {
  buildDealCountMap,
  buildDistanceMap,
  CategoryRow,
  CuisineRow,
  DealCountRow,
  DealImageRow,
  DealInstanceRow,
  DealTemplateRow,
  DistanceRow,
  FavoriteDealRow,
  formatDistance,
  getFavoriteDealImageData,
  getSingleRelation,
  getUserProfilePhotoUrl,
  PerfSpanLike,
  RestaurantRow,
} from './shared';

interface QueryResult<T> {
  data: T[] | null;
  error: { message?: string } | null;
}

interface DealReferenceData {
  categoriesMap: Map<string, CategoryRow>;
  cuisinesMap: Map<string, CuisineRow>;
  dealCountsMap: Map<string, number>;
  distanceMap: Map<string, number | null>;
  restaurantsMap: Map<string, RestaurantRow>;
}

const emptyQueryResult = <T>(): QueryResult<T> => ({
  data: [],
  error: null,
});

const asQueryResult = <T>(value: unknown): QueryResult<T> => value as QueryResult<T>;

const uniqueDefined = (values: Array<string | null | undefined>): string[] => {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
};

const buildTemplateRelationMaps = (templates: DealTemplateRow[]) => {
  const restaurants = new Map<string, RestaurantRow>();
  const cuisines = new Map<string, CuisineRow>();
  const categories = new Map<string, CategoryRow>();

  templates.forEach((template) => {
    const restaurant = getSingleRelation(template.restaurant);
    if (restaurant?.restaurant_id) {
      restaurants.set(restaurant.restaurant_id, restaurant);
    }

    const cuisine = getSingleRelation(template.cuisine);
    if (cuisine?.cuisine_id) {
      cuisines.set(cuisine.cuisine_id, cuisine);
    }

    const category = getSingleRelation(template.category);
    if (category?.category_id) {
      categories.set(category.category_id, category);
    }
  });

  return {
    restaurants,
    cuisines,
    categories,
  };
};

const buildFavoriteCreatedAtMap = (favoriteData: FavoriteDealRow[]): Map<string, string> => {
  return new Map(
    favoriteData
      .filter((favorite): favorite is FavoriteDealRow & { deal_id: string } => Boolean(favorite.deal_id))
      .map((favorite) => [favorite.deal_id, favorite.created_at]),
  );
};

const buildFavoriteDeal = (
  deal: DealInstanceRow,
  template: DealTemplateRow,
  restaurant: RestaurantRow,
  referenceData: DealReferenceData,
  favoriteCreatedAtByDealId: Map<string, string>,
): FavoriteDeal => {
  const { imageUrl, imageVariants } = getFavoriteDealImageData(
    template.deal_images as DealImageRow[] | null | undefined,
    template.image_metadata,
  );
  const isAnonymous = template.is_anonymous ?? false;
  const userData = getSingleRelation(template.user);
  const userDisplayName = isAnonymous ? 'Anonymous' : (userData?.display_name || 'Unknown User');

  return {
    id: deal.deal_id,
    title: template.title || '',
    description: template.description || '',
    imageUrl,
    imageVariants,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    distance: formatDistance(referenceData.distanceMap.get(restaurant.restaurant_id)),
    dealCount: referenceData.dealCountsMap.get(restaurant.restaurant_id) || 0,
    cuisineName: referenceData.cuisinesMap.get(template.cuisine_id ?? '')?.cuisine_name || 'Unknown',
    categoryName: referenceData.categoriesMap.get(template.category_id ?? '')?.category_name || 'Unknown',
    createdAt: favoriteCreatedAtByDealId.get(deal.deal_id) || new Date().toISOString(),
    isFavorited: true,
    userId: template.user_id ?? undefined,
    userDisplayName,
    userProfilePhoto: getUserProfilePhotoUrl(template.user, isAnonymous) ?? null,
    isAnonymous,
  };
};

const fetchFavoriteDealRows = async (
  userId: string,
  span: PerfSpanLike,
): Promise<FavoriteDealRow[]> => {
  const { data: favoriteDataRaw, error: favoriteError } = await supabase
    .from('favorite')
    .select('deal_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const favoriteData = (favoriteDataRaw ?? []) as FavoriteDealRow[];
  span.recordRoundTrip({
    source: 'query.favorite.deals',
    responseCount: favoriteData.length,
    error: favoriteError?.message ?? null,
  });

  if (favoriteError) {
    throw favoriteError;
  }

  return favoriteData;
};

const fetchDealInstances = async (
  dealIds: string[],
  span: PerfSpanLike,
): Promise<DealInstanceRow[]> => {
  const { data: dealsRaw, error: dealsError } = await supabase
    .from('deal_instance')
    .select('deal_id, template_id, start_date, end_date')
    .in('deal_id', dealIds);

  const deals = (dealsRaw ?? []) as DealInstanceRow[];
  span.recordRoundTrip({
    source: 'query.deal_instance.by_deal_ids',
    responseCount: deals.length,
    error: dealsError?.message ?? null,
  });

  if (dealsError) {
    throw dealsError;
  }

  return deals;
};

const fetchTemplates = async (
  templateIds: string[],
  span: PerfSpanLike,
): Promise<DealTemplateRow[]> => {
  const { data: templatesDataRaw, error: templatesError } = await supabase
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

  const templatesData = (templatesDataRaw ?? []) as DealTemplateRow[];
  span.recordRoundTrip({
    source: 'query.deal_template.by_template_ids',
    responseCount: templatesData.length,
    error: templatesError?.message ?? null,
  });

  if (templatesError) {
    throw templatesError;
  }

  return templatesData;
};

interface MissingReferenceIds { missingCategoryIds: string[]; missingCuisineIds: string[]; missingRestaurantIds: string[]; }

const getMissingReferenceIds = (
  categoryIds: string[],
  cuisineIds: string[],
  restaurantIds: string[],
  relationMaps: {
    categories: Map<string, CategoryRow>;
    cuisines: Map<string, CuisineRow>;
    restaurants: Map<string, RestaurantRow>;
  },
): MissingReferenceIds => ({
  missingCategoryIds: categoryIds.filter((id) => !relationMaps.categories.has(id)),
  missingCuisineIds: cuisineIds.filter((id) => !relationMaps.cuisines.has(id)),
  missingRestaurantIds: restaurantIds.filter((id) => !relationMaps.restaurants.has(id)),
});

const fetchReferenceQueryResults = async (
  missingIds: MissingReferenceIds,
  restaurantIds: string[],
  userId: string,
): Promise<{
  categoriesResult: QueryResult<CategoryRow>;
  cuisinesResult: QueryResult<CuisineRow>;
  dealCountsResult: QueryResult<DealCountRow>;
  distancesResult: QueryResult<DistanceRow>;
  restaurantsResult: QueryResult<RestaurantRow>;
}> => {
  const [restaurantsResultRaw, cuisinesResultRaw, categoriesResultRaw, distancesResultRaw, dealCountsResultRaw] =
    await Promise.all([
      missingIds.missingRestaurantIds.length > 0
        ? supabase
            .from('restaurant')
            .select('restaurant_id, name, address')
            .in('restaurant_id', missingIds.missingRestaurantIds)
        : Promise.resolve(emptyQueryResult<RestaurantRow>()),
      missingIds.missingCuisineIds.length > 0
        ? supabase
            .from('cuisine')
            .select('cuisine_id, cuisine_name')
            .in('cuisine_id', missingIds.missingCuisineIds)
        : Promise.resolve(emptyQueryResult<CuisineRow>()),
      missingIds.missingCategoryIds.length > 0
        ? supabase
            .from('category')
            .select('category_id, category_name')
            .in('category_id', missingIds.missingCategoryIds)
        : Promise.resolve(emptyQueryResult<CategoryRow>()),
      restaurantIds.length > 0
        ? supabase.rpc('get_restaurant_coords_with_distance', {
            restaurant_ids: restaurantIds,
            user_uuid: userId,
          })
        : Promise.resolve(emptyQueryResult<DistanceRow>()),
      restaurantIds.length > 0
        ? supabase.rpc('get_deal_counts_for_restaurants', { r_ids: restaurantIds })
        : Promise.resolve(emptyQueryResult<DealCountRow>()),
    ]);

  return {
    categoriesResult: asQueryResult<CategoryRow>(categoriesResultRaw),
    cuisinesResult: asQueryResult<CuisineRow>(cuisinesResultRaw),
    dealCountsResult: asQueryResult<DealCountRow>(dealCountsResultRaw),
    distancesResult: asQueryResult<DistanceRow>(distancesResultRaw),
    restaurantsResult: asQueryResult<RestaurantRow>(restaurantsResultRaw),
  };
};

const recordReferenceRoundTrips = (
  span: PerfSpanLike,
  missingIds: MissingReferenceIds,
  results: {
    categoriesResult: QueryResult<CategoryRow>;
    cuisinesResult: QueryResult<CuisineRow>;
    dealCountsResult: QueryResult<DealCountRow>;
    distancesResult: QueryResult<DistanceRow>;
    restaurantsResult: QueryResult<RestaurantRow>;
  },
) => {
  if (missingIds.missingRestaurantIds.length > 0) {
    span.recordRoundTrip({
      source: 'query.restaurant.by_restaurant_ids',
      responseCount: results.restaurantsResult.data?.length ?? 0,
      error: results.restaurantsResult.error?.message ?? null,
    });
  }
  if (missingIds.missingCuisineIds.length > 0) {
    span.recordRoundTrip({
      source: 'query.cuisine.by_cuisine_ids',
      responseCount: results.cuisinesResult.data?.length ?? 0,
      error: results.cuisinesResult.error?.message ?? null,
    });
  }
  if (missingIds.missingCategoryIds.length > 0) {
    span.recordRoundTrip({
      source: 'query.category.by_category_ids',
      responseCount: results.categoriesResult.data?.length ?? 0,
      error: results.categoriesResult.error?.message ?? null,
    });
  }

  span.recordRoundTrip({
    source: 'rpc.get_restaurant_coords_with_distance',
    responseCount: results.distancesResult.data?.length ?? 0,
    error: results.distancesResult.error?.message ?? null,
  });
  span.recordRoundTrip({
    source: 'rpc.get_deal_counts_for_restaurants',
    responseCount: results.dealCountsResult.data?.length ?? 0,
    error: results.dealCountsResult.error?.message ?? null,
  });
};

const buildReferenceData = (
  relationMaps: {
    categories: Map<string, CategoryRow>;
    cuisines: Map<string, CuisineRow>;
    restaurants: Map<string, RestaurantRow>;
  },
  results: {
    categoriesResult: QueryResult<CategoryRow>;
    cuisinesResult: QueryResult<CuisineRow>;
    dealCountsResult: QueryResult<DealCountRow>;
    distancesResult: QueryResult<DistanceRow>;
    restaurantsResult: QueryResult<RestaurantRow>;
  },
): DealReferenceData => {
  const restaurantsMap = new Map<string, RestaurantRow>(relationMaps.restaurants);
  (results.restaurantsResult.data ?? []).forEach((restaurant) => {
    restaurantsMap.set(restaurant.restaurant_id, restaurant);
  });

  const cuisinesMap = new Map<string, CuisineRow>(relationMaps.cuisines);
  (results.cuisinesResult.data ?? []).forEach((cuisine) => {
    cuisinesMap.set(cuisine.cuisine_id, cuisine);
  });

  const categoriesMap = new Map<string, CategoryRow>(relationMaps.categories);
  (results.categoriesResult.data ?? []).forEach((category) => {
    categoriesMap.set(category.category_id, category);
  });

  if (results.distancesResult.error) {
    console.error('Error fetching restaurant distances:', results.distancesResult.error);
  }

  return {
    categoriesMap,
    cuisinesMap,
    dealCountsMap: buildDealCountMap(results.dealCountsResult.data),
    distanceMap: buildDistanceMap(results.distancesResult.data),
    restaurantsMap,
  };
};

export const fetchFavoriteDealsFromDatabase = async (
  userId: string,
  span: PerfSpanLike,
): Promise<FavoriteDeal[]> => {
  const favoriteData = await fetchFavoriteDealRows(userId, span);
  if (favoriteData.length === 0) {
    return [];
  }

  const dealIds = uniqueDefined(favoriteData.map((favorite) => favorite.deal_id));
  if (dealIds.length === 0) {
    return [];
  }

  const deals = await fetchDealInstances(dealIds, span);
  if (deals.length === 0) {
    return [];
  }

  const templateIds = uniqueDefined(deals.map((deal) => deal.template_id));
  if (templateIds.length === 0) {
    return [];
  }

  const templatesData = await fetchTemplates(templateIds, span);
  const templatesMap = new Map<string, DealTemplateRow>(
    templatesData.map((template) => [template.template_id, template]),
  );
  const relationMaps = buildTemplateRelationMaps(templatesData);

  const restaurantIds = uniqueDefined(templatesData.map((template) => template.restaurant_id));
  const cuisineIds = uniqueDefined(templatesData.map((template) => template.cuisine_id));
  const categoryIds = uniqueDefined(templatesData.map((template) => template.category_id));
  const missingIds = getMissingReferenceIds(categoryIds, cuisineIds, restaurantIds, relationMaps);

  const referenceQueryResults = await fetchReferenceQueryResults(missingIds, restaurantIds, userId);
  recordReferenceRoundTrips(span, missingIds, referenceQueryResults);

  const referenceData = buildReferenceData(relationMaps, referenceQueryResults);
  const favoriteCreatedAtByDealId = buildFavoriteCreatedAtMap(favoriteData);

  const favoriteDeals = deals.reduce<FavoriteDeal[]>((accumulator, deal) => {
    const template = templatesMap.get(deal.template_id);
    if (!template) return accumulator;

    const restaurant = referenceData.restaurantsMap.get(template.restaurant_id);
    if (!restaurant) return accumulator;

    accumulator.push(
      buildFavoriteDeal(deal, template, restaurant, referenceData, favoriteCreatedAtByDealId),
    );
    return accumulator;
  }, []);

  favoriteDeals.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return favoriteDeals;
};
