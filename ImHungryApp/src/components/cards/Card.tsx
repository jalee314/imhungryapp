/**
 * Card.tsx
 *
 * Base card component using the ui system.
 * This serves as a foundation for building card variants.
 *
 * Usage:
 *   import { Card, CardHeader, CardBody, CardFooter } from '#/components/cards'
 *
 *   <Card>
 *     <CardHeader>
 *       <Text>Title</Text>
 *     </CardHeader>
 *     <CardBody>
 *       <Text>Content</Text>
 *     </CardBody>
 *     <CardFooter>
 *       <Button>Action</Button>
 *     </CardFooter>
 *   </Card>
 */

import React, { ReactNode } from 'react'
import { View, Pressable, PressableProps } from 'react-native'

import { atoms as a, useTheme, ViewStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'

// ==========================================
// Card Container
// ==========================================

interface CardProps extends ViewStyleProp {
  children: ReactNode
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Elevation/shadow level */
  elevation?: 'none' | 'sm' | 'md' | 'lg'
  /** Card is pressable */
  onPress?: PressableProps['onPress']
}

const paddingMap = {
  none: {},
  sm: a.p_sm,
  md: a.p_md,
  lg: a.p_lg,
}

/**
 * Base card container.
 */
export function Card({
  children,
  style,
  padding = 'md',
  elevation = 'sm',
  onPress,
}: CardProps) {
  const t = useTheme()

  const cardStyle = [
    t.atoms.bg,
    a.rounded_lg,
    a.overflow_hidden,
    paddingMap[padding],
    elevation !== 'none' && t.atoms[`shadow_${elevation}` as keyof typeof t.atoms],
    style,
  ]

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { opacity: 0.9 },
        ]}
      >
        {children}
      </Pressable>
    )
  }

  return <View style={cardStyle}>{children}</View>
}

// ==========================================
// Card Header
// ==========================================

interface CardHeaderProps extends ViewStyleProp {
  children: ReactNode
}

/**
 * Card header section.
 * Use for titles, avatars, metadata.
 */
export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.mb_sm, style]}>
      {children}
    </View>
  )
}

// ==========================================
// Card Body
// ==========================================

interface CardBodyProps extends ViewStyleProp {
  children: ReactNode
}

/**
 * Main card content area.
 */
export function CardBody({ children, style }: CardBodyProps) {
  return <View style={[a.gap_xs, style]}>{children}</View>
}

// ==========================================
// Card Footer
// ==========================================

interface CardFooterProps extends ViewStyleProp {
  children: ReactNode
}

/**
 * Card footer for actions, stats, etc.
 */
export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <View
      style={[a.flex_row, a.align_center, a.justify_between, a.mt_sm, style]}
    >
      {children}
    </View>
  )
}

// ==========================================
// Card Image
// ==========================================

interface CardImageProps extends ViewStyleProp {
  children: ReactNode
  /** Aspect ratio preset */
  aspectRatio?: 'square' | 'video' | 'wide'
}

const aspectRatios = {
  square: 1,
  video: 16 / 9,
  wide: 2,
}

/**
 * Image container with aspect ratio control.
 */
export function CardImage({
  children,
  style,
  aspectRatio = 'video',
}: CardImageProps) {
  return (
    <View
      style={[
        a.w_full,
        a.rounded_md,
        a.overflow_hidden,
        a.mb_sm,
        { aspectRatio: aspectRatios[aspectRatio] },
        style,
      ]}
    >
      {children}
    </View>
  )
}
