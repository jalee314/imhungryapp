/**
 * Feed Feature - Public API
 * 
 * @example
 * import { useDataCache, useDealUpdate } from '@/features/feed';
 */

// Hooks
export { useDataCache } from './hooks/useDataCache';
export { useDealUpdate } from './hooks/useDealUpdate';

// Stores
export { useDataCacheStore, useInitializeDataCache } from './stores/DataCacheStore';
export { useDealUpdateStore } from './stores/DealUpdateStore';

// Components
export { 
  FeedLoadingState, 
  FeedEmptyState, 
  FeedErrorState, 
  FeaturedDealsSection, 
  DealsForYouSection 
} from './components';

// Types
export type {
  Deal,
  DatabaseDeal,
  CreateDealData,
  Category,
  Cuisine,
  Restaurant,
  ImageVariants,
  ImageType,
  InteractionType,
  InteractionSource,
  DealCardProps,
} from './types';
