import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { Deal } from '#/components/cards/DealCard';
import ThreeDotPopup from '#/components/ThreeDotPopup';
import VoteButtons from '#/components/VoteButtons';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '#/services/voteService';
import { useDealUpdate } from '../hooks/useDealUpdate';
import { getDealViewCount, getDealViewerPhotos, logShare, logClickThrough } from '#/services/interactionService';
import { useFavorites } from '#/features/profile/hooks/useFavorites';
import SkeletonLoader from '#/components/SkeletonLoader';
import { OptimizedImage } from '#/components/Image';
import MapSelectionModal from '#/components/MapSelectionModal';
import { supabase } from '#/../lib/supabase';
import { tokens, atoms as a } from '#/ui';

type DealDetailRouteProp = RouteProp<{ DealDetail: { deal: Deal } }, 'DealDetail'>;

const DealDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DealDetailRouteProp>();
  const { deal } = route.params;
  const { updateDeal } = useDealUpdate();
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
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [imageViewerKey, setImageViewerKey] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  
  // Loading states
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
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

  // Reset image loading state when deal changes
  useEffect(() => {
    console.log('🔄 Resetting image loading state for deal:', dealData.id);
    setImageLoading(true);
    setImageError(false);
    // Reset dimensions so skeleton shows properly
    setImageDimensions(null);
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
    ? require('../../../../img/Default_pfp.svg.png')
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

  const fullScreenImageSource = dealData.imageVariants?.original || dealData.imageVariants?.large || dealData.image;

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

        {/* Deal Image */}
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
                    height={Math.max(skeletonHeight, 200)} // Ensure minimum height of 200
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

      {fullScreenImageSource && (
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
      )}

      {/* Map Selection Modal */}
      <MapSelectionModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        onSelectAppleMaps={handleSelectAppleMaps}
        onSelectGoogleMaps={handleSelectGoogleMaps}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.items_center,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    ...a.bg_white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: tokens.space.xs,
  },
  rightHeaderContainer: {
    ...a.flex_row,
    ...a.items_center,
    gap: tokens.space.xs,
  },
  directionsButton: {
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    ...a.rounded_full,
    paddingHorizontal: tokens.space._2xl,
    paddingVertical: tokens.space.sm,
  },
  directionsText: {
    ...a.text_black,
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.sm,
    fontFamily: 'Inter-Regular',
    lineHeight: 15,
    ...a.text_center,
  },
  moreButton: {
    padding: tokens.space.xs,
  },
  scrollView: {
    ...a.flex_1,
  },
  restaurantSection: {
    paddingHorizontal: tokens.space._2xl,
    paddingTop: tokens.space.lg,
    paddingBottom: tokens.space.sm,
  },
  restaurantHeaderContainer: {
    ...a.relative,
    marginBottom: 2,
    minHeight: 20,
  },
  restaurantName: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    fontFamily: 'Inter',
    lineHeight: 20,
    paddingRight: 80,
    marginBottom: 0,
  },
  restaurantInfo: {
    ...a.w_full,
    marginTop: 0,
  },
  locationRow: {
    ...a.flex_row,
    ...a.items_center,
    marginBottom: tokens.space.xs,
  },
  locationIcon: {
    marginRight: tokens.space.xs,
  },
  clockIcon: {
    marginRight: tokens.space.xs,
  },
  tagIcon: {
    marginRight: tokens.space.xs,
  },
  locationText: {
    fontSize: tokens.fontSize.xs,
    lineHeight: 20,
    ...a.flex_1,
  },
  validUntilRow: {
    ...a.flex_row,
    ...a.items_center,
    marginBottom: tokens.space.xs,
  },
  validUntilText: {
    fontFamily: 'Inter-Regular',
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.normal,
    lineHeight: 20,
    ...a.text_black,
  },
  categoryRow: {
    ...a.flex_row,
    ...a.items_center,
  },
  categoryText: {
    fontSize: tokens.fontSize.xs,
    lineHeight: 20,
  },
  infoRegular: {
    fontFamily: 'Inter-Regular',
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_black,
  },
  infoBullet: {
    fontFamily: 'Inter-Light',
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.light,
    ...a.text_black,
  },
  viewCountContainer: {
    ...a.absolute,
    top: 0,
    right: 0,
    ...a.flex_row,
    ...a.items_center,
  },
  viewCountSkeletonContainer: {
    ...a.flex_row,
    ...a.items_center,
  },
  avatarSkeletonGroup: {
    ...a.flex_row,
    ...a.items_center,
  },
  viewCount: {
    fontSize: tokens.fontSize.xs,
    ...a.text_black,
    fontFamily: 'Inter',
    marginRight: 6,
  },
  avatarGroup: {
    ...a.flex_row,
    ...a.items_center,
  },
  viewerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    ...a.border_white,
  },
  separator: {
    height: 0.5,
    ...a.bg_gray_200,
    marginHorizontal: tokens.space._2xl,
    marginVertical: tokens.space.sm,
  },
  dealTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    paddingHorizontal: tokens.space._2xl,
    marginTop: tokens.space.sm,
    marginBottom: tokens.space.lg,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  imageContainer: {
    paddingHorizontal: tokens.space._2xl,
    marginBottom: tokens.space.lg,
  },
  imageWrapper: {
    ...a.relative,
    ...a.w_full,
    ...a.rounded_sm,
    backgroundColor: '#F0F0F0',
    ...a.overflow_hidden,
    borderWidth: 0.5,
    borderColor: '#AAAAAA',
  },
  dealImage: {
    ...a.w_full,
    ...a.rounded_sm,
    alignSelf: 'center',
  },
  imageLoading: {
    opacity: 0,
  },
  imageError: {
    opacity: 0.3,
  },
  imageLoadingContainer: {
    ...a.absolute,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F8F8',
    ...a.rounded_sm,
    zIndex: 1,
  },
  imageErrorContainer: {
    ...a.absolute,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...a.justify_center,
    ...a.items_center,
    backgroundColor: '#F8F8F8',
    ...a.rounded_sm,
    zIndex: 1,
  },
  imageErrorText: {
    marginTop: tokens.space.sm,
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_400,
    fontFamily: 'Inter',
  },
  actionButtonsContainer: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.items_center,
    paddingHorizontal: tokens.space._2xl,
    marginBottom: tokens.space.sm,
  },
  voteContainer: {
    ...a.flex_row,
    ...a.items_center,
    ...a.justify_between,
    backgroundColor: '#F7F4F4',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    ...a.rounded_full,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 2,
    height: 28,
    width: 85,
  },
  voteButton: {
    ...a.bg_transparent,
    width: 20,
    height: 20,
    ...a.justify_center,
    ...a.items_center,
    ...a.rounded_xs,
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
    fontWeight: tokens.fontWeight.normal,
    ...a.text_black,
    marginHorizontal: 6,
  },
  voteSeparator: {
    width: 1,
    height: 12,
    ...a.bg_gray_200,
    marginHorizontal: 6,
  },
  rightActions: {
    ...a.flex_row,
    gap: tokens.space.xs,
  },
  actionButton: {
    ...a.bg_white,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    ...a.rounded_full,
    width: 40,
    height: 28,
    ...a.justify_center,
    ...a.items_center,
  },
  detailsSection: {
    paddingHorizontal: tokens.space._2xl,
  },
  detailsTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  detailsText: {
    fontSize: tokens.fontSize.xs,
    ...a.text_black,
    lineHeight: 18,
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
  },
  sharedByContainer: {
    ...a.flex_row,
    ...a.items_center,
    paddingVertical: tokens.space.lg,
    paddingHorizontal: tokens.space._2xl,
    gap: tokens.space.sm,
  },
  profilePicture: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  userInfo: {
    ...a.flex_1,
  },
  sharedByLabel: {
    fontSize: 10,
    ...a.text_black,
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  userName: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    fontFamily: 'Inter',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  userLocation: {
    fontSize: 10,
    ...a.text_black,
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  imageViewerContainer: {
    ...a.flex_1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    ...a.justify_center,
    ...a.items_center,
  },
  imageViewerCloseButton: {
    ...a.absolute,
    top: 60,
    right: 20,
    zIndex: 1,
  },
  imageViewerScrollView: {
    ...a.flex_1,
    ...a.w_full,
  },
  scrollViewContent: {
    flexGrow: 1,
    ...a.justify_center,
    ...a.items_center,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
  },
  modalImageLoader: {
    ...a.absolute,
  },
  modalErrorContainer: {
    ...a.absolute,
    ...a.justify_center,
    ...a.items_center,
  },
  modalErrorText: {
    ...a.text_white,
    fontSize: tokens.fontSize.md,
  },
});

export default DealDetailScreen;