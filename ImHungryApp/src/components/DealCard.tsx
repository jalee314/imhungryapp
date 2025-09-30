import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  cuisineId?: string; // ADD THIS
  timeAgo: string;
  author?: string;
  milesAway?: string;

  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
}

interface DealCardProps {
  deal: Deal;
  variant?: 'horizontal' | 'vertical';
  onUpvote?: (dealId: string) => void;
  onDownvote?: (dealId: string) => void;
  onFavorite?: (dealId: string) => void;
  onPress?: (dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  variant = 'vertical',
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
}) => {
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

  const imageSource = typeof deal.image === 'string' 
    ? { uri: deal.image } 
    : deal.image;

  if (variant === 'horizontal') {
    // Horizontal variant - this is actually a vertical card for the horizontal scroll
    const locationAuthorText = `${deal.restaurant}\n${deal.milesAway || '?mi'} away • ${deal.timeAgo} • By ${deal.author || 'Unknown'}`;
    
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image source={imageSource} style={styles.horizontalImage} />
        <View style={styles.horizontalTitleContainer}>
          <Text style={styles.horizontalTitle} numberOfLines={2} ellipsizeMode="tail">
            {deal.title}
          </Text>
        </View>
        <Text style={styles.horizontalDetails} numberOfLines={2}>{locationAuthorText}</Text>
        
        <View style={styles.horizontalInteractions}>
          <View style={styles.horizontalVoteContainer}>
            <TouchableOpacity 
              style={[styles.horizontalVoteButton, deal.isUpvoted && styles.upvoted]}
              onPress={handleUpvote}
            >
              <MaterialCommunityIcons
                name="arrow-up"
                size={12} 
                color={deal.isUpvoted ? "#FFF" : "#000"} 
              />
            </TouchableOpacity>
            <Text style={styles.horizontalVoteCount}>{deal.votes}</Text>
            <View style={styles.horizontalVoteSeparator} />
            <TouchableOpacity 
              style={[styles.horizontalVoteButton, deal.isDownvoted && styles.downvoted]}
              onPress={handleDownvote}
            >
              <MaterialCommunityIcons
                name="arrow-down"
                size={12} 
                color={deal.isDownvoted ? "#FFF" : "#000"} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.horizontalFavoriteWrapper}>
            <TouchableOpacity 
              style={[styles.horizontalFavoriteButton, deal.isFavorited && styles.favorited]}
              onPress={handleFavorite}
            >
              <MaterialCommunityIcons
                name={deal.isFavorited ? "heart" : "heart-outline"}
                size={16} 
                color={deal.isFavorited ? "#FF8C4C" : "#000"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Vertical variant - for the 2-column grid
  const locationAuthorText = `${deal.restaurant}\n${deal.cuisine || 'Cuisine'} • ${deal.timeAgo} • ${deal.milesAway || '?mi'} away`;
  
  return (
    <TouchableOpacity
      style={styles.verticalCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image source={imageSource} style={styles.verticalImage} />
      <Text style={styles.verticalTitle} numberOfLines={2}>{deal.title}</Text>
      <Text style={styles.verticalDetails} numberOfLines={2}>{locationAuthorText}</Text>
      
      <View style={styles.verticalInteractions}>
        <View style={styles.verticalVoteContainer}>
          <TouchableOpacity 
            style={[styles.verticalVoteButton, deal.isUpvoted && styles.upvoted]}
            onPress={handleUpvote}
          >
            <MaterialCommunityIcons
              name="arrow-up"
              size={12} 
              color={deal.isUpvoted ? "#FFF" : "#000"} 
            />
          </TouchableOpacity>
          <Text style={styles.verticalVoteCount}>{deal.votes}</Text>
          <View style={styles.verticalVoteSeparator} />
          <TouchableOpacity 
            style={[styles.verticalVoteButton, deal.isDownvoted && styles.downvoted]}
            onPress={handleDownvote}
          >
            <MaterialCommunityIcons
              name="arrow-down"
              size={12} 
              color={deal.isDownvoted ? "#FFF" : "#000"} 
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.verticalFavoriteButton, deal.isFavorited && styles.favorited]}
          onPress={handleFavorite}
        >
          <MaterialCommunityIcons
            name={deal.isFavorited ? "heart" : "heart-outline"}
            size={16} 
            color={deal.isFavorited ? "#FF8C4C" : "#000"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Horizontal Card Styles (for community track - actually vertical cards in horizontal scroll)
  horizontalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 220,
    height: 273,
    justifyContent: 'center',
  },
  horizontalImage: {
    width: '100%',
    height: 144,
    borderRadius: 8,
    marginBottom: 8,
  },
  horizontalTitleContainer: {
    width: '100%',
    marginBottom: 8,
    height: 30, // Fixed height to accommodate 2 lines
    justifyContent: 'flex-start', // Align to top
  },
  horizontalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    height: 30, // Fixed height
  },
  horizontalDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#757575',
    textAlign: 'left',
    width: '100%',
    marginBottom: 8,
  },
  horizontalInteractions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  horizontalVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  horizontalVoteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalVoteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#000000',
    marginHorizontal: 6,
  },
  horizontalVoteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D8D8D8',
    marginHorizontal: 6,
  },
  horizontalFavoriteWrapper: {
    width: 62,
    alignItems: 'flex-end',
  },
  horizontalFavoriteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Vertical Card Styles (for 2-column grid)
  verticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    width: 185,
    height: 266,
    justifyContent: 'space-between',
  },
  verticalImage: {
    width: '100%',
    height: 144,
    borderRadius: 8,
    marginBottom: 8,
  },
  verticalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    width: 161,
    height: 30,
    marginBottom: 8,
  },
  verticalDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#757575',
    textAlign: 'left',
    width: 161,
    marginBottom: 8,
  },
  verticalInteractions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  verticalVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  verticalVoteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalVoteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#000000',
    marginHorizontal: 6,
  },
  verticalVoteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D8D8D8',
    marginHorizontal: 6,
  },
  verticalFavoriteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shared styles
  upvoted: {
    backgroundColor: '#FF8C4C',
  },
  downvoted: {
    backgroundColor: '#9796FF',
  },
  favorited: {
    // Don't change background - only the heart icon color changes
    // The icon color is already handled in the component logic
  },
});

// ✨ NEW: Memoize component with custom comparison
const arePropsEqual = (prevProps: DealCardProps, nextProps: DealCardProps) => {
  // Only re-render if the specific deal data that affects rendering changed
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.deal.votes === nextProps.deal.votes &&
    prevProps.deal.isUpvoted === nextProps.deal.isUpvoted &&
    prevProps.deal.isDownvoted === nextProps.deal.isDownvoted &&
    prevProps.deal.isFavorited === nextProps.deal.isFavorited &&
    prevProps.variant === nextProps.variant
  );
};

export default memo(DealCard, arePropsEqual);