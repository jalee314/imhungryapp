/**
 * @file Deal-detail feature barrel export
 *
 * Public API for the deal-detail feature module.
 */

// Container (the composed screen)
export { default as DealDetailContainer } from './DealDetailContainer';

// Headless hook (for consumers that need custom layout)
export { useDealDetail, invalidateDealImageCache } from './useDealDetail';

// Section components
export {
  DealDetailHeader,
  RestaurantInfoSection,
  DealMediaCarousel,
  DealActionsBar,
  DealDetailsSection,
  SharedBySection,
  FullScreenImageModal,
  SectionDivider,
} from './sections';

// Types
export type {
  DealDetailState,
  ViewData,
  ImageCarouselState,
  DealInteractions,
  PopupActions,
  ImageViewerState,
  MapModalState,
} from './types';
