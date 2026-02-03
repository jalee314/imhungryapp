import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Share,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { Deal } from '../../components/DealCard';
import ThreeDotPopup from '../../components/ThreeDotPopup';
import VoteButtons from '../../components/VoteButtons';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../services/voteService';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { getDealViewCount, getDealViewerPhotos, logShare, logClickThrough } from '../../services/interactionService';
import { useFavorites } from '../../hooks/useFavorites';
import SkeletonLoader from '../../components/SkeletonLoader';
import OptimizedImage from '../../components/OptimizedImage';
import MapSelectionModal from '../../components/MapSelectionModal';
import { supabase } from '../../../lib/supabase';

type DealDetailRouteProp = RouteProp<{ DealDetail: { deal: Deal } }, 'DealDetail'>;

const { width: screenWidth } = Dimensions.get('window');

// In-memory cache for deal images to avoid showing skeleton on repeat views
const dealImageCache = new Map<string, { carouselUrls: string[]; originalUrls: string[] }>();

// Export function to invalidate cache when a deal is edited
export const invalidateDealImageCache = (dealId: string) => {
  dealImageCache.delete(dealId);
};

const DealDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DealDetailRouteProp>();
  const { deal } = route.params;
  const { updateDeal, postAdded, setPostAdded } = useDealUpdate();
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  // Local state for deal interactions
  const [dealData, setDealData] = useState<Deal>(deal);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [viewerPhotos, setViewerPhotos] = useState<string[] | null>(null);
  const [isViewDataLoading, setIsViewDataLoading] = useState(true);
  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [imageViewerKey, setImageViewerKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  // Sync dealData with navigation params when they change
  // This ensures updated data from Feed is reflected when navigating back
  useEffect(() => {
    setDealData(deal);
  }, [deal]);

  // Check if we have cached images for this deal
  const cachedImages = dealImageCache.get(deal.id);

  // Loading states - don't show loading if we have cached images
  const [imageLoading, setImageLoading] = useState(!cachedImages);
  const [imageError, setImageError] = useState(false);
  // Track if we've fetched fresh image data from the server (or have cached data)
  const [hasFetchedFreshImages, setHasFetchedFreshImages] = useState(!!cachedImages);

  // Carousel state for multiple images
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  // Keep two arrays: one for in-page carousel (optimized display) and one for fullscreen (original)
  // Use cached data if available, otherwise wait for fetchDealData
  const [carouselImageUris, setCarouselImageUris] = useState<string[] | null>(cachedImages?.carouselUrls || null);
  const [originalImageUris, setOriginalImageUris] = useState<string[] | null>(cachedImages?.originalUrls || null);

  // State to hold image dimensions for skeleton
  const [skeletonHeight, setSkeletonHeight] = useState(250); // Better default height

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

  // Debug the deal data
  useEffect(() => {
    console.log('🔍 DealDetailScreen received deal data:', {
      id: dealData.id,
      title: dealData.title,
      image: dealData.image,
      imageVariants: dealData.imageVariants,
      hasImageVariants: !!dealData.imageVariants
    });
  }, [dealData]);

  // Preload image dimensions to get proper skeleton height
  useEffect(() => {
    const getImageSize = async () => {
      try {
        let uriToLoad = '';

        if (dealData.imageVariants) {
          // Try to get the large variant for sizing
          uriToLoad = dealData.imageVariants.large || dealData.imageVariants.original || '';
        } else if (typeof dealData.image === 'string') {
          uriToLoad = dealData.image;
        }

        if (uriToLoad) {
          // Set a timeout to ensure skeleton shows even if Image.getSize is slow
          const timeoutId = setTimeout(() => {
            console.log('⚠️ Image.getSize took too long, using default skeleton height');
            setSkeletonHeight(250); // Use reasonable default if getSize is slow
          }, 1000); // 1 second timeout

          Image.getSize(
            uriToLoad,
            (width, height) => {
              clearTimeout(timeoutId); // Cancel timeout if getSize succeeds
              const aspectRatio = height / width;
              const calculatedHeight = Math.min(
                aspectRatio * Dimensions.get('window').width,
                400 // Cap max height
              );
              setSkeletonHeight(calculatedHeight);
              console.log('✅ Preloaded image dimensions, skeleton height:', calculatedHeight);
            },
            (error) => {
              clearTimeout(timeoutId); // Cancel timeout
              console.error('Failed to get image size:', error);
              setSkeletonHeight(250); // Use fallback height on error
            }
          );
        } else {
          // If no URI to load, use default skeleton height
          setSkeletonHeight(250);
        }
      } catch (error) {
        console.error('Error preloading image dimensions:', error);
        setSkeletonHeight(250); // Use fallback height on error
      }
    };

    getImageSize();
  }, [dealData.id]);

  // Function to fetch deal data including images from Supabase
  const fetchDealData = useCallback(async (forceRefresh = false) => {
    // Check if we have cached image data
    const hasCachedImages = dealImageCache.has(dealData.id);
    
    // Always fetch deal metadata from DB to ensure isAnonymous, author, etc. are up to date
    // Only skip if we have cached images AND this isn't a forced refresh - in that case,
    // we still need to fetch metadata but can skip image processing
    try {
      const { data: instance, error } = await supabase
        .from('deal_instance')
        .select(`
          deal_id,
          template_id,
          is_anonymous,
          end_date,
          deal_template!inner(
            title,
            description,
            image_metadata_id,
            user:user_id(
              display_name,
              profile_photo,
              image_metadata:profile_photo_metadata_id(variants)
            ),
            image_metadata:image_metadata_id(variants, original_path),
            deal_images(
              image_metadata_id,
              display_order,
              is_thumbnail,
              image_metadata:image_metadata_id(variants, original_path)
            )
          )
        `)
        .eq('deal_id', dealData.id)
        .single();

      if (error || !instance) {
        console.warn('DealDetailScreen: Could not fetch deal data:', error);
        // If we have cached images, still use them
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

      // Always update deal metadata (isAnonymous, author, etc.) from server
      // This ensures changes like switching to/from anonymous are reflected
      if (template) {
        const isAnonymous = (instance as any).is_anonymous ?? false;
        const endDate = (instance as any).end_date;
        
        // Get user profile photo URL from variants
        let userProfilePhotoUrl: string | undefined = undefined;
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
          isAnonymous: isAnonymous,
          author: isAnonymous ? 'Anonymous' : (template.user?.display_name || prev.author),
          userDisplayName: template.user?.display_name || prev.userDisplayName,
          userProfilePhoto: userProfilePhotoUrl || prev.userProfilePhoto,
          expirationDate: endDate ?? prev.expirationDate,
        }));
      }

      // If we have cached images and not forcing refresh, use cached images but we already updated metadata above
      if (hasCachedImages && !forceRefresh) {
        console.log('✅ Using cached images, metadata updated from server for deal:', dealData.id);
        const cached = dealImageCache.get(dealData.id)!;
        setCarouselImageUris(cached.carouselUrls);
        setOriginalImageUris(cached.originalUrls);
        setImageLoading(false);
        setHasFetchedFreshImages(true);
        return;
      }

      // Process images from server response
      let images = (template?.deal_images || [])
        .map((img: any) => {
          const variants = img?.image_metadata?.variants;
          const originalPath = img?.image_metadata?.original_path;
          return {
            displayOrder: img.display_order ?? 0,
            variants: variants,  // Keep full variants for imageVariants update
            displayUrl: variants?.large || variants?.medium || variants?.original || '',
            // Prefer the true original upload URL for fullscreen (Cloudinary secure_url stored in original_path)
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
          images = [{ displayOrder: 0, variants: variants, displayUrl, originalUrl }];
        }
      }

      // Update imageVariants with fresh data
      if (template && images.length > 0) {
        const firstImageVariants = images[0].variants;
        setDealData(prev => ({
          ...prev,
          imageVariants: firstImageVariants || prev.imageVariants,
        }));
      }

      if (images.length > 0) {
        const carouselUrls = images.map((x: any) => x.displayUrl);
        const origUrls = images.map((x: any) => x.originalUrl);
        
        // Cache the fetched images for future visits
        dealImageCache.set(dealData.id, { carouselUrls, originalUrls: origUrls });
        
        setCarouselImageUris(carouselUrls);
        setOriginalImageUris(origUrls);
        setCurrentImageIndex(0);
      }
      // Mark that we have fetched fresh images (even if empty)
      setHasFetchedFreshImages(true);
      // Always reset imageLoading after fetch completes - the image might already be cached
      // so onLoad might not fire, causing the screen to appear stuck
      setImageLoading(false);
    } catch (e) {
      console.warn('DealDetailScreen: Failed to fetch deal data:', e);
      // Even on error, mark as fetched so we can fall back to passed data
      setHasFetchedFreshImages(true);
    }
  }, [dealData.id, dealData.title]);

  // Fetch original variants for fullscreen viewing (and large variants for carousel) from Supabase
  useEffect(() => {
    fetchDealData(false); // Normal load - use cache if available
  }, [fetchDealData]);

  // Refresh deal data when returning from edit screen
  useFocusEffect(
    useCallback(() => {
      if (postAdded) {
        console.log('🔄 DealDetailScreen: Detected deal update, forcing refresh...');
        // Show loading state for refresh
        setImageLoading(true);
        fetchDealData(true); // Force refresh - ignore cache
        // NOTE: Don't reset postAdded here - let the origin screens (Feed/Profile) handle it
        // DealDetailScreen updates the store via updateDeal(dealData) which those screens can pick up
      }
    }, [postAdded, fetchDealData])
  );

  // ✨ NEW: Update context whenever deal data changes
  useEffect(() => {
    updateDeal(dealData);
  }, [dealData, updateDeal]);

  // Image loading handlers
  const handleImageLoad = (event?: any) => {
    setImageLoading(false);
    setImageError(false);
    if (event?.nativeEvent?.source) {
      const { width, height } = event.nativeEvent.source;
      setImageDimensions({ width, height });
      // Update skeleton height when actual image loads
      if (width && height) {
        const aspectRatio = height / width;
        const calculatedHeight = aspectRatio * Dimensions.get('window').width;
        setSkeletonHeight(calculatedHeight);
      }
    }
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Reset image loading state when deal changes - but use cache if available
  useEffect(() => {
    setImageError(false);
    setImageDimensions(null);
    
    // Check if we have cached images for this deal
    const cached = dealImageCache.get(dealData.id);
    if (cached) {
      // Use cached data - no need to show skeleton, images are likely in RN's image cache too
      setCarouselImageUris(cached.carouselUrls);
      setOriginalImageUris(cached.originalUrls);
      setHasFetchedFreshImages(true);
      setImageLoading(false);
    } else {
      // No cache - reset and wait for fetch
      setImageLoading(true);
      setHasFetchedFreshImages(false);
      setCarouselImageUris(null);
      setOriginalImageUris(null);
    }
  }, [dealData.id]);

  // Fetch initial view count, viewer photos, and subscribe to realtime updates
  useEffect(() => {
    // Reset loading state when deal changes
    setIsViewDataLoading(true);
    setViewCount(null);
    setViewerPhotos(null);

    const fetchViewData = async () => {
      const [count, photos] = await Promise.all([
        getDealViewCount(dealData.id),
        getDealViewerPhotos(dealData.id, 3)
      ]);
      setViewCount(count);
      setViewerPhotos(photos);
      setIsViewDataLoading(false);
    };

    fetchViewData();

    // Subscribe to realtime click interactions for this deal
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
          // Only increment for click interactions
          if (interaction.interaction_type === 'click') {
            console.log('⚡ New view detected via Realtime');
            setViewCount(prev => (prev ?? 0) + 1);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dealData.id]);

  // ❌ REMOVE ENTIRE useEffect for click logging (lines 38-45):
  // The click is already logged in Feed.tsx/CommunityUploadedScreen.tsx
  // when the user clicks the card, so we don't need to log it here again

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'Unknown') return 'Not Known';
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const removeZipCode = (address: string) => {
    // Remove zip code (5 digits or 5+4 digits) from the end of the address
    return address.replace(/,?\s*\d{5}(-\d{4})?$/, '').trim();
  };

  const handleUpvote = () => {
    const previousState = { ...dealData };
    const wasUpvoted = previousState.isUpvoted;
    const wasDownvoted = previousState.isDownvoted;

    // 1. INSTANT UI update (synchronous)
    setDealData({
      ...previousState,
      votes: wasUpvoted
        ? previousState.votes - 1
        : (wasDownvoted ? previousState.votes + 2 : previousState.votes + 1),
      isUpvoted: !wasUpvoted,
      isDownvoted: false,
    });

    // 2. Background database save (async, fire and forget)
    toggleUpvote(previousState.id).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      setDealData(previousState);
    });
  };

  const handleDownvote = () => {
    const previousState = { ...dealData };
    const wasDownvoted = previousState.isDownvoted;
    const wasUpvoted = previousState.isUpvoted;

    // 1. INSTANT UI update
    setDealData({
      ...previousState,
      votes: wasDownvoted
        ? previousState.votes + 1
        : (wasUpvoted ? previousState.votes - 2 : previousState.votes - 1),
      isDownvoted: !wasDownvoted,
      isUpvoted: false,
    });

    // 2. Background database save
    toggleDownvote(previousState.id).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      setDealData(previousState);
    });
  };

  const handleFavorite = () => {
    const previousState = { ...dealData };
    const wasFavorited = previousState.isFavorited;

    console.log('🔄 Toggling favorite for deal:', previousState.id, 'was favorited:', wasFavorited, '-> will be:', !wasFavorited);

    // 1. INSTANT UI update
    setDealData({
      ...previousState,
      isFavorited: !wasFavorited,
    });

    // 2. Notify global store immediately so FavoritesPage updates instantly
    if (wasFavorited) {
      // Unfavoriting - mark as removed
      markAsUnfavorited(previousState.id, 'deal');
    } else {
      // Favoriting - pass full deal data for instant UI in favorites page
      markAsFavorited(previousState.id, 'deal', {
        id: previousState.id,
        title: previousState.title,
        description: previousState.details || '',
        imageUrl: typeof previousState.image === 'object' ? previousState.image.uri : '',
        restaurantName: previousState.restaurant,
        restaurantAddress: previousState.restaurantAddress || '',
        distance: previousState.milesAway || '',
        userId: previousState.userId,
        userDisplayName: previousState.userDisplayName,
        userProfilePhoto: previousState.userProfilePhoto,
        isAnonymous: previousState.isAnonymous,
        favoritedAt: new Date().toISOString(),
      });
    }

    // 3. Background database save
    console.log('💾 Calling toggleFavorite with wasFavorited:', wasFavorited);
    toggleFavorite(previousState.id, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      setDealData(previousState);
    });
  };

  const handleShare = async () => {
    try {
      // Log the share interaction with source 'feed'
      logShare(dealData.id, 'feed').catch(err => {
        console.error('Failed to log share interaction:', err);
      });

      // Share the deal
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

  const handleDirections = () => {
    // Log the click-through interaction with source 'feed'
    logClickThrough(dealData.id, 'feed').catch(err => {
      console.error('Failed to log click-through interaction:', err);
    });

    // Show map selection modal
    setIsMapModalVisible(true);
  };

  const handleSelectAppleMaps = async () => {
    setIsMapModalVisible(false);
    try {
      const address = dealData.restaurantAddress || dealData.restaurant;
      const encodedAddress = encodeURIComponent(address);

      // Apple Maps URL scheme
      const appleMapsUrl = `maps://?daddr=${encodedAddress}`;
      const supported = await Linking.canOpenURL(appleMapsUrl);

      if (supported) {
        await Linking.openURL(appleMapsUrl);
      } else {
        // Fallback to Apple Maps web
        const webUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening Apple Maps:', error);
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
        // Try Google Maps app first on iOS
        url = `comgooglemaps://?daddr=${encodedAddress}`;
        const supported = await Linking.canOpenURL(url);

        if (!supported) {
          // Fallback to Google Maps web
          url = `https://maps.google.com/maps?daddr=${encodedAddress}`;
        }
      } else {
        // Android: Try Google Maps navigation first
        url = `google.navigation:q=${encodedAddress}`;
        const supported = await Linking.canOpenURL(url);

        if (!supported) {
          // Fallback to geo URI
          url = `geo:0,0?q=${encodedAddress}`;
          const geoSupported = await Linking.canOpenURL(url);

          if (!geoSupported) {
            // Final fallback to web
            url = `https://maps.google.com/maps?daddr=${encodedAddress}`;
          }
        }
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Google Maps:', error);
      Alert.alert('Error', 'Unable to open Google Maps');
    }
  };

  const handleMoreButtonPress = () => {
    setIsPopupVisible(true);
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  const handleReportContent = () => {
    setIsPopupVisible(false);
    // Implement report functionality
  };

  const handleBlockUser = () => {
    setIsPopupVisible(false);
    (navigation as any).navigate('BlockUser', { dealId: dealData.id, uploaderUserId: dealData.userId || "00000000-0000-0000-0000-000000000000" });
  };

  const handleUserPress = () => {
    // Do not navigate if the post is anonymous
    if (dealData.isAnonymous || !dealData.userId || !dealData.userDisplayName) {
      return;
    }
    (navigation as any).navigate('MainTabs', {
      screen: 'ProfilePage',
      params: {
        screen: 'ProfileMain',
        params: {
          viewUser: true,
          username: dealData.userDisplayName,
          userId: dealData.userId,
        },
      },
    });
  };


  // Get profile picture - handle anonymous posts
  const profilePicture = (dealData.isAnonymous || !dealData.userProfilePhoto)
    ? require('../../../img/Default_pfp.svg.png')
    : { uri: dealData.userProfilePhoto };

  // Get display name - handle anonymous posts
  const displayName = dealData.isAnonymous
    ? 'Anonymous'
    : (dealData.userDisplayName || 'Unknown User');

  const scrollViewRef = useRef<ScrollView>(null);

  const openImageViewer = () => {
    setModalImageLoading(true);
    setModalImageError(false);
    setImageViewVisible(true);
    // Force ScrollView to re-render with fresh state
    setImageViewerKey(prev => prev + 1);
  };

  // Best-effort: if an image URL/path points at a resized variant, try to swap to the original variant.
  // This lets fullscreen view show the "full" image even if the carousel uses a cropped/cover rendering.
  const toOriginalVariantUri = (uri: string): string => {
    if (!uri || typeof uri !== 'string') return uri;
    // Cloudinary URLs may contain transformations; don't attempt to rewrite
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

  // Only use dealData.images as fallback AFTER we've attempted to fetch fresh data
  // This prevents showing stale/deleted image URLs from the cache
  const imagesForCarousel = carouselImageUris && carouselImageUris.length > 0
    ? carouselImageUris
    : (hasFetchedFreshImages && dealData.images && dealData.images.length > 0 ? dealData.images : null);

  const fullScreenImageSource =
    (originalImageUris && originalImageUris[currentImageIndex]) ||
    (imagesForCarousel && imagesForCarousel[currentImageIndex] ? toOriginalVariantUri(imagesForCarousel[currentImageIndex]) : null) ||
    dealData.imageVariants?.original ||
    dealData.imageVariants?.large ||
    (typeof dealData.image === 'string' ? toOriginalVariantUri(dealData.image) : dealData.image);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#404040" />
        </TouchableOpacity>

        <View style={styles.rightHeaderContainer}>
          <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
            <Text style={styles.directionsText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={handleMoreButtonPress}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#404040" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Restaurant Header */}
        <View style={styles.restaurantSection}>
          {/* Restaurant name with view count positioned absolutely */}
          <View style={styles.restaurantHeaderContainer}>
            <Text style={styles.restaurantName}>{dealData.restaurant}</Text>
            <View style={styles.viewCountContainer}>
              {isViewDataLoading ? (
                // Skeleton for view count while loading
                <View style={styles.viewCountSkeletonContainer}>
                  <SkeletonLoader width={60} height={12} borderRadius={4} />
                  <View style={styles.avatarSkeletonGroup}>
                    <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginLeft: 6 }} />
                    <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginLeft: -8 }} />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.viewCount}>{viewCount ?? 0} viewed</Text>
                  {viewerPhotos && viewerPhotos.length > 0 && (
                    <View style={styles.avatarGroup}>
                      {viewerPhotos.map((photoUrl, index) => (
                        <Image
                          key={index}
                          source={{ uri: photoUrl }}
                          style={[
                            styles.viewerAvatar,
                            { zIndex: viewerPhotos.length - index, marginLeft: index > 0 ? -8 : 0 }
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Full width info rows below */}
          <View style={styles.restaurantInfo}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#FF8C4C" style={styles.locationIcon} />
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                <Text style={styles.infoRegular}>{dealData.milesAway} away </Text>
                <Text style={styles.infoBullet}>• </Text>
                <Text style={styles.infoRegular}>{removeZipCode(dealData.restaurantAddress || '14748 Beach Blvd, La Mirada, CA')}</Text>
              </Text>
            </View>
            <View style={styles.validUntilRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#555555" style={styles.clockIcon} />
              <Text style={styles.validUntilText}>Valid Until • {formatDate(dealData.expirationDate || null)}</Text>
            </View>
            {/* Only show category row if cuisine or deal type exists and has meaningful content */}
            {((dealData.cuisine && dealData.cuisine.trim() !== '' && dealData.cuisine !== 'Cuisine') ||
              (dealData.dealType && dealData.dealType.trim() !== '')) && (
                <View style={styles.categoryRow}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color="#555555" style={styles.tagIcon} />
                  <Text style={styles.categoryText}>
                    {dealData.cuisine && dealData.cuisine.trim() !== '' && dealData.cuisine !== 'Cuisine' && (
                      <Text style={styles.infoRegular}>{dealData.cuisine}</Text>
                    )}
                    {dealData.cuisine && dealData.cuisine.trim() !== '' && dealData.cuisine !== 'Cuisine' &&
                      dealData.dealType && dealData.dealType.trim() !== '' && (
                        <Text style={styles.infoBullet}> • </Text>
                      )}
                    {dealData.dealType && dealData.dealType.trim() !== '' && (
                      <Text style={styles.infoRegular}>{dealData.dealType}</Text>
                    )}
                  </Text>
                </View>
              )}
          </View>
        </View>

        {/* Separator after restaurant section */}
        <View style={styles.separator} />

        {/* Deal Title */}
        <Text style={styles.dealTitle}>
          {dealData.title}
        </Text>

        {/* Deal Images Carousel */}
        {imagesForCarousel && imagesForCarousel.length > 0 ? (
          <View style={styles.imageContainer}>
            <View style={[
              styles.imageWrapper,
              imageLoading && { minHeight: Math.max(skeletonHeight, 200), borderWidth: 0 }
            ]}>
              {imageLoading && (
                <View style={styles.imageLoadingContainer}>
                  <SkeletonLoader
                    width="100%"
                    height={Math.max(skeletonHeight, 200)}
                    borderRadius={10}
                  />
                </View>
              )}
              <FlatList
                ref={carouselRef}
                data={imagesForCarousel}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                pagingEnabled
                scrollEnabled={imagesForCarousel.length > 1}
                decelerationRate="fast"
                onScroll={(event) => {
                  const contentWidth = screenWidth - 48;
                  const index = Math.round(event.nativeEvent.contentOffset.x / contentWidth);
                  if (index !== currentImageIndex && index >= 0 && index < imagesForCarousel.length) {
                    setCurrentImageIndex(index);
                  }
                }}
                scrollEventThrottle={16}
                keyExtractor={(item, index) => `detail-image-${index}`}
                getItemLayout={(_, index) => ({
                  length: screenWidth - 48,
                  offset: (screenWidth - 48) * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentImageIndex(index);
                      openImageViewer();
                    }}
                    style={{ width: screenWidth - 48 }}
                  >
                    <Image
                      source={{ uri: item }}
                      style={[
                        styles.dealImage,
                        { width: screenWidth - 48 },
                        imageDimensions && {
                          height: (imageDimensions.height / imageDimensions.width) * 350
                        },
                        !imageDimensions && { height: 350 },
                        imageLoading && { opacity: 0 }
                      ]}
                      resizeMode="cover"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
            {/* Pagination Dots - Outside imageWrapper so border ends with image */}
            {imagesForCarousel.length > 1 && (
              <View style={styles.paginationContainer}>
                {imagesForCarousel.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.paginationDot,
                      currentImageIndex === index && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : !hasFetchedFreshImages ? (
          // Show skeleton while waiting for fresh image data from server
          <View style={styles.imageContainer}>
            <View style={[styles.imageWrapper, { minHeight: Math.max(skeletonHeight, 200), borderWidth: 0 }]}>
              <View style={styles.imageLoadingContainer}>
                <SkeletonLoader
                  width="100%"
                  height={Math.max(skeletonHeight, 200)}
                  borderRadius={10}
                />
              </View>
            </View>
          </View>
        ) : (
          // Fallback to single image display for deals without multiple images
          <TouchableOpacity onPress={openImageViewer} disabled={imageLoading}>
            <View style={styles.imageContainer}>
              <View style={[
                styles.imageWrapper,
                imageLoading && { minHeight: Math.max(skeletonHeight, 200), borderWidth: 0 }
              ]}>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <SkeletonLoader
                      width="100%"
                      height={Math.max(skeletonHeight, 200)}
                      borderRadius={10}
                    />
                  </View>
                )}

                {!imageError && (dealData.imageVariants ? (
                  <OptimizedImage
                    variants={dealData.imageVariants}
                    componentType="deal"
                    displaySize={{ width: 300, height: 300 }}
                    fallbackSource={typeof dealData.image === 'string'
                      ? { uri: dealData.image }
                      : dealData.image
                    }
                    style={[
                      styles.dealImage,
                      imageDimensions && {
                        height: (imageDimensions.height / imageDimensions.width) * 350
                      },
                      imageLoading && { opacity: 0 }
                    ]}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={typeof dealData.image === 'string'
                      ? { uri: dealData.image }
                      : dealData.image
                    }
                    style={[
                      styles.dealImage,
                      imageDimensions && {
                        height: (imageDimensions.height / imageDimensions.width) * 350
                      },
                      imageLoading && { opacity: 0 }
                    ]}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    resizeMode="cover"
                  />
                ))}

                {imageError && (
                  <View style={styles.imageErrorContainer}>
                    <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
                    <Text style={styles.imageErrorText}>Failed to load image</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <VoteButtons
            votes={dealData.votes}
            isUpvoted={dealData.isUpvoted}
            isDownvoted={dealData.isDownvoted}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
          />

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFavorite}
              activeOpacity={0.6}
            >
              <Monicon
                name={dealData.isFavorited ? "mdi:heart" : "mdi:heart-outline"}
                size={19}
                color={dealData.isFavorited ? "#FF1E00" : "#000"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Monicon name="mdi-light:share" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Only show Details section if details exist */}
        {dealData.details && dealData.details.trim() !== '' && (
          <>
            {/* Separator after image/actions */}
            <View style={styles.separator} />

            {/* Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Details</Text>
              <Text style={styles.detailsText}>{dealData.details}</Text>
            </View>
          </>
        )}

        {/* Separator before shared by section */}
        <View style={styles.separator} />

        {/* Shared By Section */}
        <View>
          <TouchableOpacity
            style={styles.sharedByContainer}
            onPress={handleUserPress}
            activeOpacity={dealData.isAnonymous ? 1 : 0.7} // No feedback for anonymous
            disabled={dealData.isAnonymous} // Disable press for anonymous
          >
            <Image
              source={profilePicture}
              style={styles.profilePicture}
            />
            <View style={styles.userInfo}>
              <Text style={styles.sharedByLabel}>Shared By</Text>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userLocation}>{dealData.userCity || 'Unknown'}, {dealData.userState || 'CA'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* 3-Dot Popup Modal */}
      <ThreeDotPopup
        visible={isPopupVisible}
        onClose={handleClosePopup}
        onReportContent={handleReportContent}
        onBlockUser={handleBlockUser}
        dealId={dealData.id}
        uploaderUserId={dealData.userId || "00000000-0000-0000-0000-000000000000"}
        currentUserId={currentUserId || undefined}
      />

      {
        fullScreenImageSource && (
          <Modal
            visible={isImageViewVisible}
            transparent={true}
            onRequestClose={() => setImageViewVisible(false)}
          >
            <View style={styles.imageViewerContainer}>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={() => setImageViewVisible(false)}
              >
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
              {modalImageLoading && (
                <ActivityIndicator size="large" color="#FFFFFF" style={styles.modalImageLoader} />
              )}
              <ScrollView
                key={imageViewerKey}
                ref={scrollViewRef}
                style={styles.imageViewerScrollView}
                contentContainerStyle={styles.scrollViewContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                bouncesZoom={true}
                centerContent={true}
              >
                <Image
                  source={typeof fullScreenImageSource === 'string' ? { uri: fullScreenImageSource } : fullScreenImageSource}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                  onLoad={() => setModalImageLoading(false)}
                  onError={() => {
                    setModalImageLoading(false);
                    setModalImageError(true);
                  }}
                />
              </ScrollView>
              {modalImageError && (
                <View style={styles.modalErrorContainer}>
                  <Text style={styles.modalErrorText}>Could not load image</Text>
                </View>
              )}
            </View>
          </Modal>
        )
      }

      {/* Map Selection Modal */}
      <MapSelectionModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        onSelectAppleMaps={handleSelectAppleMaps}
        onSelectGoogleMaps={handleSelectGoogleMaps}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  rightHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsButton: {
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  directionsText: {
    color: '#000000',
    fontWeight: '400',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 15,
    textAlign: 'center',
  },
  moreButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  restaurantSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8, // Reduced from 16 to bring separator closer
  },
  restaurantHeaderContainer: {
    position: 'relative',
    marginBottom: 2, // Small space between restaurant name and details
    minHeight: 20, // Ensures space for the restaurant name
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
    lineHeight: 20,
    paddingRight: 80, // Leave space for view count on the right
    marginBottom: 0,
  },
  restaurantInfo: {
    width: '100%',
    marginTop: 0, // No extra space - starts right after restaurant name
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 4,
  },
  clockIcon: {
    marginRight: 4,
  },
  tagIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    lineHeight: 20,
    flex: 1,
  },
  validUntilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validUntilText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    color: '#000000',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    lineHeight: 20,
  },
  infoRegular: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
  },
  infoBullet: {
    fontFamily: 'Inter-Light',
    fontSize: 12,
    fontWeight: '300',
    color: '#000000',
  },
  viewCountContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCountSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeletonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCount: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Inter',
    marginRight: 6,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 24,
    marginVertical: 8, // Reduced from 12 for tighter spacing
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  imageContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#AAAAAA',
  },
  dealImage: {
    width: '100%',
    borderRadius: 10,
    alignSelf: 'center',
  },
  imageLoading: {
    opacity: 0,
  },
  imageError: {
    opacity: 0.3,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    zIndex: 1,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    zIndex: 1,
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontFamily: 'Inter',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F4F4',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
    height: 28,
    width: 85,
  },
  voteButton: {
    backgroundColor: 'transparent',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  upvoted: {
    // No background change - only icon color changes
  },
  downvoted: {
    // No background change - only icon color changes
  },
  voteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginHorizontal: 6,
  },
  voteSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 6,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    paddingHorizontal: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  detailsText: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 18,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  sharedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  profilePicture: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  userInfo: {
    flex: 1,
  },
  sharedByLabel: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  userLocation: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  imageViewerScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
  },
  modalImageLoader: {
    position: 'absolute',
  },
  modalErrorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalErrorText: {
    color: 'white',
    fontSize: 16,
  },
  // Pagination styles for image carousel
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D1',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFA05C',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default DealDetailScreen;