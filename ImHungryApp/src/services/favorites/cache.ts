import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';

const CACHE_DURATION_MS = 30000;

export const favoritesCache = {
  restaurants: new Map<string, FavoriteRestaurant[]>(),
  deals: new Map<string, FavoriteDeal[]>(),
  lastFetch: new Map<string, number>(),
  CACHE_DURATION_MS,
};

export const getDealsCacheKey = (userId: string) => `deals_${userId}`;

export const getRestaurantsCacheKey = (userId: string) => `restaurants_${userId}`;
