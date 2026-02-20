import { useFavoritesStore } from '../stores/FavoritesStore';

// Re-export for convenience
export type { FavoriteDealData } from '../stores/FavoritesStore';

/**
 * Convenience hook for FavoritesStore.
 * Subscribes to individual slices to avoid unnecessary re-renders.
 */
export function useFavorites() {
  const unfavoritedItems = useFavoritesStore((s) => s.unfavoritedItems);
  const unfavoritedRestaurants = useFavoritesStore((s) => s.unfavoritedRestaurants);
  const markAsUnfavorited = useFavoritesStore((s) => s.markAsUnfavorited);
  const markAsFavorited = useFavoritesStore((s) => s.markAsFavorited);
  const isUnfavorited = useFavoritesStore((s) => s.isUnfavorited);
  const getNewlyFavoritedDeals = useFavoritesStore((s) => s.getNewlyFavoritedDeals);
  const clearUnfavorited = useFavoritesStore((s) => s.clearUnfavorited);
  const clearNewlyFavorited = useFavoritesStore((s) => s.clearNewlyFavorited);

  return {
    unfavoritedItems,
    unfavoritedRestaurants,
    markAsUnfavorited,
    markAsFavorited,
    isUnfavorited,
    getNewlyFavoritedDeals,
    clearUnfavorited,
    clearNewlyFavorited,
  };
}
