/**
 * useFavorites Hook - Favorites Feature
 * 
 * Access and manage favorites state.
 */

import { useFavoritesStore } from '../stores/FavoritesStore';
import type { FavoriteDealData } from '../types';

export function useFavorites<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useFavorites(): {
  unfavoritedItems: Set<string>;
  unfavoritedRestaurants: Set<string>;
  markAsUnfavorited: (id: string, type: 'deal' | 'restaurant') => void;
  markAsFavorited: (id: string, type: 'deal' | 'restaurant', dealData?: FavoriteDealData) => void;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  getNewlyFavoritedDeals: () => FavoriteDealData[];
  clearUnfavorited: () => void;
  clearNewlyFavorited: () => void;
};

export function useFavorites<T>(selector?: (state: any) => T) {
  if (selector) {
    return useFavoritesStore(selector as any) as unknown as T;
  }
  
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
    clearNewlyFavorited
  };
}

// Re-export type for convenience
export type { FavoriteDealData } from '../types';
