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

type DealDetailRouteProp = RouteProp<{ DealDetail: { deal: Deal } }, 'DealDetail'>;

const DealDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DealDetailRouteProp>();
  const { deal } = route.params;

  // Local state for deal interactions
  const [dealData, setDealData] = useState<Deal>(deal);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUpvote = () => {
    setDealData(prev => ({
      ...prev,
      votes: prev.isUpvoted ? prev.votes - 1 : prev.votes + (prev.isDownvoted ? 2 : 1),
      isUpvoted: !prev.isUpvoted,
      isDownvoted: false,
    }));
  };

  const handleDownvote = () => {
    setDealData(prev => ({
      ...prev,
      votes: prev.isDownvoted ? prev.votes + 1 : prev.votes - (prev.isUpvoted ? 2 : 1),
      isDownvoted: !prev.isDownvoted,
      isUpvoted: false,
    }));
  };

  const handleFavorite = () => {
    setDealData(prev => ({
      ...prev,
      isFavorited: !prev.isFavorited,
    }));
  };

  const handleShare = () => {
    console.log('Share deal:', dealData.id);
    // Implement share functionality
  };

  const handleDirections = () => {
    console.log('Get directions to:', dealData.restaurant);
    // Implement directions functionality
  };

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
          <TouchableOpacity style={styles.moreButton}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#404040" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Restaurant Header */}
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{dealData.restaurant}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#FF8C4C" />
              <Text style={styles.locationText}>3mi away • 14748 Beach Blvd, La Mirada, CA 90638</Text>
            </View>
            <View style={styles.validUntilRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#555555" />
              <Text style={styles.validUntilText}>Valid Until: September 20th, 2025</Text>
            </View>
            <View style={styles.categoryRow}>
              <MaterialCommunityIcons name="tag-outline" size={12} color="#555555" />
              <Text style={styles.categoryText}>Asian • BOGO</Text>
            </View>
          </View>
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

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Details</Text>
          <Text style={styles.detailsText}>
            Buy any Sea Salt Coffee and get the second one free. Available at participating Boba Ya! locations. Offer valid for members only.
          </Text>
        </View>

        {/* Shared By Section */}
        <View style={styles.sharedByContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/50x50/ff8c4c/ffffff?text=KH' }} 
            style={styles.profilePicture} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.sharedByLabel}>Shared By</Text>
            <Text style={styles.userName}>Kevin Hu</Text>
            <Text style={styles.userLocation}>Fullerton, California</Text>
          </View>
        </View>
      </ScrollView>
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
    gap: 8,
  },
  directionsButton: {
    backgroundColor: '#FF8C4C',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  directionsText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  moreButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  restaurantSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  validUntilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validUntilText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  viewCountContainer: {
    alignItems: 'flex-end',
  },
  viewCount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
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
  dealTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  imageContainer: {
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    marginBottom: 24,
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
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  sharedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 12,
    color: '#666666',
  },
});

export default DealDetailScreen;
