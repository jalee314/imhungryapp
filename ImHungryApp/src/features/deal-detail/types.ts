/**
 * @file Deal Detail feature types
 *
 * Shared type definitions for the decomposed DealDetail feature sections.
 */

import type {
  ImageLoadEventData,
  ImageSourcePropType,
  NativeSyntheticEvent
} from 'react-native';

import type { Deal } from '../../types/deal';

/**
 * The full set of state/callbacks the DealDetail container manages.
 * Individual sections pick only what they need.
 */
export interface DealDetailState {
  /** Current (possibly updated) deal data */
  dealData: Deal;
  /** Update deal data (optimistic / from server) */
  setDealData: React.Dispatch<React.SetStateAction<Deal>>;
  /** Current authenticated user id */
  currentUserId: string | null;
}

/**
 * View-count & viewer-photos data displayed next to the restaurant name.
 */
export interface ViewData {
  viewCount: number | null;
  viewerPhotos: string[] | null;
  isLoading: boolean;
}

/**
 * Image carousel / gallery state.
 */
export interface ImageCarouselState {
  /** URLs optimised for in-page display */
  carouselImageUris: string[] | null;
  /** URLs for fullscreen viewing (original / high-res) */
  originalImageUris: string[] | null;
  /** Active slide index */
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  /** Whether we've fetched fresh data from the server */
  hasFetchedFreshImages: boolean;
  /** Whether the primary image is still loading */
  imageLoading: boolean;
  /** Whether the primary image failed to load */
  imageError: boolean;
  /** Skeleton placeholder height */
  skeletonHeight: number;
  /** Resolved image dimensions after load */
  imageDimensions: { width: number; height: number } | null;
  /** Image load success handler */
  handleImageLoad: (event?: NativeSyntheticEvent<ImageLoadEventData>) => void;
  /** Image load error handler */
  handleImageError: () => void;
}

/**
 * Interaction callbacks (vote / favorite / share / directions).
 */
export interface DealInteractions {
  handleUpvote: () => void;
  handleDownvote: () => void;
  handleFavorite: () => void;
  handleShare: () => Promise<void>;
  handleDirections: () => void;
}

/**
 * Three-dot popup (report / block) callbacks.
 */
export interface PopupActions {
  isPopupVisible: boolean;
  handleMoreButtonPress: () => void;
  handleClosePopup: () => void;
  handleReportContent: () => void;
  handleBlockUser: () => void;
}

/**
 * Fullscreen image viewer state.
 */
export interface ImageViewerState {
  isVisible: boolean;
  open: () => void;
  close: () => void;
  modalImageLoading: boolean;
  modalImageError: boolean;
  setModalImageLoading: (v: boolean) => void;
  setModalImageError: (v: boolean) => void;
  /** Derived full-resolution source for the current image */
  fullScreenImageSource: ImageSourcePropType | null;
  imageViewerKey: number;
}

/**
 * Map modal state.
 */
export interface MapModalState {
  isVisible: boolean;
  onClose: () => void;
  onSelectAppleMaps: () => Promise<void>;
  onSelectGoogleMaps: () => Promise<void>;
}
