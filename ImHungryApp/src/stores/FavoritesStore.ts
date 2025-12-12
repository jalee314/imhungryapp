import { create } from 'zustand';

// Deal data needed to display in favorites list
export interface FavoriteDealData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  isAnonymous?: boolean;
  favoritedAt: string; // ISO timestamp when favorited - used for sorting
}

// Mirrors previous FavoritesContext API: session-only tracking of unfavorited items
interface FavoritesState {
  unfavoritedItems: Set<string>; // deal IDs marked unfavorited locally
  unfavoritedRestaurants: Set<string>; // restaurant IDs marked unfavorited locally
  newlyFavoritedDeals: Map<string, FavoriteDealData>; // full deal data for instant UI
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
        // Also remove from newly favorited if it was there
        const newFavorited = new Map(state.newlyFavoritedDeals);
        newFavorited.delete(id);
        return { unfavoritedItems: newUnfavorited, newlyFavoritedDeals: newFavorited };
      });
    } else {
      set((state) => ({ unfavoritedRestaurants: new Set(state.unfavoritedRestaurants).add(id) }));
    }
  },
  markAsFavorited: (id, type, dealData) => {
    if (type === 'deal') {
      set((state) => {
        // Remove from unfavorited set (in case it was unfavorited then re-favorited)
        const newUnfavorited = new Set(state.unfavoritedItems);
        newUnfavorited.delete(id);
        // Add full deal data for instant UI update
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
  clearUnfavorited: () => set({ unfavoritedItems: new Set(), unfavoritedRestaurants: new Set() }),
  clearNewlyFavorited: () => set({ newlyFavoritedDeals: new Map() }),
}));
