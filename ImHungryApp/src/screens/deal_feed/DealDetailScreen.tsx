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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Deal } from '../../components/DealCard';
import ThreeDotPopup from '../../components/ThreeDotPopup';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../services/voteService';
import { useDealUpdate } from '../../context/DealUpdateContext';
import { getDealViewCount, logShare, logClickThrough } from '../../services/interactionService';
import SkeletonLoader from '../../components/SkeletonLoader';
import OptimizedImage from '../../components/OptimizedImage';
import { supabase } from '../../../lib/supabase';

type DealDetailRouteProp = RouteProp<{ DealDetail: { deal: Deal } }, 'DealDetail'>;

const DealDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DealDetailRouteProp>();
  const { deal } = route.params;
  const { updateDeal } = useDealUpdate();

  // Local state for deal interactions
  const [dealData, setDealData] = useState<Deal>(deal);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [viewCount, setViewCount] = useState<number>(0);
  
  // Loading states
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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

  // ✨ NEW: Update context whenever deal data changes
  useEffect(() => {
    updateDeal(dealData);
  }, [dealData, updateDeal]);

  // Image loading handlers
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Reset image loading state when deal changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [dealData.id]);

  // Fetch initial view count and subscribe to realtime updates
  useEffect(() => {
    const fetchViewCount = async () => {
      const count = await getDealViewCount(dealData.id);
      setViewCount(count);
    };

    fetchViewCount();

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
            setViewCount(prev => prev + 1);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

    // 2. Background database save
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

  const handleDirections = async () => {
    try {
      // Log the click-through interaction with source 'feed'
      logClickThrough(dealData.id, 'feed').catch(err => {
        console.error('Failed to log click-through interaction:', err);
      });

      const address = dealData.restaurantAddress || dealData.restaurant;
      const encodedAddress = encodeURIComponent(address);
      
      // Try to open platform-specific map apps
      const url = Platform.OS === 'ios' 
        ? `maps://maps.google.com/maps?daddr=${encodedAddress}`
        : `geo:0,0?q=${encodedAddress}`;
      
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web maps
        const webUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to open directions');
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
    if (dealData.userId && dealData.userDisplayName) {
      (navigation as any).navigate('ProfilePage', { 
        viewUser: true, 
        username: dealData.userDisplayName,
        userId: dealData.userId 
      });
    }
  };


  // Get profile picture - use actual data or fallback to default
  const profilePicture = dealData.userProfilePhoto 
    ? { uri: dealData.userProfilePhoto }
    : require('../../../img/Default_pfp.svg.png');

  // Get display name - handle anonymous posts
  const displayName = dealData.isAnonymous 
    ? 'Anonymous' 
    : (dealData.userDisplayName || 'Unknown User');

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
          {/* Top row with restaurant name and view count side by side */}
          <View style={styles.restaurantTopRow}>
            <Text style={styles.restaurantName}>{dealData.restaurant}</Text>
            <View style={styles.viewCountContainer}>
              <Text style={styles.viewCount}>{viewCount} viewed</Text>
              <View style={styles.avatarGroup}>
                {/* Mock viewer avatars */}
                <Image 
                  source={{ uri: 'https://via.placeholder.com/20x20/ff8c4c/ffffff?text=A' }} 
                  style={[styles.viewerAvatar, { zIndex: 3 }]} 
                />
                <Image 
                  source={{ uri: 'https://via.placeholder.com/20x20/4CAF50/ffffff?text=B' }} 
                  style={[styles.viewerAvatar, { zIndex: 2, marginLeft: -8 }]} 
                />
                <Image 
                  source={{ uri: 'https://via.placeholder.com/20x20/2196F3/ffffff?text=C' }} 
                  style={[styles.viewerAvatar, { zIndex: 1, marginLeft: -8 }]} 
                />
              </View>
            </View>
          </View>

          {/* Full width info rows below */}
          <View style={styles.restaurantInfo}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#FF8C4C" style={styles.locationIcon} />
              <Text style={styles.locationText}>
                <Text style={styles.infoRegular}>{dealData.milesAway} away </Text>
                <Text style={styles.infoBullet}>• </Text>
                <Text style={styles.infoRegular}>{dealData.restaurantAddress || '14748 Beach Blvd, La Mirada, CA 90638'}</Text>
              </Text>
            </View>
            <View style={styles.validUntilRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#555555" style={styles.clockIcon} />
              <Text style={styles.validUntilText}>Valid Until: September 20th, 2025</Text>
            </View>
            <View style={styles.categoryRow}>
              <MaterialCommunityIcons name="tag-outline" size={12} color="#555555" style={styles.tagIcon} />
              <Text style={styles.categoryText}>
                <Text style={styles.infoRegular}>{dealData.cuisine || 'Asian'} </Text>
                <Text style={styles.infoBullet}>• </Text>
                <Text style={styles.infoRegular}>BOGO</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Separator after restaurant section */}
        <View style={styles.separator} />

        {/* Deal Title */}
        <Text style={styles.dealTitle}>{dealData.title}</Text>

        {/* Deal Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <SkeletonLoader width="100%" height={300} borderRadius={10} />
              </View>
            )}
            
            {dealData.imageVariants ? (
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
                  imageLoading && styles.imageLoading,
                  imageError && styles.imageError
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
                  imageLoading && styles.imageLoading,
                  imageError && styles.imageError
                ]}
                onLoad={handleImageLoad}
                onError={handleImageError}
                resizeMode="cover"
                fadeDuration={200}
              />
            )}
            
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
                <Text style={styles.imageErrorText}>Failed to load image</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.voteContainer}>
            <TouchableOpacity 
              style={[styles.voteButton, dealData.isUpvoted && styles.upvoted]}
              onPress={handleUpvote}
            >
              <MaterialCommunityIcons 
                name={dealData.isUpvoted ? "arrow-up-bold" : "arrow-up-bold-outline"}
                size={dealData.isUpvoted ? 23 : 17} 
                color={dealData.isUpvoted ? "#FF8C4C" : "#000"} 
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{dealData.votes}</Text>
            {/* Vertical separator line */}
            <View style={styles.voteSeparator} />
            <TouchableOpacity 
              style={[styles.voteButton, dealData.isDownvoted && styles.downvoted]}
              onPress={handleDownvote}
            >
              <MaterialCommunityIcons 
                name={dealData.isDownvoted ? "arrow-down-bold" : "arrow-down-bold-outline"}
                size={dealData.isDownvoted ? 22 : 17} 
                color={dealData.isDownvoted ? "#9796FF" : "#000"} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleFavorite}
            >
              <MaterialCommunityIcons 
                name={dealData.isFavorited ? "heart" : "heart-outline"} 
                size={19} 
                color={dealData.isFavorited ? "#FF1E00" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <MaterialCommunityIcons name="share-outline" size={19} color="#000" />
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
        <TouchableOpacity 
          style={styles.sharedByContainer}
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          <Image 
            source={profilePicture} 
            style={styles.profilePicture} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.sharedByLabel}>Shared By</Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userLocation}>Fullerton, California</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      {/* 3-Dot Popup Modal */}
      <ThreeDotPopup
        visible={isPopupVisible}
        onClose={handleClosePopup}
        onReportContent={handleReportContent}
        onBlockUser={handleBlockUser}
        dealId={dealData.id}
        uploaderUserId={dealData.userId || "00000000-0000-0000-0000-000000000000"}
      />
    </SafeAreaView>
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
    paddingBottom: 16,
  },
  restaurantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
    lineHeight: 20,
    flex: 1,
    marginBottom: 0,
  },
  restaurantInfo: {
    width: '100%',
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
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  viewCount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'Inter',
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
    marginVertical: 12,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    paddingHorizontal: 24,
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
    height: 300,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#AAAAAA',
  },
  dealImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
    height: 28,
  },
  voteButton: {
    backgroundColor: 'transparent',
    width: 20,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvoted: {
    // No background change - only icon color changes
    marginBottom: 1,
  },
  downvoted: {
    // No background change - only icon color changes
    marginBottom: 1,
  },
  voteCount: {
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginHorizontal: 6,
    fontFamily: 'Inter',
  },
  voteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D8D8D8',
    marginHorizontal: 4,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D8',
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
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    borderRadius: 8,
    marginHorizontal: 0,
    backgroundColor: 'transparent',
  },
  profilePicture: {
    width: 50.25,
    height: 50.25,
    borderRadius: 25.125,
    marginRight: 8,
  },
  userInfo: {
    flex: 1,
  },
  sharedByLabel: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 0,
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 0,
    fontFamily: 'Inter',
    letterSpacing: 0.24,
  },
  userLocation: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

export default DealDetailScreen;
