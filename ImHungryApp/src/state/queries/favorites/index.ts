/**
 * state/queries/favorites/index.ts
 *
 * Favorites query module exports.
 */

export {
  useFavoriteDealsQuery,
  useFavoriteRestaurantsQuery,
  useToggleRestaurantFavorite,
  useInvalidateFavorites,
  useIsDealFavorited,
  useIsRestaurantFavorited,
  favoritesKeys,
} from './useFavoritesQuery'

export {
  useFavoritesPageQuery,
  favoritesKeys as favoritesPageKeys,
} from './useFavoritesPageQuery'

export type { UseFavoritesPageQueryResult } from './useFavoritesPageQuery'
