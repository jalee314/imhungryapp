/**
 * Favorites Store - Favorites Feature
 * 
 * Manages local tracking of favorited/unfavorited items for optimistic UI updates.
 */

import { create } from 'zustand';
import type { FavoriteDealData } from '../types';

interface FavoritesState {
  unfavoritedItems: Set<string>;
  unfavoritedRestaurants: Set<string>;
  newlyFavoritedDeals: Map<string, FavoriteDealData>;
  markAsUnfavorited: (id: string, type: 'deal' | 'restaurant') => void;
  markAsFavorited: (id: string, type: 'deal' | 'restaurant', dealData?: FavoriteDealData) => void;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  getNewlyFavoritedDeals: () => FavoriteDealData[];
  clearUnfavorited: () => void;
  clearNewlyFavorited: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  unfavoritedItems: new Set<string>(),
  unfavoritedRestaurants: new Set<string>(),
  newlyFavoritedDeals: new Map<string, FavoriteDealData>(),
  
  markAsUnfavorited: (id, type) => {
    if (type === 'deal') {
      set((state) => {
        const newUnfavorited = new Set(state.unfavoritedItems).add(id);
        const newFavorited = new Map(state.newlyFavoritedDeals);
        newFavorited.delete(id);
        return { unfavoritedItems: newUnfavorited, newlyFavoritedDeals: newFavorited };
      });
    } else {
      set((state) => ({ 
        unfavoritedRestaurants: new Set(state.unfavoritedRestaurants).add(id) 
      }));
    }
  },
  
  markAsFavorited: (id, type, dealData) => {
    if (type === 'deal') {
      set((state) => {
        const newUnfavorited = new Set(state.unfavoritedItems);
        newUnfavorited.delete(id);
        const newFavorited = new Map(state.newlyFavoritedDeals);
        if (dealData) {
          newFavorited.set(id, dealData);
        }
        return { unfavoritedItems: newUnfavorited, newlyFavoritedDeals: newFavorited };
      });
    } else {
      set((state) => {
        const newUnfavorited = new Set(state.unfavoritedRestaurants);
        newUnfavorited.delete(id);
        return { unfavoritedRestaurants: newUnfavorited };
      });
    }
  },
  
  isUnfavorited: (id, type) => {
    return type === 'deal'
      ? get().unfavoritedItems.has(id)
      : get().unfavoritedRestaurants.has(id);
  },
  
  getNewlyFavoritedDeals: () => {
    return Array.from(get().newlyFavoritedDeals.values());
  },
  
  clearUnfavorited: () => set({ 
    unfavoritedItems: new Set(), 
    unfavoritedRestaurants: new Set() 
  }),
  
  clearNewlyFavorited: () => set({ 
    newlyFavoritedDeals: new Map() 
  }),
}));
