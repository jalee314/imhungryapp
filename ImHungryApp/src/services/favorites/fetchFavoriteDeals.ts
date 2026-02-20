import { supabase } from '../../../lib/supabase';
import type { FavoriteDeal } from '../../types/favorites';
import { logger } from '../../utils/logger';

import { favoritesCache, getDealsCacheKey } from './cache';
import { formatDistance, getPreferredImageUrl, type ImageSource } from './shared';

interface FavoriteDealRow {
  deal_id: string | null;
  created_at: string;
}

interface DealInstanceRow {
  deal_id: string;
  template_id: string;
  start_date: string | null;
  end_date: string | null;
}

const readDealsCache = (cacheKey: string, now: number): FavoriteDeal[] | null => {
  const lastFetch = favoritesCache.lastFetch.get(cacheKey) || 0;
  const hasFreshCache = now - lastFetch < favoritesCache.CACHE_DURATION_MS;

  if (!hasFreshCache || !favoritesCache.deals.has(cacheKey)) {
    return null;
  }

  return favoritesCache.deals.get(cacheKey) || null;
};

const fetchFavoriteDealRows = async (userId: string): Promise<FavoriteDealRow[]> => {
  const { data, error } = await supabase
    .from('favorite')
    .select('deal_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching favorites:', error);
    return [];
  }

  return (data || []) as FavoriteDealRow[];
};

const fetchDealInstances = async (dealIds: string[]): Promise<DealInstanceRow[]> => {
  if (dealIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('deal_instance')
    .select('deal_id, template_id, start_date, end_date')
    .in('deal_id', dealIds);

  if (error) {
    logger.error('Error fetching deal details:', error);
    return [];
  }

  return (data || []) as DealInstanceRow[];
};

const fetchTemplateRecords = async (templateIds: string[]) => {
  if (templateIds.length === 0) {
    return [];
  }

  const { data } = await supabase
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

  return data || [];
};

const fetchLookupData = async (
  restaurantIds: string[],
  cuisineIds: string[],
  categoryIds: string[],
  userId: string
) => {
  const shouldQueryRestaurants = restaurantIds.length > 0;

  const [restaurantsResult, cuisinesResult, categoriesResult, distancesResult, dealCountsResult] = await Promise.all([
    supabase
      .from('restaurant')
      .select('restaurant_id, name, address')
      .in('restaurant_id', restaurantIds),

    supabase
      .from('cuisine')
      .select('cuisine_id, cuisine_name')
      .in('cuisine_id', cuisineIds),

    supabase
      .from('category')
      .select('category_id, category_name')
      .in('category_id', categoryIds),

    shouldQueryRestaurants
      ? supabase.rpc('get_restaurant_coords_with_distance', {
          restaurant_ids: restaurantIds,
          user_uuid: userId,
        })
      : Promise.resolve({ data: [], error: null }),

    shouldQueryRestaurants
      ? supabase.rpc('get_deal_counts_for_restaurants', { r_ids: restaurantIds })
      : Promise.resolve({ data: [] }),
  ]);

  return {
    restaurantsResult,
    cuisinesResult,
    categoriesResult,
    distancesResult,
    dealCountsResult,
  };
};

const getUserProfilePhoto = (
  template: { is_anonymous?: boolean; user?: unknown },
): string | undefined => {
  if (template.is_anonymous) {
    return undefined;
  }

  const userData = Array.isArray(template.user) ? template.user[0] : template.user;
  const imageMetadata = Array.isArray((userData as { image_metadata?: unknown })?.image_metadata)
    ? (userData as { image_metadata?: Array<{ variants?: { small?: string | null; thumbnail?: string | null } | null }> }).image_metadata?.[0]
    : (userData as { image_metadata?: { variants?: { small?: string | null; thumbnail?: string | null } | null } | null })?.image_metadata;

  return imageMetadata?.variants?.small || imageMetadata?.variants?.thumbnail || undefined;
};

const buildDistanceMap = (
  lookupData: Awaited<ReturnType<typeof fetchLookupData>>
): Map<string, number | null> => {
  const distanceMap = new Map<string, number | null>();
  if (lookupData.distancesResult.error) {
    logger.error('Error fetching restaurant distances:', lookupData.distancesResult.error);
  }

  (lookupData.distancesResult.data || []).forEach((entry: { restaurant_id?: string | null; distance_miles?: number | null }) => {
    if (!entry.restaurant_id) {
      return;
    }
    distanceMap.set(entry.restaurant_id, entry.distance_miles ?? null);
  });

  return distanceMap;
};

const getTemplateUserData = (templateUser: unknown): { display_name?: string | null } | undefined => (
  Array.isArray(templateUser)
    ? templateUser[0] as { display_name?: string | null }
    : templateUser as { display_name?: string | null } | undefined
);

const buildFavoriteDealRecord = (
  deal: DealInstanceRow,
  favoriteRows: FavoriteDealRow[],
  templatesMap: Map<string, unknown>,
  restaurantsMap: Map<string, { restaurant_id: string; name: string; address: string }>,
  cuisinesMap: Map<string, { cuisine_name?: string }>,
  categoriesMap: Map<string, { category_name?: string }>,
  distanceMap: Map<string, number | null>,
  dealCountsMap: Map<string, number>
): FavoriteDeal | null => {
  const template = templatesMap.get(deal.template_id) as {
    title: string;
    description?: string | null;
    restaurant_id: string;
    cuisine_id: string;
    category_id: string;
    user_id: string;
    user?: unknown;
    is_anonymous: boolean;
  } | undefined;
  if (!template) {
    return null;
  }

  const restaurant = restaurantsMap.get(template.restaurant_id);
  if (!restaurant) {
    return null;
  }

  const favoriteRecord = favoriteRows.find((favorite) => favorite.deal_id === deal.deal_id);
  const imageResult = getPreferredImageUrl(template as ImageSource, 'placeholder');
  const userData = getTemplateUserData(template.user);

  return {
    id: deal.deal_id,
    title: template.title,
    description: template.description || '',
    imageUrl: imageResult.imageUrl,
    imageVariants: imageResult.imageVariants,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    distance: formatDistance(distanceMap.get(restaurant.restaurant_id)),
    dealCount: Number(dealCountsMap.get(restaurant.restaurant_id)) || 0,
    cuisineName: cuisinesMap.get(template.cuisine_id)?.cuisine_name || 'Unknown',
    categoryName: categoriesMap.get(template.category_id)?.category_name || 'Unknown',
    createdAt: favoriteRecord?.created_at || new Date().toISOString(),
    isFavorited: true,
    userId: template.user_id,
    userDisplayName: template.is_anonymous ? 'Anonymous' : (userData?.display_name || 'Unknown User'),
    userProfilePhoto: getUserProfilePhoto(template),
    isAnonymous: template.is_anonymous,
  };
};

const buildFavoriteDeals = (
  deals: DealInstanceRow[],
  favoriteRows: FavoriteDealRow[],
  templates: unknown[],
  lookupData: Awaited<ReturnType<typeof fetchLookupData>>,
): FavoriteDeal[] => {
  const templatesMap = new Map(templates.map((template) => [
    (template as { template_id: string }).template_id,
    template,
  ]));

  const restaurantsMap = new Map(
    (lookupData.restaurantsResult.data || []).map((restaurant) => [restaurant.restaurant_id, restaurant])
  );
  const cuisinesMap = new Map(
    (lookupData.cuisinesResult.data || []).map((cuisine) => [cuisine.cuisine_id, cuisine])
  );
  const categoriesMap = new Map(
    (lookupData.categoriesResult.data || []).map((category) => [category.category_id, category])
  );

  const distanceMap = buildDistanceMap(lookupData);

  const dealCountsMap = new Map<string, number>(
    ((lookupData.dealCountsResult.data || []) as Array<{ restaurant_id: string; deal_count: number }>)
      .map((item) => [item.restaurant_id, item.deal_count])
  );

  const favoriteDeals: FavoriteDeal[] = [];

  for (const deal of deals) {
    const record = buildFavoriteDealRecord(
      deal,
      favoriteRows,
      templatesMap,
      restaurantsMap,
      cuisinesMap,
      categoriesMap,
      distanceMap,
      dealCountsMap
    );
    if (record) {
      favoriteDeals.push(record);
    }
  }

  favoriteDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return favoriteDeals;
};

export const fetchFavoriteDealsForUser = async (userId: string): Promise<FavoriteDeal[]> => {
  const cacheKey = getDealsCacheKey(userId);
  const now = Date.now();

  const cached = readDealsCache(cacheKey, now);
  if (cached) {
    return cached;
  }

  const favoriteRows = await fetchFavoriteDealRows(userId);
  if (favoriteRows.length === 0) {
    return [];
  }

  const dealIds = favoriteRows
    .map((favorite) => favorite.deal_id)
    .filter((id): id is string => id !== null);
  const deals = await fetchDealInstances(dealIds);
  const templateIds = [...new Set(deals.map((deal) => deal.template_id))];
  const templates = await fetchTemplateRecords(templateIds);

  const restaurantIds = [...new Set(templates.map((template) => template.restaurant_id).filter(Boolean))];
  const cuisineIds = [...new Set(templates.map((template) => template.cuisine_id).filter(Boolean))];
  const categoryIds = [...new Set(templates.map((template) => template.category_id).filter(Boolean))];

  const lookupData = await fetchLookupData(restaurantIds, cuisineIds, categoryIds, userId);
  const favoriteDeals = buildFavoriteDeals(deals, favoriteRows, templates, lookupData);

  favoritesCache.deals.set(cacheKey, favoriteDeals);
  favoritesCache.lastFetch.set(cacheKey, now);
  return favoriteDeals;
};
