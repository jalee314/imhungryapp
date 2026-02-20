import { useDealUpdateStore } from '../stores/DealUpdateStore';

/**
 * Convenience hook for DealUpdateStore.
 * Subscribes to individual slices to avoid unnecessary re-renders.
 */
export function useDealUpdate() {
  const updateDeal = useDealUpdateStore((s) => s.updateDeal);
  const getUpdatedDeal = useDealUpdateStore((s) => s.getUpdatedDeal);
  const clearUpdatedDeal = useDealUpdateStore((s) => s.clearUpdatedDeal);
  const postAdded = useDealUpdateStore((s) => s.postAdded);
  const setPostAdded = useDealUpdateStore((s) => s.setPostAdded);

  return { updateDeal, getUpdatedDeal, clearUpdatedDeal, postAdded, setPostAdded };
}
