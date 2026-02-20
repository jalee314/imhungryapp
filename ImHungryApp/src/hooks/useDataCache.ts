import { useDataCacheStore } from '../stores/DataCacheStore';

/**
 * Convenience hook for DataCacheStore.
 * Subscribes to individual slices to avoid unnecessary re-renders.
 */
export function useDataCache() {
  const categories = useDataCacheStore((s) => s.categories);
  const cuisines = useDataCacheStore((s) => s.cuisines);
  const restaurants = useDataCacheStore((s) => s.restaurants);
  const loading = useDataCacheStore((s) => s.loading);
  const error = useDataCacheStore((s) => s.error);

  return { categories, cuisines, restaurants, loading, error };
}
