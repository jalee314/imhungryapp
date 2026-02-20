/**
 * @file useDealDetail — Headless hook that owns all DealDetail state & side-effects.
 *
 * Extracted from the original DealDetailScreen monolith so section
 * components can remain purely presentational.
 */

import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dimensions,
  FlatList,
} from 'react-native';
import type { ImageLoadEventData, NativeSyntheticEvent } from 'react-native';

import { supabase } from '../../../lib/supabase';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useSingleDealInteractionHandlers } from '../../hooks/useFeedInteractionHandlers';
import { getDealViewCount, getDealViewerPhotos } from '../../services/interactionService';
import type { Deal } from '../../types/deal';
import { logger } from '../../utils/logger';

import {
  ViewData,
  ImageCarouselState,
  DealInteractions,
  PopupActions,
  ImageViewerState,
  MapModalState,
} from './types';
import {
  buildTemplateImages,
  fetchDealInstanceRecord,
  formatDealDate,
  mergeDealWithTemplate,
  removeZipCode,
  resolvePrimaryImageUri,
  resolveSkeletonHeight,
  toDealImageVariants,
} from './useDealDetail.helpers';
import { useDealDetailUi, type DealDetailNavigation } from './useDealDetailUi';

// ---------------------------------------------------------------------------
// Route type
// ---------------------------------------------------------------------------
type DealDetailRouteProp = RouteProp<{ DealDetail: { deal: Deal } }, 'DealDetail'>;

// ---------------------------------------------------------------------------
// In-memory image cache (shared across instances, same as original)
// ---------------------------------------------------------------------------
const dealImageCache = new Map<string, { carouselUrls: string[]; originalUrls: string[] }>();

/** Invalidate cached images after an edit. */
export const invalidateDealImageCache = (dealId: string) => {
  dealImageCache.delete(dealId);
};

// ---------------------------------------------------------------------------
// Screen dimensions
// ---------------------------------------------------------------------------
const { width: screenWidth } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useDealDetail() {
  const navigation = useNavigation();
  const route = useRoute<DealDetailRouteProp>();
  const { deal } = route.params;
  const { updateDeal, postAdded } = useDealUpdate();

  // ----- Core state -------------------------------------------------------
  const [dealData, setDealData] = useState<Deal>(deal);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Sync dealData with navigation params
  useEffect(() => { setDealData(deal); }, [deal]);

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        logger.error('Error getting current user:', error);
      }
    };
    fetchCurrentUserId();
  }, []);

  // ----- View data (count + viewer photos) --------------------------------
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [viewerPhotos, setViewerPhotos] = useState<string[] | null>(null);
  const [isViewDataLoading, setIsViewDataLoading] = useState(true);

  useEffect(() => {
    setIsViewDataLoading(true);
    setViewCount(null);
    setViewerPhotos(null);

    const fetchViewData = async () => {
      const [count, photos] = await Promise.all([
        getDealViewCount(dealData.id),
        getDealViewerPhotos(dealData.id, 3),
      ]);
      setViewCount(count);
      setViewerPhotos(photos);
      setIsViewDataLoading(false);
    };

    fetchViewData();

    // Realtime subscription for click interactions
    const subscription = supabase
      .channel(`deal-clicks-${dealData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interaction',
          filter: `deal_id=eq.${dealData.id}`,
        },
        (payload) => {
          const interaction = payload.new;
          if (interaction.interaction_type === 'click') {
            setViewCount(prev => (prev ?? 0) + 1);
          }
        },
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [dealData.id]);

  // ----- Image carousel state ---------------------------------------------
  const cachedImages = dealImageCache.get(deal.id);

  const [imageLoading, setImageLoading] = useState(!cachedImages);
  const [imageError, setImageError] = useState(false);
  const [hasFetchedFreshImages, setHasFetchedFreshImages] = useState(!!cachedImages);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const [carouselImageUris, setCarouselImageUris] = useState<string[] | null>(cachedImages?.carouselUrls || null);
  const [originalImageUris, setOriginalImageUris] = useState<string[] | null>(cachedImages?.originalUrls || null);
  const [skeletonHeight, setSkeletonHeight] = useState(250);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const applyCachedImages = useCallback((): boolean => {
    const cached = dealImageCache.get(dealData.id);
    if (!cached) {
      return false;
    }
    setCarouselImageUris(cached.carouselUrls);
    setOriginalImageUris(cached.originalUrls);
    setImageLoading(false);
    setHasFetchedFreshImages(true);
    return true;
  }, [dealData.id]);

  // Preload image dimensions for skeleton
  useEffect(() => {
    let isMounted = true;
    const loadSkeleton = async () => {
      try {
        const uriToLoad = resolvePrimaryImageUri(
          dealData.image,
          dealData.imageVariants
        );
        const nextHeight = await resolveSkeletonHeight(uriToLoad, screenWidth);
        if (isMounted) {
          setSkeletonHeight(nextHeight);
        }
      } catch {
        if (isMounted) {
          setSkeletonHeight(250);
        }
      }
    };
    loadSkeleton();
    return () => {
      isMounted = false;
    };
  }, [dealData.id, dealData.image, dealData.imageVariants]);

  // Fetch deal data + images from Supabase
  const fetchDealData = useCallback(async (forceRefresh = false) => {
    try {
      const { instance, error } = await fetchDealInstanceRecord(dealData.id);

      if (error || !instance) {
        if (!forceRefresh) {
          applyCachedImages();
        }
        return;
      }

      const template = instance.deal_template;

      if (template) {
        setDealData(prev => mergeDealWithTemplate(prev, instance, template));
      }

      if (!forceRefresh && applyCachedImages()) {
        return;
      }

      const images = buildTemplateImages(template);

      if (template && images.length > 0) {
        const firstImageVariants = toDealImageVariants(images[0].variants);
        setDealData(prev => ({ ...prev, imageVariants: firstImageVariants || prev.imageVariants }));
      }

      if (images.length > 0) {
        const carouselUrls = images.map((x) => x.displayUrl);
        const origUrls = images.map((x) => x.originalUrl);
        dealImageCache.set(dealData.id, { carouselUrls, originalUrls: origUrls });
        setCarouselImageUris(carouselUrls);
        setOriginalImageUris(origUrls);
        setCurrentImageIndex(0);
      }
      setHasFetchedFreshImages(true);
      setImageLoading(false);
    } catch {
      setHasFetchedFreshImages(true);
    }
  }, [applyCachedImages, dealData.id]);

  // Initial fetch
  useEffect(() => { fetchDealData(false); }, [fetchDealData]);

  // Refresh after edit
  useFocusEffect(
    useCallback(() => {
      if (postAdded) {
        setImageLoading(true);
        fetchDealData(true);
      }
    }, [postAdded, fetchDealData]),
  );

  // Propagate deal changes to context
  useEffect(() => { updateDeal(dealData); }, [dealData, updateDeal]);

  // Image load / error handlers
  const handleImageLoad = (event?: NativeSyntheticEvent<ImageLoadEventData>) => {
    setImageLoading(false);
    setImageError(false);
    if (event?.nativeEvent?.source) {
      const { width, height } = event.nativeEvent.source;
      setImageDimensions({ width, height });
      if (width && height) {
        const aspectRatio = height / width;
        setSkeletonHeight(aspectRatio * Dimensions.get('window').width);
      }
    }
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Reset image state when deal changes
  useEffect(() => {
    setImageError(false);
    setImageDimensions(null);
    if (!applyCachedImages()) {
      setImageLoading(true);
      setHasFetchedFreshImages(false);
      setCarouselImageUris(null);
      setOriginalImageUris(null);
    }
  }, [applyCachedImages, dealData.id]);

  // ----- Interaction handlers (vote / fav) --------------------------------
  const { handleUpvote, handleDownvote, handleFavorite } = useSingleDealInteractionHandlers({
    deal: dealData,
    setDeal: setDealData,
  });

  const imagesForCarousel = carouselImageUris && carouselImageUris.length > 0
    ? carouselImageUris
    : (hasFetchedFreshImages && dealData.images && dealData.images.length > 0 ? dealData.images : null);
  const uiState = useDealDetailUi({
    navigation: navigation as unknown as DealDetailNavigation,
    dealData,
    imagesForCarousel,
    originalImageUris,
    currentImageIndex,
  });

  // ----- Return everything ------------------------------------------------
  return {
    // Navigation
    navigation,
    goBack: () => navigation.goBack(),

    // Core state
    dealData,
    setDealData,
    currentUserId,

    // View data
    viewData: {
      viewCount,
      viewerPhotos,
      isLoading: isViewDataLoading,
    } as ViewData,

    // Carousel
    carouselRef,
    screenWidth,
    imagesForCarousel,
    carousel: {
      carouselImageUris,
      originalImageUris,
      currentImageIndex,
      setCurrentImageIndex,
      hasFetchedFreshImages,
      imageLoading,
      imageError,
      skeletonHeight,
      imageDimensions,
      handleImageLoad,
      handleImageError,
    } as ImageCarouselState,

    // Interactions
    interactions: {
      handleUpvote,
      handleDownvote,
      handleFavorite,
      handleShare: uiState.handleShare,
      handleDirections: uiState.handleDirections,
    } as DealInteractions,

    // Popup
    popup: uiState.popup as PopupActions,

    // Image viewer modal
    imageViewer: uiState.imageViewer as ImageViewerState,

    // Map modal
    mapModal: uiState.mapModal as MapModalState,

    // Helpers
    formatDate: formatDealDate,
    removeZipCode,
    profilePicture: uiState.profilePicture,
    displayName: uiState.displayName,
    handleUserPress: uiState.handleUserPress,
  };
}
