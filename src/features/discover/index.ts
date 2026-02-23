/**
 * @file Discover feature barrel export
 *
 * Public API for the discover (restaurant search) feature module.
 */

// Container (the composed screen)
export { default as DiscoverContainer } from './DiscoverContainer';

// Headless hook (for consumers that need custom layout)
export { useDiscover } from './useDiscover';

// Section components
export {
  DiscoverSearchBar,
  DiscoverSearchBarSkeleton,
  DiscoverRestaurantList,
  DiscoverLoadingState,
  DiscoverErrorState,
  DiscoverEmptyState,
} from './sections';

// Types
export type {
  DiscoverState,
  DiscoverInteractions,
  DiscoverContext,
} from './types';
