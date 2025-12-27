import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, Dimensions } from 'react-native';
import { Monicon } from '@monicon/native';
import OptimizedImage, { preloadImage } from './OptimizedImage';
import VoteButtons from './VoteButtons';
import * as tokens from '#/ui/tokens';

const { width: screenWidth } = Dimensions.get('window');

// Base design width (iPhone 15 = 393pt)
const BASE_WIDTH = 393;
// Scale factor for larger screens (Pro Max = 430pt)
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

// Calculate dynamic card width: subtract horizontal padding (20px = 10px each side) and gap between cards (4px), then divide by 2
const HORIZONTAL_PADDING = scale(20); // 10px on each side, scaled
const CARD_GAP = scale(4); // 2px padding on each card (halved for tighter spacing)
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;

// Calculate horizontal card width to align with header location icon
// This creates the "peek" effect that hints at horizontal scrolling
const HORIZONTAL_CARD_PADDING = scale(10); // Left padding for horizontal scroll
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - scale(20)) / 1.32;

// Dynamic image dimensions
const HORIZONTAL_IMAGE_WIDTH = HORIZONTAL_CARD_WIDTH - scale(16); // Card padding
const HORIZONTAL_IMAGE_HEIGHT = HORIZONTAL_IMAGE_WIDTH * 0.64; // Maintain aspect ratio ~260:167
const VERTICAL_IMAGE_SIZE = VERTICAL_CARD_WIDTH - scale(16); // Square image for vertical cards

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
  dealType?: string; // e.g., "BOGO", "50% Off", "Happy Hour", etc.
  timeAgo: string;
  author?: string;
  milesAway?: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string;
  userCity?: string;
  userState?: string;
  restaurantAddress?: string;
  isAnonymous?: boolean;
  expirationDate?: string | null;
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
    // Start preloading in background without blocking navigation
    if (deal.imageVariants && deal.image) {
      // Preload the large version for detail view (full screen width)
      preloadImage(deal.image, deal.imageVariants, { width: screenWidth, height: 400 }).catch(err => {
        console.error('Failed to preload image:', err);
      });
    } else if (deal.image && (typeof deal.image === 'string' ? deal.image.trim() : deal.image)) {
      preloadImage(deal.image).catch(err => {
        console.error('Failed to preload image:', err);
      });
    }
    
    // Navigate immediately - no await, no delay
    onPress?.(deal.id);
  };

  const handleDelete = (e?: any) => {
    e?.stopPropagation?.();
    onDelete?.(deal.id);
  };

  const getImageSource = () => {
    if (deal.imageVariants) {
      // Use OptimizedImage for database images with variants
      // Dynamic sizing based on screen width
      const displaySize = variant === 'horizontal' 
        ? { width: Math.round(HORIZONTAL_IMAGE_WIDTH), height: Math.round(HORIZONTAL_IMAGE_HEIGHT) }
        : { width: Math.round(VERTICAL_IMAGE_SIZE), height: Math.round(VERTICAL_IMAGE_SIZE) };
      
      return (
        <OptimizedImage 
          variants={deal.imageVariants}
          componentType="deal"
          displaySize={displaySize}
          style={variant === 'horizontal' ? styles.horizontalImage : styles.verticalImage}
          fallbackSource={typeof deal.image === 'string' && deal.image ? { uri: deal.image } : deal.image}
        />
      );
    } else if (deal.image) {
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
    // Return null if no valid image source
    return null;
  };

  if (variant === 'horizontal') {
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
        <View style={styles.horizontalDetailsContainer}>
          <Text style={styles.horizontalDetails} numberOfLines={1} ellipsizeMode="tail">
            {deal.restaurant}
          </Text>
          <Text style={styles.horizontalDetails} numberOfLines={1}>
            {deal.milesAway || '?mi'} away • {deal.timeAgo} • By {deal.author || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.horizontalInteractions}>
          <VoteButtons
            votes={deal.votes}
            isUpvoted={deal.isUpvoted}
            isDownvoted={deal.isDownvoted}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
          />
          <View style={styles.horizontalFavoriteWrapper}>
            <TouchableOpacity 
              style={[styles.horizontalFavoriteButton, deal.isFavorited && styles.favorited]}
              onPress={handleFavorite}
              activeOpacity={0.6}
            >
              <Monicon
                name={deal.isFavorited ? "mdi:heart" : "mdi:heart-outline"}
                size={scale(19)} 
                color={deal.isFavorited ? tokens.color.favorite_red : tokens.color.black} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Vertical variant - for the 2-column grid
  // Build the details line, omitting cuisine if it's not specified or is 'Cuisine'
  const detailsLine = deal.cuisine && deal.cuisine !== 'Cuisine'
    ? `${deal.cuisine} • ${deal.timeAgo} • ${deal.milesAway || '?mi'} away`
    : `${deal.timeAgo} • ${deal.milesAway || '?mi'} away`;
  
  return (
    <TouchableOpacity
      style={styles.verticalCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {getImageSource()}
      <Text style={styles.verticalTitle} numberOfLines={2}>{deal.title}</Text>
      <View style={styles.verticalDetailsContainer}>
        <Text style={styles.verticalDetails} numberOfLines={1} ellipsizeMode="tail">
          {deal.restaurant}
        </Text>
        <Text style={styles.verticalDetails} numberOfLines={1}>
          {detailsLine}
        </Text>
      </View>
      
      <View style={styles.verticalInteractions}>
        <VoteButtons
          votes={deal.votes}
          isUpvoted={deal.isUpvoted}
          isDownvoted={deal.isDownvoted}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
        />
        
        {/* Replace favorite button with delete button conditionally */}
        {showDelete ? (
          <TouchableOpacity 
            style={styles.verticalDeleteButton}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <Monicon
              name="uil:trash-alt"
              size={scale(16)} 
              color={tokens.color.black} 
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.verticalFavoriteButton, deal.isFavorited && styles.favorited]}
            onPress={handleFavorite}
            activeOpacity={0.6}
          >
            <Monicon
              name={deal.isFavorited ? "mdi:heart" : "mdi:heart-outline"}
              size={scale(19)} 
              color={deal.isFavorited ? tokens.color.favorite_red : tokens.color.black} 
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
    backgroundColor: tokens.color.white,
    borderRadius: scale(10),
    paddingVertical: scale(12),
    paddingHorizontal: scale(8),
    alignItems: 'flex-start',
    width: HORIZONTAL_CARD_WIDTH,
    height: HORIZONTAL_IMAGE_HEIGHT + scale(113), // Image + content below
    justifyContent: 'center',
    overflow: 'visible',
  },
  horizontalImage: {
    width: HORIZONTAL_IMAGE_WIDTH,
    height: HORIZONTAL_IMAGE_HEIGHT,
    borderRadius: scale(8),
    marginBottom: scale(8),
    resizeMode: 'cover',
  },
  horizontalTitleContainer: {
    width: '100%',
    height: scale(20),
    justifyContent: 'flex-start',
  },
  horizontalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: scale(12),
    lineHeight: scale(15),
    color: tokens.color.black,
    textAlign: 'left',
    height: scale(30),
  },
  horizontalDetailsContainer: {
    width: '100%',
    marginBottom: scale(8),
  },
  horizontalDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: tokens.color.gray_500,
    textAlign: 'left',
    width: '100%',
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
    backgroundColor: tokens.color.gray_100,
    borderWidth: 1,
    borderColor: tokens.color.gray_300,
    borderRadius: 30,
    paddingHorizontal: scale(10),
    paddingVertical: scale(2),
    height: scale(28),
    width: scale(85),
    justifyContent: 'space-between',
  },
  horizontalVoteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(20),
    height: scale(24),
    borderRadius: 4,
  },
  horizontalVoteCount: {
    fontFamily: 'Inter',
    fontSize: scale(10),
    fontWeight: '400',
    color: tokens.color.black,
    marginHorizontal: scale(6),
  },
  horizontalVoteSeparator: {
    width: 1,
    height: scale(12),
    backgroundColor: tokens.color.gray_200,
    marginHorizontal: scale(6),
  },
  horizontalFavoriteWrapper: {
    width: scale(62),
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  horizontalFavoriteButton: {
    backgroundColor: tokens.color.white,
    borderWidth: 1,
    borderColor: tokens.color.gray_300,
    borderRadius: 30,
    paddingHorizontal: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(28),
    overflow: 'visible',
  },
  // Vertical Card Styles (for 2-column grid)
  verticalCard: {
    backgroundColor: tokens.color.white,
    borderRadius: scale(16),
    padding: scale(8),
    alignItems: 'flex-start',
    width: VERTICAL_CARD_WIDTH,
    justifyContent: 'flex-start',
  },
  verticalImage: {
    width: VERTICAL_IMAGE_SIZE,
    height: VERTICAL_IMAGE_SIZE,
    borderRadius: scale(8),
    marginBottom: scale(8),
  },
  verticalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: scale(12),
    lineHeight: scale(15),
    color: tokens.color.black,
    textAlign: 'left',
    width: VERTICAL_CARD_WIDTH - scale(24),
  },
  verticalDetailsContainer: {
    width: VERTICAL_CARD_WIDTH - scale(24),
    marginBottom: scale(8),
  },
  verticalDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: tokens.color.gray_500,
    textAlign: 'left',
    width: '100%',
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
    backgroundColor: tokens.color.gray_100,
    borderWidth: 1,
    borderColor: tokens.color.gray_300,
    borderRadius: 30,
    paddingHorizontal: scale(10),
    paddingVertical: scale(2),
    height: scale(28),
    width: scale(85),
    justifyContent: 'space-between',
  },
  verticalVoteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(20),
    height: scale(20),
    borderRadius: 4,
  },
  verticalVoteCount: {
    fontFamily: 'Inter',
    fontSize: scale(10),
    fontWeight: '400',
    color: tokens.color.black,
    marginHorizontal: scale(6),
  },
  verticalVoteSeparator: {
    width: 1,
    height: scale(12),
    backgroundColor: tokens.color.gray_200,
    marginHorizontal: scale(6),
  },
  verticalFavoriteButton: {
    backgroundColor: tokens.color.white,
    borderWidth: 1,
    borderColor: tokens.color.gray_300,
    borderRadius: 30,
    width: scale(40),
    height: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDeleteButton: {
    backgroundColor: tokens.color.white,
    borderWidth: 1,
    borderColor: tokens.color.gray_300,
    borderRadius: 30,
    width: scale(40),
    height: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shared styles
  arrowIconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvotedcom: {
    // No background change - only icon color changes
    // marginBottom: 2, // Removed to prevent shifting
  },
  downvotedcom: {
    // No background change - only icon color changes
    // marginBottom: 1, // Removed to prevent shifting
  },
  upvoteddeals: {
    // No background change - only icon color changes
    // marginBottom: 5, // Removed to prevent shifting
  },
  downvoteddeals: {
    // No background change - only icon color changes
    // marginBottom: 2, // Removed to prevent shifting
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