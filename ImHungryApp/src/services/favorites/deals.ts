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

const emptyQueryResult = <T>(): QueryResult<T> => ({
  data: [],
  error: null,
});

const asQueryResult = <T>(value: unknown): QueryResult<T> => value as QueryResult<T>;

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

const uniqueDefined = (values: Array<string | null | undefined>): string[] => {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
};

const buildFavoriteDeal = (
  deal: DealInstanceRow,
  template: DealTemplateRow,
  restaurant: RestaurantRow,
  cuisinesMap: Map<string, CuisineRow>,
  categoriesMap: Map<string, CategoryRow>,
  distanceMap: Map<string, number | null>,
  dealCountsMap: Map<string, number>,
  favoriteCreatedAtByDealId: Map<string, string>,
): FavoriteDeal => {
  const { imageUrl, imageVariants } = getFavoriteDealImageData(
    template.deal_images as DealImageRow[] | null | undefined,
    template.image_metadata,
  );
  const isAnonymous = template.is_anonymous ?? false;
  const userData = getSingleRelation(template.user);
  const userDisplayName = isAnonymous ? 'Anonymous' : (userData?.display_name || 'Unknown User');
  const userProfilePhoto = getUserProfilePhotoUrl(template.user, isAnonymous);

  return {
    id: deal.deal_id,
    title: template.title || '',
    description: template.description || '',
    imageUrl,
    imageVariants,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    distance: formatDistance(distanceMap.get(restaurant.restaurant_id)),
    dealCount: dealCountsMap.get(restaurant.restaurant_id) || 0,
    cuisineName: cuisinesMap.get(template.cuisine_id ?? '')?.cuisine_name || 'Unknown',
    categoryName: categoriesMap.get(template.category_id ?? '')?.category_name || 'Unknown',
    createdAt: favoriteCreatedAtByDealId.get(deal.deal_id) || new Date().toISOString(),
    isFavorited: true,
    userId: template.user_id ?? undefined,
    userDisplayName,
    userProfilePhoto: userProfilePhoto ?? null,
    isAnonymous,
  };
};

export const fetchFavoriteDealsFromDatabase = async (
  userId: string,
  span: PerfSpanLike,
): Promise<FavoriteDeal[]> => {
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

  if (favoriteData.length === 0) {
    return [];
  }

  const dealIds = uniqueDefined(favoriteData.map((favorite) => favorite.deal_id));
  if (dealIds.length === 0) {
    return [];
  }

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

  if (deals.length === 0) {
    return [];
  }

  const templateIds = uniqueDefined(deals.map((deal) => deal.template_id));
  if (templateIds.length === 0) {
    return [];
  }

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

  const templatesMap = new Map<string, DealTemplateRow>(
    templatesData.map((template) => [template.template_id, template]),
  );
  const relationMaps = buildTemplateRelationMaps(templatesData);

  const restaurantIds = uniqueDefined(templatesData.map((template) => template.restaurant_id));
  const cuisineIds = uniqueDefined(templatesData.map((template) => template.cuisine_id));
  const categoryIds = uniqueDefined(templatesData.map((template) => template.category_id));

  const missingRestaurantIds = restaurantIds.filter((id) => !relationMaps.restaurants.has(id));
  const missingCuisineIds = cuisineIds.filter((id) => !relationMaps.cuisines.has(id));
  const missingCategoryIds = categoryIds.filter((id) => !relationMaps.categories.has(id));

  const [restaurantsResultRaw, cuisinesResultRaw, categoriesResultRaw, distancesResultRaw, dealCountsResultRaw] =
    await Promise.all([
      missingRestaurantIds.length > 0
        ? supabase
            .from('restaurant')
            .select('restaurant_id, name, address')
            .in('restaurant_id', missingRestaurantIds)
        : Promise.resolve(emptyQueryResult<RestaurantRow>()),
      missingCuisineIds.length > 0
        ? supabase
            .from('cuisine')
            .select('cuisine_id, cuisine_name')
            .in('cuisine_id', missingCuisineIds)
        : Promise.resolve(emptyQueryResult<CuisineRow>()),
      missingCategoryIds.length > 0
        ? supabase
            .from('category')
            .select('category_id, category_name')
            .in('category_id', missingCategoryIds)
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

  const restaurantsResult = asQueryResult<RestaurantRow>(restaurantsResultRaw);
  const cuisinesResult = asQueryResult<CuisineRow>(cuisinesResultRaw);
  const categoriesResult = asQueryResult<CategoryRow>(categoriesResultRaw);
  const distancesResult = asQueryResult<DistanceRow>(distancesResultRaw);
  const dealCountsResult = asQueryResult<DealCountRow>(dealCountsResultRaw);

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

  const restaurantsMap = new Map<string, RestaurantRow>(relationMaps.restaurants);
  (restaurantsResult.data ?? []).forEach((restaurant) => {
    restaurantsMap.set(restaurant.restaurant_id, restaurant);
  });

  const cuisinesMap = new Map<string, CuisineRow>(relationMaps.cuisines);
  (cuisinesResult.data ?? []).forEach((cuisine) => {
    cuisinesMap.set(cuisine.cuisine_id, cuisine);
  });

  const categoriesMap = new Map<string, CategoryRow>(relationMaps.categories);
  (categoriesResult.data ?? []).forEach((category) => {
    categoriesMap.set(category.category_id, category);
  });

  if (distancesResult.error) {
    console.error('Error fetching restaurant distances:', distancesResult.error);
  }
  const distanceMap = buildDistanceMap(distancesResult.data);
  const dealCountsMap = buildDealCountMap(dealCountsResult.data);
  const favoriteCreatedAtByDealId = new Map<string, string>(
    favoriteData
      .filter((favorite): favorite is FavoriteDealRow & { deal_id: string } => Boolean(favorite.deal_id))
      .map((favorite) => [favorite.deal_id, favorite.created_at]),
  );

  const favoriteDeals = deals.reduce<FavoriteDeal[]>((accumulator, deal) => {
    const template = templatesMap.get(deal.template_id);
    if (!template) return accumulator;

    const restaurant = restaurantsMap.get(template.restaurant_id);
    if (!restaurant) return accumulator;

    accumulator.push(
      buildFavoriteDeal(
        deal,
        template,
        restaurant,
        cuisinesMap,
        categoriesMap,
        distanceMap,
        dealCountsMap,
        favoriteCreatedAtByDealId,
      ),
    );
    return accumulator;
  }, []);

  favoriteDeals.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return favoriteDeals;
};
