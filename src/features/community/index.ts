/**
 * @file Community feature barrel export
 *
 * Public API for the community (Featured Deals) feature module.
 */

// Container (the composed screen)
export { default as CommunityContainer } from './CommunityContainer';

// Headless hook (for consumers that need custom layout)
export { useCommunity } from './useCommunity';

// Section components
export {
  CommunityHeader,
  CommunityDealsGrid,
  CommunityLoadingState,
  CommunityEmptyState,
  CommunityErrorState,
} from './sections';

// Types
export type {
  CommunityState,
  CommunityInteractions,
  CommunityContext,
} from './types';
