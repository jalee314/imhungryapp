/**
 * RowCard.tsx
 *
 * Row card component built on top of the base Card component.
 * Follows Bluesky's composable component patterns.
 *
 * Usage:
 *   import * as RowCard from '#/components/cards/RowCard'
 *
 *   // Pre-built variants
 *   <RowCard.ExploreDeal data={data} onPress={handlePress} />
 *   <RowCard.RestaurantDeal data={data} onPress={handlePress} />
 *   <RowCard.FavoritesDeal data={data} onPress={handlePress} />
 *
 *   // Composable parts using base Card
 *   <Card onPress={handlePress} padding="sm">
 *     <CardHeader>
 *       <RowCard.Image source={imageSource} />
 *       <CardBody>
 *         <RowCard.Title>{title}</RowCard.Title>
 *         <RowCard.Subtitle>{subtitle}</RowCard.Subtitle>
 *       </CardBody>
 *       <RowCard.Chevron />
 *     </CardHeader>
 *   </Card>
 */

import React, { ReactNode, useCallback } from 'react'
import {
  View,
  Text,
  Image as RNImage,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { atoms as a, ViewStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'
import { Card, CardHeader, CardBody } from './Card'
import { RowCardData, RowCardVariant } from '#/types'

// Re-export for backward compatibility
export type { RowCardData } from '#/types'

// ==========================================
// Row Image Component
// ==========================================

interface RowImageProps {
  source: ImageSourcePropType | string
  style?: StyleProp<ImageStyle>
}

export function RowImage({ source, style }: RowImageProps) {
  const imageSource = typeof source === 'string' ? { uri: source } : source

  return (
    <View style={[a.align_center, a.justify_center]}>
      <RNImage
        source={imageSource}
        style={[
          {
            width: 80,
            height: 80,
            borderRadius: tokens.radius.sm,
          },
          style,
        ]}
      />
    </View>
  )
}

// ==========================================
// Title Component
// ==========================================

interface TitleProps {
  children: ReactNode
  numberOfLines?: number
}

export function Title({ children, numberOfLines = 2 }: TitleProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '600',
        color: tokens.color.black,
        letterSpacing: -0.35,
        lineHeight: 17,
      }}
    >
      {children}
    </Text>
  )
}

// ==========================================
// Subtitle Component
// ==========================================

interface SubtitleProps {
  children: ReactNode
  numberOfLines?: number
}

export function Subtitle({ children, numberOfLines = 1 }: SubtitleProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '400',
        color: tokens.color.gray_600,
        letterSpacing: 0,
        lineHeight: 16,
      }}
    >
      {children}
    </Text>
  )
}

// ==========================================
// Chevron Component
// ==========================================

interface ChevronProps {
  color?: string
}

export function Chevron({ color = tokens.color.gray_500 }: ChevronProps) {
  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.self_stretch,
        {
          padding: 6,
          paddingLeft: 5,
          minWidth: 20,
        },
      ]}
    >
      <Ionicons name="chevron-forward" size={16} color={color} />
    </View>
  )
}

// ==========================================
// Content Container (for row layout)
// ==========================================

interface ContentProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function Content({ children, style }: ContentProps) {
  return (
    <View
      style={[
        a.flex_1,
        a.flex_col,
        a.justify_center,
        {
          gap: 4,
          height: 76,
          paddingRight: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

// ==========================================
// Pre-built Variants using base Card
// ==========================================

interface VariantProps {
  data: RowCardData
  onPress?: (id: string) => void
  onUserPress?: (userId: string) => void
  style?: StyleProp<ViewStyle>
}

/**
 * Explore deal card variant.
 * Shows posted date, expiration, and views.
 */
export function ExploreDeal({ data, onPress, style }: VariantProps) {
  const handlePress = useCallback(() => onPress?.(data.id), [data.id, onPress])

  return (
    <Card
      onPress={handlePress}
      padding="sm"
      elevation="none"
      style={[
        {
          marginHorizontal: 12,
          marginVertical: 4,
          height: 96,
        },
        style,
      ]}
    >
      <CardHeader style={{ marginBottom: 0, height: '100%' }}>
        <RowImage source={data.image} />
        <Content>
          <Title>{data.title}</Title>
          <Subtitle>
            Posted {data.postedDate} • {data.expiresIn} • {data.views} views
          </Subtitle>
        </Content>
        <Chevron color={tokens.color.gray_500} />
      </CardHeader>
    </Card>
  )
}

/**
 * Restaurant deal card variant.
 * Shows distance and deal count.
 */
export function RestaurantDeal({ data, onPress, style }: VariantProps) {
  const handlePress = useCallback(() => onPress?.(data.id), [data.id, onPress])

  return (
    <Card
      onPress={handlePress}
      padding="sm"
      elevation="none"
      style={[
        {
          marginHorizontal: 12,
          marginVertical: 4,
          height: 96,
        },
        style,
      ]}
    >
      <CardHeader style={{ marginBottom: 0, height: '100%' }}>
        <RowImage source={data.image} />
        <Content>
          <Title>{data.title}</Title>
          <Subtitle>
            {data.distance} • {data.dealCount} Deals
          </Subtitle>
        </Content>
        <Chevron color={tokens.color.black} />
      </CardHeader>
    </Card>
  )
}

/**
 * Favorites deal card variant.
 * Shows simple title and subtitle.
 */
export function FavoritesDeal({ data, onPress, style }: VariantProps) {
  const handlePress = useCallback(() => onPress?.(data.id), [data.id, onPress])

  return (
    <Card
      onPress={handlePress}
      padding="sm"
      elevation="none"
      style={[
        {
          marginHorizontal: 12,
          marginVertical: 4,
          height: 96,
        },
        style,
      ]}
    >
      <CardHeader style={{ marginBottom: 0, height: '100%' }}>
        <RowImage source={data.image} />
        <Content>
          <Title>{data.title}</Title>
          <Subtitle>{data.subtitle}</Subtitle>
        </Content>
        <Chevron color={tokens.color.black} />
      </CardHeader>
    </Card>
  )
}

// ==========================================
// Legacy Export for Backwards Compatibility
// ==========================================

interface LegacyRowCardProps {
  data: RowCardData
  variant: RowCardVariant
  onPress?: (id: string) => void
  onUserPress?: (userId: string) => void
  style?: StyleProp<ViewStyle>
}

/**
 * @deprecated Use RowCard.ExploreDeal, RowCard.RestaurantDeal, or RowCard.FavoritesDeal instead
 */
function LegacyRowCard({ data, variant, onPress, onUserPress, style }: LegacyRowCardProps) {
  switch (variant) {
    case 'explore-deal-card':
      return <ExploreDeal data={data} onPress={onPress} onUserPress={onUserPress} style={style} />
    case 'rest-deal':
      return <RestaurantDeal data={data} onPress={onPress} style={style} />
    case 'favorites-deal-card':
      return <FavoritesDeal data={data} onPress={onPress} style={style} />
    default:
      return null
  }
}

export default LegacyRowCard
