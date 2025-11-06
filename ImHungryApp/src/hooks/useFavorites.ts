import { useFavoritesStore } from '../stores/FavoritesStore';

// Allow selector overload like other hooks.
export function useFavorites<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useFavorites(): {
  unfavoritedItems: Set<string>;
  unfavoritedRestaurants: Set<string>;
  markAsUnfavorited: (id: string, type: 'deal' | 'restaurant') => void;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  clearUnfavorited: () => void;
};
export function useFavorites<T>(selector?: (state: any) => T) {
  if (selector) {
    return useFavoritesStore(selector as any) as unknown as T;
  }
  const unfavoritedItems = useFavoritesStore((s) => s.unfavoritedItems);
  const unfavoritedRestaurants = useFavoritesStore((s) => s.unfavoritedRestaurants);
  const markAsUnfavorited = useFavoritesStore((s) => s.markAsUnfavorited);
  const isUnfavorited = useFavoritesStore((s) => s.isUnfavorited);
  const clearUnfavorited = useFavoritesStore((s) => s.clearUnfavorited);

  return { unfavoritedItems, unfavoritedRestaurants, markAsUnfavorited, isUnfavorited, clearUnfavorited };
}
