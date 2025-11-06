import { create } from 'zustand';

// Mirrors previous FavoritesContext API: session-only tracking of unfavorited items
interface FavoritesState {
  unfavoritedItems: Set<string>; // deal IDs marked unfavorited locally
  unfavoritedRestaurants: Set<string>; // restaurant IDs marked unfavorited locally
  markAsUnfavorited: (id: string, type: 'deal' | 'restaurant') => void;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  clearUnfavorited: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  unfavoritedItems: new Set<string>(),
  unfavoritedRestaurants: new Set<string>(),
  markAsUnfavorited: (id, type) => {
    if (type === 'deal') {
      set((state) => ({ unfavoritedItems: new Set(state.unfavoritedItems).add(id) }));
    } else {
      set((state) => ({ unfavoritedRestaurants: new Set(state.unfavoritedRestaurants).add(id) }));
    }
  },
  isUnfavorited: (id, type) => {
    return type === 'deal'
      ? get().unfavoritedItems.has(id)
      : get().unfavoritedRestaurants.has(id);
  },
  clearUnfavorited: () => set({ unfavoritedItems: new Set(), unfavoritedRestaurants: new Set() }),
}));
