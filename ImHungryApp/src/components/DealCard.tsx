/**
 * DealCard - Reusable deal card component with horizontal and vertical variants
 */

import React, { memo } from 'react';
import { Image, Dimensions } from 'react-native';
import { Monicon } from '@monicon/native';
import { Box, Text, Pressable } from './atoms';
import OptimizedImage, { preloadImage } from './OptimizedImage';
import VoteButtons from './VoteButtons';
import { colors, spacing } from '../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

// Base design width (iPhone 15 = 393pt)
const BASE_WIDTH = 393;
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

// Card dimensions
const HORIZONTAL_PADDING = 20;
const CARD_GAP = 4;
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;
const HORIZONTAL_CARD_PADDING = scale(10);
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - scale(20)) / 1.32;
const HORIZONTAL_IMAGE_WIDTH = HORIZONTAL_CARD_WIDTH - scale(16);
const HORIZONTAL_IMAGE_HEIGHT = HORIZONTAL_IMAGE_WIDTH * 0.64;
const VERTICAL_IMAGE_SIZE = VERTICAL_CARD_WIDTH - scale(16);

export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string | any;
  imageVariants?: any;
  images?: string[];
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  cuisineId?: string;
  dealType?: string;
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
    if (deal.imageVariants && deal.image) {
      preloadImage(deal.image, deal.imageVariants, { width: screenWidth, height: 400 }).catch(() => {});
    } else if (deal.image) {
      preloadImage(deal.image).catch(() => {});
    }
    onPress?.(deal.id);
  };

  const handleDelete = (e?: any) => {
    e?.stopPropagation?.();
    onDelete?.(deal.id);
  };

  const horizontalImageStyle = {
    width: HORIZONTAL_IMAGE_WIDTH,
    height: HORIZONTAL_IMAGE_HEIGHT,
    borderRadius: scale(8),
    marginBottom: spacing.s2,
    resizeMode: 'cover' as const,
  };

  const verticalImageStyle = {
    width: VERTICAL_IMAGE_SIZE,
    height: VERTICAL_IMAGE_SIZE,
    borderRadius: scale(8),
    marginBottom: spacing.s2,
  };

  const renderImage = () => {
    const imageStyle = variant === 'horizontal' ? horizontalImageStyle : verticalImageStyle;
    
    if (deal.imageVariants) {
      const displaySize = variant === 'horizontal'
        ? { width: Math.round(HORIZONTAL_IMAGE_WIDTH), height: Math.round(HORIZONTAL_IMAGE_HEIGHT) }
        : { width: Math.round(VERTICAL_IMAGE_SIZE), height: Math.round(VERTICAL_IMAGE_SIZE) };

      return (
        <OptimizedImage
          variants={deal.imageVariants}
          componentType="deal"
          displaySize={displaySize}
          style={imageStyle}
          fallbackSource={typeof deal.image === 'string' && deal.image ? { uri: deal.image } : deal.image}
        />
      );
    } else if (deal.image) {
      const imageSource = typeof deal.image === 'string' ? { uri: deal.image } : deal.image;
      return <Image source={imageSource} style={imageStyle} />;
    }
    return null;
  };

  const FavoriteButton = () => (
    <Pressable
      onPress={handleFavorite}
      activeOpacity={0.6}
      bg="background"
      rounded="full"
      width={scale(40)}
      height={scale(28)}
      center
      style={{
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Monicon
        name={deal.isFavorited ? "mdi:heart" : "mdi:heart-outline"}
        size={scale(19)}
        color={deal.isFavorited ? colors.error : colors.text}
      />
    </Pressable>
  );

  const DeleteButton = () => (
    <Pressable
      onPress={handleDelete}
      activeOpacity={0.6}
      bg="background"
      rounded="full"
      width={scale(40)}
      height={scale(28)}
      center
      style={{
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Monicon name="uil:trash-alt" size={scale(16)} color={colors.text} />
    </Pressable>
  );

  if (variant === 'horizontal') {
    return (
      <Pressable
        onPress={handlePress}
        activeOpacity={0.8}
        bg="background"
        rounded="md"
        py="s3"
        px="s2"
        style={{
          width: HORIZONTAL_CARD_WIDTH,
          height: HORIZONTAL_IMAGE_HEIGHT + scale(113),
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        {renderImage()}
        
        <Box width="100%" height={scale(20)} justifyStart>
          <Text 
            variant="bodySmall" 
            weight="semiBold" 
            numberOfLines={1} 
            style={{ height: scale(30), lineHeight: scale(15) }}
          >
            {deal.title}
          </Text>
        </Box>
        
        <Box width="100%" mb="s2">
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {deal.restaurant}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {deal.milesAway || '?mi'} away • {deal.timeAgo} • By {deal.author || 'Unknown'}
          </Text>
        </Box>

        <Box row justifyBetween alignCenter width="100%">
          <VoteButtons
            votes={deal.votes}
            isUpvoted={deal.isUpvoted}
            isDownvoted={deal.isDownvoted}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
          />
          <Box width={scale(62)} alignEnd>
            <Pressable
              onPress={handleFavorite}
              activeOpacity={0.6}
              bg="background"
              rounded="full"
              px="s3"
              height={scale(28)}
              center
              style={{
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Monicon
                name={deal.isFavorited ? "mdi:heart" : "mdi:heart-outline"}
                size={scale(19)}
                color={deal.isFavorited ? colors.error : colors.text}
              />
            </Pressable>
          </Box>
        </Box>
      </Pressable>
    );
  }

  // Vertical variant
  const detailsLine = deal.cuisine && deal.cuisine !== 'Cuisine'
    ? `${deal.cuisine} • ${deal.timeAgo} • ${deal.milesAway || '?mi'} away`
    : `${deal.timeAgo} • ${deal.milesAway || '?mi'} away`;

  return (
    <Pressable
      onPress={handlePress}
      activeOpacity={0.8}
      bg="background"
      rounded="lg"
      p="s2"
      style={{
        width: VERTICAL_CARD_WIDTH,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      {renderImage()}
      
      <Text 
        variant="bodySmall" 
        weight="semiBold" 
        numberOfLines={1} 
        style={{ width: VERTICAL_CARD_WIDTH - scale(24) }}
      >
        {deal.title}
      </Text>
      
      <Box width={VERTICAL_CARD_WIDTH - scale(24)} mb="s2">
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {deal.restaurant}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {detailsLine}
        </Text>
      </Box>

      <Box row justifyBetween alignCenter width="100%">
        <VoteButtons
          votes={deal.votes}
          isUpvoted={deal.isUpvoted}
          isDownvoted={deal.isDownvoted}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
        />
        {showDelete ? <DeleteButton /> : <FavoriteButton />}
      </Box>
    </Pressable>
  );
};

// Memoize with custom comparison
const arePropsEqual = (prevProps: DealCardProps, nextProps: DealCardProps) => {
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.deal.votes === nextProps.deal.votes &&
    prevProps.deal.isUpvoted === nextProps.deal.isUpvoted &&
    prevProps.deal.isDownvoted === nextProps.deal.isDownvoted &&
    prevProps.deal.isFavorited === nextProps.deal.isFavorited &&
    prevProps.deal.imageVariants?.cloudinary_id === nextProps.deal.imageVariants?.cloudinary_id &&
    prevProps.variant === nextProps.variant &&
    prevProps.showDelete === nextProps.showDelete &&
    prevProps.deal.title === nextProps.deal.title &&
    prevProps.deal.details === nextProps.deal.details &&
    prevProps.deal.author === nextProps.deal.author &&
    prevProps.deal.isAnonymous === nextProps.deal.isAnonymous &&
    prevProps.deal.restaurant === nextProps.deal.restaurant
  );
};

export default memo(DealCard, arePropsEqual);
