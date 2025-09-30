import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Deal } from '../../components/DealCard';
import ThreeDotPopup from '../../components/ThreeDotPopup';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../services/voteService';

type DealDetailRouteProp = RouteProp<{ DealDetail: { deal: Deal } }, 'DealDetail'>;

const DealDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DealDetailRouteProp>();
  const { deal } = route.params;


  // Local state for deal interactions
  const [dealData, setDealData] = useState<Deal>(deal);
  const [isPopupVisible, setIsPopupVisible] = useState(false);


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
    
    // 1. INSTANT UI update
    setDealData({
      ...previousState,
      isFavorited: !wasFavorited,
    });

    // 2. Background database save
    toggleFavorite(previousState.id, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      setDealData(previousState);
    });
  };

  const handleShare = () => {
    // Implement share functionality
  };

  const handleDirections = () => {
    // Implement directions functionality
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
              <Text style={styles.viewCount}>{dealData.votes} viewed</Text>
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
          <Image 
            source={typeof dealData.image === 'string' 
              ? { uri: dealData.image } 
              : dealData.image
            } 
            style={styles.dealImage} 
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.voteContainer}>
            <TouchableOpacity 
              style={[styles.voteButton, dealData.isUpvoted && styles.upvoted]}
              onPress={handleUpvote}
            >
              <MaterialCommunityIcons 
                name="arrow-up" 
                size={16} 
                color={dealData.isUpvoted ? "#FFF" : "#000"} 
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{dealData.votes}</Text>
            <TouchableOpacity 
              style={[styles.voteButton, dealData.isDownvoted && styles.downvoted]}
              onPress={handleDownvote}
            >
              <MaterialCommunityIcons 
                name="arrow-down" 
                size={16} 
                color={dealData.isDownvoted ? "#FFF" : "#000"} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={[styles.actionButton, dealData.isFavorited && styles.favorited]}
              onPress={handleFavorite}
            >
              <MaterialCommunityIcons 
                name={dealData.isFavorited ? "heart" : "heart-outline"} 
                size={20} 
                color={dealData.isFavorited ? "#FF8C4C" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <MaterialCommunityIcons name="share-outline" size={20} color="#000" />
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
        <View style={styles.sharedByContainer}>
          <Image 
            source={profilePicture} 
            style={styles.profilePicture} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.sharedByLabel}>Shared By</Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userLocation}>Fullerton, California</Text>
          </View>
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
    height: 1,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 24,
    marginVertical: 16,
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
  dealImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
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
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voteButton: {
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvoted: {
    backgroundColor: '#FF8C4C',
  },
  downvoted: {
    backgroundColor: '#9796FF',
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 12,
    fontFamily: 'Inter',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favorited: {
    backgroundColor: '#FF8C4C',
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
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  sharedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  sharedByLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  userLocation: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
});

export default DealDetailScreen;
