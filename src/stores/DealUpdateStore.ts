import { create } from 'zustand';

import type { Deal } from '../types/deal';

interface DealUpdateState {
  // Map of updated deals (id -> deal object)
  updatedDeals: Map<string, Deal>;
  // Flag indicating a post was added (used to trigger feed refreshes)
  postAdded: boolean;

  // Actions
  updateDeal: (deal: Deal) => void;
  getUpdatedDeal: (dealId: string) => Deal | undefined;
  clearUpdatedDeal: (dealId: string) => void;
  setPostAdded: (added: boolean) => void;
  resetPostAdded: () => void;
  clearAll: () => void;
}

export const useDealUpdateStore = create<DealUpdateState>((set, get) => ({
  updatedDeals: new Map<string, Deal>(),
  postAdded: false,

  updateDeal: (deal) => {
    set((state) => {
      const next = new Map(state.updatedDeals);
      next.set(deal.id, deal);
      return { updatedDeals: next };
    });
  },
  getUpdatedDeal: (dealId) => {
    return get().updatedDeals.get(dealId);
  },
  clearUpdatedDeal: (dealId) => {
    set((state) => {
      const next = new Map(state.updatedDeals);
      next.delete(dealId);
      return { updatedDeals: next };
    });
  },
  setPostAdded: (added) => set({ postAdded: added }),
  resetPostAdded: () => set({ postAdded: false }),
  clearAll: () => set({ updatedDeals: new Map(), postAdded: false }),
}));
