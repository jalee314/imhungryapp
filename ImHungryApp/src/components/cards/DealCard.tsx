/**
 * DealCard.tsx
 *
 * Deal card component built on top of the base Card component.
 * Follows Bluesky's composable component patterns.
 *
 * Usage:
 *   import * as DealCard from '#/components/cards/DealCard'
 *
 *   // Default variant
 *   <DealCard.Default deal={deal} onPress={handlePress} />
 *
 *   // Horizontal variant for community track
 *   <DealCard.Horizontal deal={deal} onPress={handlePress} />
 *
 *   // Composable parts using base Card
 *   <Card onPress={handlePress} padding="sm">
 *     <CardImage aspectRatio="square">
 *       <Image source={imageSource} />
 *     </CardImage>
 *     <CardBody>
 *       <DealCard.Title>{deal.title}</DealCard.Title>
 *       <DealCard.Details restaurant={deal.restaurant} />
 *     </CardBody>
 *     <CardFooter>
 *       <DealCard.Actions deal={deal} />
 *     </CardFooter>
 *   </Card>
 */

import React, { memo, ReactNode, useCallback } from 'react'
import {
  View,
  Text,
  Image as RNImage,
  Pressable,
  Dimensions,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native'
import { Monicon } from '@monicon/native'

import { atoms as a, useTheme, ViewStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'
import { Card, CardBody, CardFooter, CardImage } from './Card'
import { OptimizedImage, preloadImage } from '../Image'
import { VoteButtons } from '#/features/deals'
import { Deal } from '#/types'

// ==========================================
// Constants
// ==========================================

const { width: screenWidth } = Dimensions.get('window')

// Base design width (iPhone 15 = 393pt)
const BASE_WIDTH = 393
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size

// Card dimensions
const HORIZONTAL_PADDING = scale(20)
const CARD_GAP = scale(4)
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2

const HORIZONTAL_CARD_PADDING = scale(10)
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - scale(20)) / 1.32

const HORIZONTAL_IMAGE_WIDTH = HORIZONTAL_CARD_WIDTH - scale(16)
const HORIZONTAL_IMAGE_HEIGHT = HORIZONTAL_IMAGE_WIDTH * 0.64
const VERTICAL_IMAGE_SIZE = VERTICAL_CARD_WIDTH - scale(16)

// ==========================================
// Types - Re-exported from centralized types
// ==========================================

// Deal type is imported from '#/types' for centralized type management
export type { Deal } from '#/types'

interface DealCardProps {
  deal: Deal
  onUpvote?: (dealId: string) => void
  onDownvote?: (dealId: string) => void
  onFavorite?: (dealId: string) => void
  onPress?: (dealId: string) => void
  hideAuthor?: boolean
  showDelete?: boolean
  onDelete?: (dealId: string) => void
}

// ==========================================
// Image Component (extends CardImage)
// ==========================================

interface DealImageProps {
  deal: Deal
  variant?: 'vertical' | 'horizontal'
  style?: StyleProp<ImageStyle>
}

export function DealImage({ deal, variant = 'vertical', style }: DealImageProps) {
  const isHorizontal = variant === 'horizontal'
  const imageSize = isHorizontal
    ? { width: HORIZONTAL_IMAGE_WIDTH, height: HORIZONTAL_IMAGE_HEIGHT }
    : { width: VERTICAL_IMAGE_SIZE, height: VERTICAL_IMAGE_SIZE }

  const imageStyle: StyleProp<ImageStyle> = [
    a.rounded_md,
    { width: imageSize.width, height: imageSize.height },
    style,
  ]

  // Use CardImage wrapper for consistent styling
  const aspectRatio = isHorizontal ? 'video' : 'square'

  if (deal.imageVariants) {
    return (
      <CardImage aspectRatio={aspectRatio} style={{ aspectRatio: undefined, ...imageSize, marginBottom: scale(8) }}>
        <OptimizedImage
          variants={deal.imageVariants}
          componentType="deal"
          displaySize={{ width: Math.round(imageSize.width), height: Math.round(imageSize.height) }}
          style={[{ width: '100%', height: '100%' }, style]}
          fallbackSource={typeof deal.image === 'string' && deal.image ? { uri: deal.image } : deal.image}
        />
      </CardImage>
    )
  }

  if (deal.image) {
    const imageSource = typeof deal.image === 'string' ? { uri: deal.image } : deal.image
    return (
      <CardImage aspectRatio={aspectRatio} style={{ aspectRatio: undefined, ...imageSize, marginBottom: scale(8) }}>
        <RNImage source={imageSource} style={{ width: '100%', height: '100%' }} />
      </CardImage>
    )
  }

  return null
}

// ==========================================
// Title Component
// ==========================================

interface TitleProps {
  children: ReactNode
  variant?: 'vertical' | 'horizontal'
  numberOfLines?: number
}

export function Title({ children, variant = 'vertical', numberOfLines = 2 }: TitleProps) {
  const isHorizontal = variant === 'horizontal'

  return (
    <Text
      numberOfLines={numberOfLines}
      ellipsizeMode="tail"
      style={[
        {
          fontFamily: 'Inter',
          fontWeight: '600',
          fontSize: scale(12),
          lineHeight: scale(15),
          color: tokens.color.black,
          textAlign: 'left',
        },
        isHorizontal
          ? { height: scale(30), width: '100%' }
          : { width: VERTICAL_CARD_WIDTH - scale(24) },
      ]}
    >
      {children}
    </Text>
  )
}

// ==========================================
// Details Component
// ==========================================

interface DetailsProps {
  restaurant: string
  cuisine?: string
  timeAgo?: string
  milesAway?: string
  author?: string
  variant?: 'vertical' | 'horizontal'
}

export function Details({
  restaurant,
  cuisine,
  timeAgo,
  milesAway,
  author,
  variant = 'vertical',
}: DetailsProps) {
  const isHorizontal = variant === 'horizontal'

  const detailsLine = cuisine && cuisine !== 'Cuisine'
    ? `${cuisine} • ${timeAgo} • ${milesAway || '?mi'} away`
    : `${timeAgo} • ${milesAway || '?mi'} away`

  const textStyle = {
    fontFamily: 'Inter',
    fontWeight: '400' as const,
    fontSize: scale(10),
    lineHeight: scale(12),
    color: tokens.color.gray_500,
    textAlign: 'left' as const,
    width: '100%' as const,
  }

  return (
    <View style={{ width: isHorizontal ? '100%' : VERTICAL_CARD_WIDTH - scale(24), marginBottom: scale(8) }}>
      <Text style={textStyle} numberOfLines={1} ellipsizeMode="tail">
        {restaurant}
      </Text>
      <Text style={textStyle} numberOfLines={1}>
        {isHorizontal && author
          ? `${milesAway || '?mi'} away • ${timeAgo} • By ${author}`
          : detailsLine}
      </Text>
    </View>
  )
}

// ==========================================
// Actions Component (for CardFooter)
// ==========================================

interface ActionsProps {
  deal: Deal
  onUpvote?: (dealId: string) => void
  onDownvote?: (dealId: string) => void
  onFavorite?: (dealId: string) => void
  showDelete?: boolean
  onDelete?: (dealId: string) => void
  variant?: 'vertical' | 'horizontal'
}

export function Actions({
  deal,
  onUpvote,
  onDownvote,
  onFavorite,
  showDelete = false,
  onDelete,
  variant = 'vertical',
}: ActionsProps) {
  const handleUpvote = useCallback(() => onUpvote?.(deal.id), [deal.id, onUpvote])
  const handleDownvote = useCallback(() => onDownvote?.(deal.id), [deal.id, onDownvote])
  const handleFavorite = useCallback(() => onFavorite?.(deal.id), [deal.id, onFavorite])
  const handleDelete = useCallback(() => onDelete?.(deal.id), [deal.id, onDelete])

  const isHorizontal = variant === 'horizontal'

  const actionButtonStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: tokens.color.white,
      borderWidth: 1,
      borderColor: tokens.color.gray_300,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      height: scale(28),
    },
    isHorizontal ? { paddingHorizontal: scale(12) } : { width: scale(40) },
  ]

  return (
    <View style={[a.flex_row, a.justify_between, a.align_center, { width: '100%' }]}>
      <VoteButtons
        votes={deal.votes}
        isUpvoted={deal.isUpvoted}
        isDownvoted={deal.isDownvoted}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
      />

      {showDelete ? (
        <Pressable style={actionButtonStyle} onPress={handleDelete}>
          <Monicon name="uil:trash-alt" size={scale(16)} color={tokens.color.black} />
        </Pressable>
      ) : (
        <Pressable style={actionButtonStyle} onPress={handleFavorite}>
          <Monicon
            name={deal.isFavorited ? 'mdi:heart' : 'mdi:heart-outline'}
            size={scale(19)}
            color={deal.isFavorited ? tokens.color.favorite_red : tokens.color.black}
          />
        </Pressable>
      )}
    </View>
  )
}

// ==========================================
// Default (Vertical) Variant - uses base Card
// ==========================================

function DefaultInner({
  deal,
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
  showDelete = false,
  onDelete,
}: DealCardProps) {
  const handlePress = useCallback(() => {
    // Preload larger image for detail view
    if (deal.imageVariants && deal.image) {
      preloadImage(deal.image, deal.imageVariants, { width: screenWidth, height: 400 }).catch(() => {})
    } else if (deal.image) {
      preloadImage(deal.image).catch(() => {})
    }
    onPress?.(deal.id)
  }, [deal, onPress])

  return (
    <Card
      onPress={handlePress}
      padding="sm"
      elevation="none"
      style={{ width: VERTICAL_CARD_WIDTH }}
    >
      <DealImage deal={deal} variant="vertical" />

      <CardBody style={{ gap: 0 }}>
        <Title variant="vertical">{deal.title}</Title>
        <Details
          restaurant={deal.restaurant}
          cuisine={deal.cuisine}
          timeAgo={deal.timeAgo}
          milesAway={deal.milesAway}
          variant="vertical"
        />
      </CardBody>

      <CardFooter style={{ marginTop: 0 }}>
        <Actions
          deal={deal}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          onFavorite={onFavorite}
          showDelete={showDelete}
          onDelete={onDelete}
          variant="vertical"
        />
      </CardFooter>
    </Card>
  )
}

// Memoized with custom comparison for performance
const areDefaultPropsEqual = (prev: DealCardProps, next: DealCardProps) => (
  prev.deal.id === next.deal.id &&
  prev.deal.votes === next.deal.votes &&
  prev.deal.isUpvoted === next.deal.isUpvoted &&
  prev.deal.isDownvoted === next.deal.isDownvoted &&
  prev.deal.isFavorited === next.deal.isFavorited
)

export const Default = memo(DefaultInner, areDefaultPropsEqual)

// ==========================================
// Horizontal Variant - uses base Card
// ==========================================

function HorizontalInner({
  deal,
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
}: DealCardProps) {
  const handlePress = useCallback(() => {
    if (deal.imageVariants && deal.image) {
      preloadImage(deal.image, deal.imageVariants, { width: screenWidth, height: 400 }).catch(() => {})
    } else if (deal.image) {
      preloadImage(deal.image).catch(() => {})
    }
    onPress?.(deal.id)
  }, [deal, onPress])

  return (
    <Card
      onPress={handlePress}
      padding="sm"
      elevation="none"
      style={{
        width: HORIZONTAL_CARD_WIDTH,
        height: HORIZONTAL_IMAGE_HEIGHT + scale(113),
        paddingVertical: scale(12),
        paddingHorizontal: scale(8),
      }}
    >
      <DealImage deal={deal} variant="horizontal" />

      <CardBody style={{ gap: 0 }}>
        <View style={{ width: '100%', height: scale(20), justifyContent: 'flex-start' }}>
          <Title variant="horizontal">{deal.title}</Title>
        </View>
        <Details
          restaurant={deal.restaurant}
          timeAgo={deal.timeAgo}
          milesAway={deal.milesAway}
          author={deal.author || 'Unknown'}
          variant="horizontal"
        />
      </CardBody>

      <CardFooter style={{ marginTop: 0 }}>
        <Actions
          deal={deal}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          onFavorite={onFavorite}
          variant="horizontal"
        />
      </CardFooter>
    </Card>
  )
}

export const Horizontal = memo(HorizontalInner, areDefaultPropsEqual)

// ==========================================
// Legacy Export for Backwards Compatibility
// ==========================================

/**
 * @deprecated Use DealCard.Default or DealCard.Horizontal instead
 */
function LegacyDealCard({
  deal,
  variant = 'vertical',
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
  showDelete = false,
  onDelete,
}: DealCardProps & { variant?: 'horizontal' | 'vertical' }) {
  if (variant === 'horizontal') {
    return (
      <Horizontal
        deal={deal}
        onUpvote={onUpvote}
        onDownvote={onDownvote}
        onFavorite={onFavorite}
        onPress={onPress}
      />
    )
  }

  return (
    <Default
      deal={deal}
      onUpvote={onUpvote}
      onDownvote={onDownvote}
      onFavorite={onFavorite}
      onPress={onPress}
      showDelete={showDelete}
      onDelete={onDelete}
    />
  )
}

export default memo(LegacyDealCard, (prev, next) => (
  prev.deal.id === next.deal.id &&
  prev.deal.votes === next.deal.votes &&
  prev.deal.isUpvoted === next.deal.isUpvoted &&
  prev.deal.isDownvoted === next.deal.isDownvoted &&
  prev.deal.isFavorited === next.deal.isFavorited &&
  prev.variant === next.variant
))
