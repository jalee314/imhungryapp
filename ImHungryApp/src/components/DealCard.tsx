import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OptimizedImage from './OptimizedImage';

const { width: screenWidth } = Dimensions.get('window');
// Calculate dynamic card width: subtract horizontal padding (20px) and gap between cards (8px), then divide by 2
const HORIZONTAL_PADDING = 20; // 10px on each side
const CARD_GAP = 8; // 4px padding on each card
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;

// Calculate horizontal card width to show ~1.5 cards (first card fully visible, half of second card visible)
// This creates the "peek" effect that hints at horizontal scrolling
const HORIZONTAL_CARD_PADDING = 10; // Left padding for horizontal scroll
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - 20) / 1.5;

export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  imageVariants?: any; // Add this field
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  cuisineId?: string;
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
  hideAuthor?: boolean;
  showDelete?: boolean;
  onDelete?: (dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  variant = 'vertical',
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
  hideAuthor = false,
  showDelete = false,
  onDelete,
}) => {
  const handleUpvote = (e?: any) => {
    e?.stopPropagation?.();
    onUpvote?.(deal.id);
  };

  const handleDownvote = (e?: any) => {
    e?.stopPropagation?.();
    onDownvote?.(deal.id);
  };

  const handleFavorite = (e?: any) => {
    e?.stopPropagation?.();
    onFavorite?.(deal.id);
  };

  const handlePress = () => {
    onPress?.(deal.id);
  };

  const handleDelete = (e?: any) => {
    e?.stopPropagation?.();
    onDelete?.(deal.id);
  };

  const getImageSource = () => {
    if (deal.imageVariants) {
      // Use OptimizedImage for database images with variants
      const displaySize = variant === 'horizontal' 
        ? { width: HORIZONTAL_CARD_WIDTH, height: 144 }
        : { width: VERTICAL_CARD_WIDTH, height: 144 };
      
      return (
        <OptimizedImage
          variants={deal.imageVariants}
          componentType="deal"
          displaySize={displaySize}
          style={variant === 'horizontal' ? styles.horizontalImage : styles.verticalImage}
          fallbackSource={typeof deal.image === 'string' ? { uri: deal.image } : deal.image}
        />
      );
    } else {
      // Fallback to regular Image for static images or simple URIs
      const imageSource = typeof deal.image === 'string' 
        ? { uri: deal.image } 
        : deal.image;
      
      return (
        <Image 
          source={imageSource} 
          style={variant === 'horizontal' ? styles.horizontalImage : styles.verticalImage} 
        />
      );
    }
  };

  if (variant === 'horizontal') {
    const locationAuthorText = `${deal.restaurant}\n${deal.milesAway || '?mi'} away • ${deal.timeAgo} • By ${deal.author || 'Unknown'}`;
    
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {getImageSource()}
        <View style={styles.horizontalTitleContainer}>
          <Text style={styles.horizontalTitle} numberOfLines={2} ellipsizeMode="tail">
            {deal.title}
          </Text>
        </View>
        <Text style={styles.horizontalDetails} numberOfLines={2}>{locationAuthorText}</Text>
        
        <View style={styles.horizontalInteractions}>
          <TouchableWithoutFeedback onPress={handleUpvote}>
            <View style={styles.horizontalVoteContainer}>
              <TouchableOpacity 
                style={[styles.horizontalVoteButton, deal.isUpvoted && styles.upvotedcom]}
                onPress={handleUpvote}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons
                  name={deal.isUpvoted ? "arrow-up-bold" : "arrow-up-bold-outline"}
                  size={deal.isUpvoted ? 23 : 17} 
                  color={deal.isUpvoted ? "#FF8C4C" : "#000"} 
                />
              </TouchableOpacity>
              <Text style={styles.horizontalVoteCount}>{deal.votes}</Text>
              <View style={styles.horizontalVoteSeparator} />
              <TouchableOpacity 
                style={[styles.horizontalVoteButton, deal.isDownvoted && styles.downvotedcom]}
                onPress={handleDownvote}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons
                  name={deal.isDownvoted ? "arrow-down-bold" : "arrow-down-bold-outline"}
                  size={deal.isDownvoted ? 22 : 17} 
                  color={deal.isDownvoted ? "#9796FF" : "#000"} 
                />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.horizontalFavoriteWrapper}>
            <TouchableOpacity 
              style={[styles.horizontalFavoriteButton, deal.isFavorited && styles.favorited]}
              onPress={handleFavorite}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons
                name={deal.isFavorited ? "heart" : "heart-outline"}
                size={19} 
                color={deal.isFavorited ? "#FF1E00" : "#000"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Vertical variant - for the 2-column grid
  const locationAuthorText = hideAuthor 
  ? `${deal.restaurant}\n${deal.cuisine || 'Cuisine'} • ${deal.timeAgo} • ${deal.milesAway || '?mi'} away`
  : `${deal.restaurant}\n${deal.cuisine || 'Cuisine'} • ${deal.timeAgo} • ${deal.milesAway || '?mi'} away`;
  
  return (
    <TouchableOpacity
      style={styles.verticalCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {getImageSource()}
      <Text style={styles.verticalTitle} numberOfLines={2}>{deal.title}</Text>
      <Text style={styles.verticalDetails} numberOfLines={2}>{locationAuthorText}</Text>
      
      <View style={styles.verticalInteractions}>
        <TouchableWithoutFeedback onPress={handleUpvote}>
          <View style={styles.verticalVoteContainer}>
            <TouchableOpacity 
              style={[styles.verticalVoteButton, deal.isUpvoted && styles.upvoteddeals]}
              onPress={handleUpvote}
              activeOpacity={0.6}
            >
                <MaterialCommunityIcons
                  name={deal.isUpvoted ? "arrow-up-bold" : "arrow-up-bold-outline"}
                  size={deal.isUpvoted ? 23 : 17} 
                  color={deal.isUpvoted ? "#FF8C4C" : "#000"} 
                />
            </TouchableOpacity>
            <Text style={styles.verticalVoteCount}>{deal.votes}</Text>
            <View style={styles.verticalVoteSeparator} />
            <TouchableOpacity 
              style={[styles.verticalVoteButton, deal.isDownvoted && styles.downvoteddeals]}
              onPress={handleDownvote}
              activeOpacity={0.6}
            >
                <MaterialCommunityIcons
                  name={deal.isDownvoted ? "arrow-down-bold" : "arrow-down-bold-outline"}
                  size={deal.isDownvoted ? 22 : 17} 
                  color={deal.isDownvoted ? "#9796FF" : "#000"} 
                />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
        
        {/* Replace favorite button with delete button conditionally */}
        {showDelete ? (
          <TouchableOpacity 
            style={styles.verticalDeleteButton}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={16} 
              color="#000000" 
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.verticalFavoriteButton, deal.isFavorited && styles.favorited]}
            onPress={handleFavorite}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name={deal.isFavorited ? "heart" : "heart-outline"}
              size={19} 
              color={deal.isFavorited ? "#FF1E00" : "#000"} 
            />
          </TouchableOpacity>
        )}
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
    width: HORIZONTAL_CARD_WIDTH,
    height: 273,
    justifyContent: 'center',
    overflow: 'visible',
  },
  horizontalImage: {
    width: '100%',
    height: 144,
    borderRadius: 8,
    borderColor: '#757575',
    borderWidth: 0.5,
    marginBottom: 8,
  },
  horizontalTitleContainer: {
    width: '100%',
    marginBottom: 8,
    height: 30,
    justifyContent: 'flex-start',
  },
  horizontalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    height: 30,
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
    overflow: 'visible',
  },
  horizontalVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
    height: 28,
  },
  horizontalVoteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 24,
    borderRadius: 4,
  },
  horizontalVoteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginHorizontal: 6,
  },
  horizontalVoteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D7D7D7',
    marginHorizontal: 6,
  },
  horizontalFavoriteWrapper: {
    width: 62,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  horizontalFavoriteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
    overflow: 'visible',
  },
  // Vertical Card Styles (for 2-column grid)
  verticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    width: VERTICAL_CARD_WIDTH,
    height: 266,
    justifyContent: 'space-between',
  },
  verticalImage: {
    width: '100%',
    height: 144,
    borderRadius: 8,
    borderColor: '#757575',
    borderWidth: 0.5,
    marginBottom: 8,
  },
  verticalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    width: VERTICAL_CARD_WIDTH - 24, // Card width minus padding (8px on each side = 16) minus some margin (8px)
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
    width: VERTICAL_CARD_WIDTH - 24, // Card width minus padding (8px on each side = 16) minus some margin (8px)
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
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
    height: 28,
  },
  verticalVoteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  verticalVoteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginHorizontal: 6,
  },
  verticalVoteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D7D7D7',
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
  verticalDeleteButton: {
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
  upvotedcom: {
    // No background change - only icon color changes
    marginBottom: 2,
  },
  downvotedcom: {
    // No background change - only icon color changes
    marginBottom: 1,
  },
  upvoteddeals: {
    // No background change - only icon color changes
    marginBottom: 5,
  },
  downvoteddeals: {
    // No background change - only icon color changes
    marginBottom: 2,
  },
  favorited: {
    // Don't change background - only the heart icon color changes
  },
});

// Memoize component with custom comparison
const arePropsEqual = (prevProps: DealCardProps, nextProps: DealCardProps) => {
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