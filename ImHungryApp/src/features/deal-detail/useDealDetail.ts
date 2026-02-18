/**
 * @file useDealDetail — Headless hook that owns all DealDetail state & side-effects.
 *
 * Extracted from the original DealDetailScreen monolith so section
 * components can remain purely presentational.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image,
  Share,
  Linking,
  Platform,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { Deal } from '../../types/deal';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { getDealViewCount, getDealViewerPhotos, logShare, logClickThrough } from '../../services/interactionService';
import { useSingleDealInteractionHandlers } from '../../hooks/useFeedInteractionHandlers';
import { supabase } from '../../../lib/supabase';
import type {
  DealDetailState,
  ViewData,
  ImageCarouselState,
  DealInteractions,
  PopupActions,
  ImageViewerState,
  MapModalState,
} from './types';

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
  const { updateDeal, postAdded, setPostAdded } = useDealUpdate();

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
        console.error('Error getting current user:', error);
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
          const interaction = payload.new as any;
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

  // Preload image dimensions for skeleton
  useEffect(() => {
    const getImageSize = async () => {
      try {
        let uriToLoad = '';
        if (dealData.imageVariants) {
          uriToLoad = dealData.imageVariants.large || dealData.imageVariants.original || '';
        } else if (typeof dealData.image === 'string') {
          uriToLoad = dealData.image;
        }
        if (uriToLoad) {
          const timeoutId = setTimeout(() => { setSkeletonHeight(250); }, 1000);
          Image.getSize(
            uriToLoad,
            (width, height) => {
              clearTimeout(timeoutId);
              const aspectRatio = height / width;
              const calculatedHeight = Math.min(aspectRatio * Dimensions.get('window').width, 400);
              setSkeletonHeight(calculatedHeight);
            },
            () => { clearTimeout(timeoutId); setSkeletonHeight(250); },
          );
        } else {
          setSkeletonHeight(250);
        }
      } catch {
        setSkeletonHeight(250);
      }
    };
    getImageSize();
  }, [dealData.id]);

  // Fetch deal data + images from Supabase
  const fetchDealData = useCallback(async (forceRefresh = false) => {
    const hasCachedImages = dealImageCache.has(dealData.id);
    try {
      const { data: instance, error } = await supabase
        .from('deal_instance')
        .select(`
          deal_id, template_id, is_anonymous, end_date,
          deal_template!inner(
            title, description, image_metadata_id,
            user:user_id(display_name, profile_photo, image_metadata:profile_photo_metadata_id(variants)),
            image_metadata:image_metadata_id(variants, original_path),
            deal_images(image_metadata_id, display_order, is_thumbnail,
              image_metadata:image_metadata_id(variants, original_path))
          )
        `)
        .eq('deal_id', dealData.id)
        .single();

      if (error || !instance) {
        if (hasCachedImages && !forceRefresh) {
          const cached = dealImageCache.get(dealData.id)!;
          setCarouselImageUris(cached.carouselUrls);
          setOriginalImageUris(cached.originalUrls);
          setImageLoading(false);
          setHasFetchedFreshImages(true);
        }
        return;
      }

      const template = (instance as any).deal_template as any;

      // Update deal metadata
      if (template) {
        const isAnonymous = (instance as any).is_anonymous ?? false;
        const endDate = (instance as any).end_date;
        let userProfilePhotoUrl: string | undefined;
        if (template.user?.image_metadata?.variants?.small) {
          userProfilePhotoUrl = template.user.image_metadata.variants.small;
        } else if (template.user?.image_metadata?.variants?.thumbnail) {
          userProfilePhotoUrl = template.user.image_metadata.variants.thumbnail;
        } else if (template.user?.profile_photo) {
          userProfilePhotoUrl = template.user.profile_photo;
        }
        setDealData(prev => ({
          ...prev,
          title: template.title || prev.title,
          details: template.description ?? prev.details,
          isAnonymous,
          author: isAnonymous ? 'Anonymous' : (template.user?.display_name || prev.author),
          userDisplayName: template.user?.display_name || prev.userDisplayName,
          userProfilePhoto: userProfilePhotoUrl || prev.userProfilePhoto,
          expirationDate: endDate ?? prev.expirationDate,
        }));
      }

      if (hasCachedImages && !forceRefresh) {
        const cached = dealImageCache.get(dealData.id)!;
        setCarouselImageUris(cached.carouselUrls);
        setOriginalImageUris(cached.originalUrls);
        setImageLoading(false);
        setHasFetchedFreshImages(true);
        return;
      }

      // Process images
      let images = (template?.deal_images || [])
        .map((img: any) => {
          const variants = img?.image_metadata?.variants;
          const originalPath = img?.image_metadata?.original_path;
          return {
            displayOrder: img.display_order ?? 0,
            variants,
            displayUrl: variants?.large || variants?.medium || variants?.original || '',
            originalUrl: originalPath || variants?.public || variants?.original || variants?.large || variants?.medium || '',
          };
        })
        .filter((x: any) => x.displayUrl && x.originalUrl)
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder);

      if (images.length === 0 && template?.image_metadata?.variants) {
        const variants = template.image_metadata.variants;
        const originalPath = template.image_metadata.original_path;
        const displayUrl = variants.large || variants.medium || variants.original || '';
        const originalUrl = originalPath || (variants as any)?.public || variants.original || variants.large || variants.medium || '';
        if (displayUrl && originalUrl) {
          images = [{ displayOrder: 0, variants, displayUrl, originalUrl }];
        }
      }

      if (template && images.length > 0) {
        const firstImageVariants = images[0].variants;
        setDealData(prev => ({ ...prev, imageVariants: firstImageVariants || prev.imageVariants }));
      }

      if (images.length > 0) {
        const carouselUrls = images.map((x: any) => x.displayUrl);
        const origUrls = images.map((x: any) => x.originalUrl);
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
  }, [dealData.id, dealData.title]);

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
  const handleImageLoad = (event?: any) => {
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
    const cached = dealImageCache.get(dealData.id);
    if (cached) {
      setCarouselImageUris(cached.carouselUrls);
      setOriginalImageUris(cached.originalUrls);
      setHasFetchedFreshImages(true);
      setImageLoading(false);
    } else {
      setImageLoading(true);
      setHasFetchedFreshImages(false);
      setCarouselImageUris(null);
      setOriginalImageUris(null);
    }
  }, [dealData.id]);

  // ----- Interaction handlers (vote / fav) --------------------------------
  const { handleUpvote, handleDownvote, handleFavorite } = useSingleDealInteractionHandlers({
    deal: dealData,
    setDeal: setDealData,
  });

  const handleShare = async () => {
    try {
      logShare(dealData.id, 'feed').catch(err => console.error('Failed to log share interaction:', err));
      const result = await Share.share({
        message: `Check out this deal at ${dealData.restaurant}: ${dealData.title}`,
        title: dealData.title,
      });
      if (result.action === Share.sharedAction) {
        console.log('Deal shared successfully');
      }
    } catch (error) {
      console.error('Error sharing deal:', error);
      Alert.alert('Error', 'Unable to share this deal');
    }
  };

  // ----- Map / directions -------------------------------------------------
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const handleDirections = () => {
    logClickThrough(dealData.id, 'feed').catch(err => console.error('Failed to log click-through interaction:', err));
    setIsMapModalVisible(true);
  };

  const handleSelectAppleMaps = async () => {
    setIsMapModalVisible(false);
    try {
      const address = dealData.restaurantAddress || dealData.restaurant;
      const encodedAddress = encodeURIComponent(address);
      const appleMapsUrl = `maps://?daddr=${encodedAddress}`;
      const supported = await Linking.canOpenURL(appleMapsUrl);
      if (supported) {
        await Linking.openURL(appleMapsUrl);
      } else {
        await Linking.openURL(`http://maps.apple.com/?daddr=${encodedAddress}`);
      }
    } catch {
      Alert.alert('Error', 'Unable to open Apple Maps');
    }
  };

  const handleSelectGoogleMaps = async () => {
    setIsMapModalVisible(false);
    try {
      const address = dealData.restaurantAddress || dealData.restaurant;
      const encodedAddress = encodeURIComponent(address);
      let url: string;
      if (Platform.OS === 'ios') {
        url = `comgooglemaps://?daddr=${encodedAddress}`;
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          url = `https://maps.google.com/maps?daddr=${encodedAddress}`;
        }
      } else {
        url = `google.navigation:q=${encodedAddress}`;
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          url = `geo:0,0?q=${encodedAddress}`;
          const geoSupported = await Linking.canOpenURL(url);
          if (!geoSupported) {
            url = `https://maps.google.com/maps?daddr=${encodedAddress}`;
          }
        }
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open Google Maps');
    }
  };

  // ----- Popup (three-dot) ------------------------------------------------
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleMoreButtonPress = () => setIsPopupVisible(true);
  const handleClosePopup = () => setIsPopupVisible(false);
  const handleReportContent = () => setIsPopupVisible(false);
  const handleBlockUser = () => {
    setIsPopupVisible(false);
    (navigation as any).navigate('BlockUser', {
      dealId: dealData.id,
      uploaderUserId: dealData.userId || '00000000-0000-0000-0000-000000000000',
    });
  };

  // ----- User press -------------------------------------------------------
  const handleUserPress = () => {
    if (dealData.isAnonymous || !dealData.userId || !dealData.userDisplayName) return;
    (navigation as any).navigate('UserProfile', {
      viewUser: true,
      username: dealData.userDisplayName,
      userId: dealData.userId,
    });
  };

  // ----- Image viewer modal -----------------------------------------------
  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);
  const [imageViewerKey, setImageViewerKey] = useState(0);

  const openImageViewer = () => {
    setModalImageLoading(true);
    setModalImageError(false);
    setImageViewVisible(true);
    setImageViewerKey(prev => prev + 1);
  };

  // Derived: best-effort original-variant URI swap
  const toOriginalVariantUri = (uri: string): string => {
    if (!uri || typeof uri !== 'string') return uri;
    if (uri.startsWith('https://res.cloudinary.com/')) return uri;
    return uri
      .replace('/large/', '/original/')
      .replace('/medium/', '/original/')
      .replace('/small/', '/original/')
      .replace('/thumbnail/', '/original/')
      .replace('large/', 'original/')
      .replace('medium/', 'original/')
      .replace('small/', 'original/')
      .replace('thumbnail/', 'original/');
  };

  const imagesForCarousel = carouselImageUris && carouselImageUris.length > 0
    ? carouselImageUris
    : (hasFetchedFreshImages && dealData.images && dealData.images.length > 0 ? dealData.images : null);

  const fullScreenImageSource =
    (originalImageUris && originalImageUris[currentImageIndex]) ||
    (imagesForCarousel && imagesForCarousel[currentImageIndex] ? toOriginalVariantUri(imagesForCarousel[currentImageIndex]) : null) ||
    dealData.imageVariants?.original ||
    dealData.imageVariants?.large ||
    (typeof dealData.image === 'string' ? toOriginalVariantUri(dealData.image) : dealData.image);

  // ----- Helpers exposed to sections --------------------------------------
  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'Unknown') return 'Not Known';
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const removeZipCode = (address: string) => {
    return address.replace(/,?\s*\d{5}(-\d{4})?$/, '').trim();
  };

  // Profile picture / display name derivations
  const profilePicture = (dealData.isAnonymous || !dealData.userProfilePhoto)
    ? require('../../../img/Default_pfp.svg.png')
    : { uri: dealData.userProfilePhoto };

  const displayName = dealData.isAnonymous
    ? 'Anonymous'
    : (dealData.userDisplayName || 'Unknown User');

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
      handleShare,
      handleDirections,
    } as DealInteractions,

    // Popup
    popup: {
      isPopupVisible,
      handleMoreButtonPress,
      handleClosePopup,
      handleReportContent,
      handleBlockUser,
    } as PopupActions,

    // Image viewer modal
    imageViewer: {
      isVisible: isImageViewVisible,
      open: openImageViewer,
      close: () => setImageViewVisible(false),
      modalImageLoading,
      modalImageError,
      setModalImageLoading,
      setModalImageError,
      fullScreenImageSource,
      imageViewerKey,
    } as ImageViewerState,

    // Map modal
    mapModal: {
      isVisible: isMapModalVisible,
      onClose: () => setIsMapModalVisible(false),
      onSelectAppleMaps: handleSelectAppleMaps,
      onSelectGoogleMaps: handleSelectGoogleMaps,
    } as MapModalState,

    // Helpers
    formatDate,
    removeZipCode,
    profilePicture,
    displayName,
    handleUserPress,
  };
}
