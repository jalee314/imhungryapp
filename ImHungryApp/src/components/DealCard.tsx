import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // CHANGED: Back to original

export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  timeAgo: string;
  author?: string;
  milesAway?: string;
  uploaderUserId?: string; // Add this field
}

interface DealCardProps {
  deal: Deal;
  variant?: 'community' | 'standard';
  onUpvote?: (dealId: string) => void;
  onDownvote?: (dealId: string) => void;
  onFavorite?: (dealId: string) => void;
  onPress?: (dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  variant = 'standard',
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
}) => {
  const isCommunity = variant === 'community';

  const handleUpvote = () => {
    onUpvote?.(deal.id);
  };

  const handleDownvote = () => {
    onDownvote?.(deal.id);
  };

  const handleFavorite = () => {
    onFavorite?.(deal.id);
  };

  const handlePress = () => {
    onPress?.(deal.id);
  };

  const renderContent = () => {
    const locationAuthorText = `${deal.milesAway || '?mi'} away • ${deal.timeAgo} • ${deal.author || 'Unknown'}`;
    
    const imageSource = typeof deal.image === 'string' 
      ? { uri: deal.image } 
      : deal.image;
    
    return (
      <>
        <Image source={imageSource} style={styles.dealImage} />
        <View style={styles.textContainer}>
          <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
          <Text style={styles.restaurantName} numberOfLines={1}>{deal.restaurant}</Text>
          <Text style={styles.locationAuthor} numberOfLines={1}>{locationAuthorText}</Text>
        </View>
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCommunity ? styles.communityCard : styles.standardCard
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {renderContent()}
      
      <View style={styles.cardInteractions}>
        <View style={styles.voteContainer}>
          <TouchableOpacity 
            style={[styles.voteButton, deal.isUpvoted && styles.upvoted]}
            onPress={handleUpvote}
          >
            <MaterialCommunityIcons  // CHANGED: Back to original
              name="arrow-up"  // CHANGED: Back to original
              size={12} 
              color={deal.isUpvoted ? "#FFF" : "#000"} 
            />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{deal.votes}</Text>
          <View style={styles.voteSeparator} />
          <TouchableOpacity 
            style={[styles.voteButton, deal.isDownvoted && styles.downvoted]}
            onPress={handleDownvote}
          >
            <MaterialCommunityIcons  // CHANGED: Back to original
              name="arrow-down"  // CHANGED: Back to original
              size={12} 
              color={deal.isDownvoted ? "#FFF" : "#000"} 
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.favoriteButton, deal.isFavorited && styles.favorited]}
          onPress={handleFavorite}
        >
          <MaterialCommunityIcons  // CHANGED: Back to original
            name={deal.isFavorited ? "heart" : "heart-outline"}  // CHANGED: Back to original
            size={16} 
            color={deal.isFavorited ? "#FF8C4C" : "#000"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 185,
    minHeight: 280,
  },
  communityCard: {
    marginRight: 8,
  },
  standardCard: { 
    marginBottom: 8,
  },
  dealImage: {
    width: 161,
    height: 144,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#757575',
    marginBottom: 8,
  },
  textContainer: {
    width: 161,
    minHeight: 54,
    marginBottom: 8,
  },
  dealTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    width: '100%',
    height: 30,
    marginBottom: 4,
  },
  restaurantName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    width: '100%',
    height: 12,
    marginBottom: 2,
    textAlign: 'left',
  },
  locationAuthor: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#666666',
    width: '100%',
    height: 12,
    textAlign: 'left',
  },
  cardInteractions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
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
  },
  voteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    width: 12,
    height: 12,
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
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#000000',
    marginHorizontal: 6,
  },
  voteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D8D8D8',
    marginHorizontal: 6,
  },
  favoriteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favorited: {
    backgroundColor: '#FF8C4C',
  },
});

export default DealCard;