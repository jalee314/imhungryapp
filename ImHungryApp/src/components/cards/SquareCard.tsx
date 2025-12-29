/**
 * SquareCard.tsx
 *
 * Square card component built on top of the base Card component.
 * Follows Bluesky's composable component patterns.
 *
 * Usage:
 *   import * as SquareCard from '#/components/cards/SquareCard'
 *
 *   // Default usage
 *   <SquareCard.Default data={data} onPress={handlePress} />
 *
 *   // Composable parts using base Card
 *   <Card onPress={handlePress} padding="none">
 *     <CardImage aspectRatio="square">
 *       <Image source={imageSource} />
 *     </CardImage>
 *     <CardBody>
 *       <SquareCard.Title>{title}</SquareCard.Title>
 *       <SquareCard.Subtitle>{subtitle}</SquareCard.Subtitle>
 *     </CardBody>
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

import { atoms as a } from '#/ui'
import * as tokens from '#/ui/tokens'
import { Card, CardBody, CardImage } from './Card'

// ==========================================
// Constants
// ==========================================

const CARD_WIDTH = 107
const CARD_HEIGHT = 124
const IMAGE_SIZE = 80

// ==========================================
// Types
// ==========================================

export interface SquareCardData {
  id: string
  title: string
  subtitle: string
  image: string | ImageSourcePropType
  distance?: string
  dealCount?: number
}

// ==========================================
// Square Image Component
// ==========================================

interface SquareImageProps {
  source: ImageSourcePropType | string
  style?: StyleProp<ImageStyle>
}

export function SquareImage({ source, style }: SquareImageProps) {
  const imageSource = typeof source === 'string' ? { uri: source } : source

  return (
    <CardImage
      aspectRatio="square"
      style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, aspectRatio: undefined, marginBottom: 0 }}
    >
      <RNImage
        source={imageSource}
        style={[{ width: '100%', height: '100%', resizeMode: 'cover' }, style]}
      />
    </CardImage>
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
        fontSize: 12,
        fontWeight: 'bold',
        color: tokens.color.black,
        textAlign: 'center',
        marginBottom: 0,
        lineHeight: 14,
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
        fontSize: 10,
        color: tokens.color.black,
        textAlign: 'center',
        lineHeight: 12,
      }}
    >
      {children}
    </Text>
  )
}

// ==========================================
// Pre-built Default Component using base Card
// ==========================================

interface DefaultProps {
  data: SquareCardData
  onPress?: (id: string) => void
  style?: StyleProp<ViewStyle>
}

export function Default({ data, onPress, style }: DefaultProps) {
  const handlePress = useCallback(() => onPress?.(data.id), [data.id, onPress])

  const subtitle = data.distance && data.dealCount
    ? `${data.distance} • ${data.dealCount} Deals`
    : data.subtitle

  return (
    <Card
      onPress={handlePress}
      padding="none"
      elevation="none"
      style={[
        a.align_center,
        a.justify_between,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderWidth: 0.5,
          borderColor: tokens.color.gray_500,
          padding: 4,
          marginBottom: 16,
        },
        style,
      ]}
    >
      <SquareImage source={data.image} />

      <CardBody style={[a.w_full, a.align_center, { gap: 0 }]}>
        <Title>{data.title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </CardBody>
    </Card>
  )
}

// ==========================================
// Legacy Export for Backwards Compatibility
// ==========================================

interface LegacySquareCardProps {
  data: SquareCardData
  onPress?: (id: string) => void
}

/**
 * @deprecated Use SquareCard.Default instead
 */
function LegacySquareCard({ data, onPress }: LegacySquareCardProps) {
  return <Default data={data} onPress={onPress} />
}

export default LegacySquareCard
