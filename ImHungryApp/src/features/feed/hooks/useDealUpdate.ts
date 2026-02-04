/**
 * useDealUpdate Hook - Feed Feature
 * 
 * Manage deal updates across screens.
 */

import { useDealUpdateStore } from '../stores/DealUpdateStore';
import type { Deal } from '../types';

export function useDealUpdate<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useDealUpdate(): {
  updateDeal: (deal: Deal) => void;
  getUpdatedDeal: (dealId: string) => Deal | undefined;
  clearUpdatedDeal: (dealId: string) => void;
  postAdded: boolean;
  setPostAdded: (added: boolean) => void;
};

export function useDealUpdate<T>(selector?: (state: any) => T) {
  if (selector) {
    return useDealUpdateStore(selector as any) as unknown as T;
  }
  
  const updateDeal = useDealUpdateStore((s) => s.updateDeal);
  const getUpdatedDeal = useDealUpdateStore((s) => s.getUpdatedDeal);
  const clearUpdatedDeal = useDealUpdateStore((s) => s.clearUpdatedDeal);
  const postAdded = useDealUpdateStore((s) => s.postAdded);
  const setPostAdded = useDealUpdateStore((s) => s.setPostAdded);

  return { updateDeal, getUpdatedDeal, clearUpdatedDeal, postAdded, setPostAdded };
}
