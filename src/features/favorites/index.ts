/**
 * @file Favorites feature barrel export
 *
 * Public API for the favorites feature module.
 */

// Container (the composed screen)
export { default as FavoritesContainer } from './FavoritesContainer';

// Headless hook (for consumers that need custom layout)
export { useFavoritesScreen } from './useFavoritesScreen';

// Section components
export {
  FavoritesHeader,
  FavoritesTabSelector,
  FavoritesFullSkeleton,
  FavoritesTabSkeleton,
  FavoritesEmptyState,
  FavoritesDealsList,
  FavoritesRestaurantsList,
} from './sections';

// Types
export type {
  FavoritesTab,
  FavoritesState,
  FavoritesInteractions,
  FavoritesContext,
} from './types';
