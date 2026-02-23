/**
 * @file Feed feature barrel export
 *
 * Public API for the feed feature module.
 */

// Container (the composed screen)
export { default as FeedContainer } from './FeedContainer';

// Headless hook (for consumers that need custom layout)
export { useFeed } from './useFeed';

// Section components
export {
  CuisineFilterBar,
  FeaturedDealsSection,
  DealsForYouSection,
  FeedLoadingState,
  FeedEmptyState,
  FeedErrorState,
  FeedSectionDivider,
} from './sections';

// Types
export type {
  FeedState,
  FeedLocationState,
  FeedCuisineFilter,
  FeedInteractions,
  FeedContext,
} from './types';
