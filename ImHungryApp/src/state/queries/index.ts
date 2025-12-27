/**
 * state/queries/index.ts
 *
 * Main entry point for all React Query hooks.
 * Re-exports all query modules for convenient imports.
 *
 * @example
 * import {
 *   useDealsQuery,
 *   useProfileQuery,
 *   useFavoriteDealsQuery,
 *   QueryProvider,
 * } from '#/state/queries'
 */

// Provider
export { QueryProvider, getQueryClient, resetQueryClient, invalidateAllQueries } from './QueryProvider'

// Deals
export {
  useDealsQuery,
  usePrefetchDeals,
  useInvalidateDeals,
  useCreateDeal,
  useDeleteDeal,
  useCheckProfanity,
  useFeedQuery,
  dealsKeys,
  type DealsFilters,
  type UseFeedQueryParams,
  type UseFeedQueryResult,
} from './deals'

// Profile
export {
  useProfileQuery,
  useFullProfileQuery,
  useUserPostsQuery,
  useCurrentUserProfile,
  useInvalidateProfile,
  profileKeys,
} from './profile'

// Restaurants
export {
  useRestaurantsQuery,
  useRestaurantsList,
  useInvalidateRestaurants,
  usePrefetchRestaurants,
  restaurantsKeys,
  type RestaurantsQueryParams,
} from './restaurants'

// Favorites
export {
  useFavoriteDealsQuery,
  useFavoriteRestaurantsQuery,
  useToggleRestaurantFavorite,
  useInvalidateFavorites,
  useIsDealFavorited,
  useIsRestaurantFavorited,
  useFavoritesPageQuery,
  favoritesKeys,
  type UseFavoritesPageQueryResult,
} from './favorites'

// Profile (additional)
export {
  useBlockedUsersQuery,
  blockedUsersKeys,
  type BlockedUser,
} from './profile'

// Admin
export {
  adminKeys,
  useAdminDealsQuery,
  useAdminUsersQuery,
  useAdminReportsQuery,
  useAdminDealMutations,
  useAdminUserMutations,
  useAdminReportMutations,
  type UseAdminDealsQueryParams,
  type UseAdminUsersQueryParams,
  type UseAdminReportsQueryParams,
} from './admin'
