import { useDataCacheStore } from '../stores/DataCacheStore';

// Overload: allow selector or default bundle
export function useDataCache<T>(selector: (state: any) => T, equality?: (a: T, b: T) => boolean): T;
export function useDataCache(): {
  categories: any[];
  cuisines: any[];
  restaurants: any[];
  loading: boolean;
  error: Error | null;
};
export function useDataCache<T>(selector?: (state: any) => T) {
  if (selector) {
    return useDataCacheStore(selector as any) as unknown as T;
  }
  const categories = useDataCacheStore((s) => s.categories);
  const cuisines = useDataCacheStore((s) => s.cuisines);
  const restaurants = useDataCacheStore((s) => s.restaurants);
  const loading = useDataCacheStore((s) => s.loading);
  const error = useDataCacheStore((s) => s.error);

  return { categories, cuisines, restaurants, loading, error };
}
