/**
 * Favorites Feature - Public API
 */

// Hooks
export { useFavorites } from './hooks/useFavorites';

// Stores
export { useFavoritesStore } from './stores/FavoritesStore';

// Components
export {
  FavoritesTabBar,
  FavoritesEmptyState,
  FavoritesLoadingState,
} from './components';

// Types
export type {
  FavoriteDeal,
  FavoriteRestaurant,
  FavoriteDealData,
} from './types';
