/**
 * Skeleton.tsx
 *
 * Skeleton loading placeholders following Bluesky's pattern.
 *
 * Usage:
 *   import * as Skeleton from '#/components/Skeleton'
 *
 *   <Skeleton.Row>
 *     <Skeleton.Circle size={40} />
 *     <Skeleton.Col>
 *       <Skeleton.Text width="60%" />
 *       <Skeleton.Text width="40%" />
 *     </Skeleton.Col>
 *   </Skeleton.Row>
 */

import React, { ReactNode, useEffect, useRef } from 'react'
import { View, Animated, DimensionValue } from 'react-native'

import { atoms as a, useTheme, ViewStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'

// ==========================================
// Shared Animation
// ==========================================

/**
 * Hook for skeleton shimmer animation.
 */
function useSkeletonAnimation() {
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return opacity
}

// ==========================================
// Base Skeleton Box
// ==========================================

interface BoxProps extends ViewStyleProp {
  /** Width (number for pixels, string for percentage) */
  width?: DimensionValue
  /** Height in pixels */
  height?: number
  /** Make fully rounded (for circles) */
  rounded?: boolean
}

/**
 * Base skeleton box element.
 */
export function Box({ width, height, rounded, style }: BoxProps) {
  const t = useTheme()
  const opacity = useSkeletonAnimation()

  return (
    <Animated.View
      style={[
        t.atoms.bg_contrast_100,
        rounded ? a.rounded_full : a.rounded_sm,
        { opacity, width, height },
        style,
      ]}
    />
  )
}

// ==========================================
// Text Skeleton
// ==========================================

interface TextProps extends ViewStyleProp {
  /** Width of the text line */
  width?: DimensionValue
  /** Text size preset */
  size?: 'sm' | 'md' | 'lg'
}

const textHeights = {
  sm: 12,
  md: 14,
  lg: 18,
}

/**
 * Skeleton for text content.
 */
export function Text({ width = '100%', size = 'md', style }: TextProps) {
  const t = useTheme()
  const opacity = useSkeletonAnimation()

  return (
    <View style={[a.py_2xs, { width }, style]}>
      <Animated.View
        style={[
          a.rounded_xs,
          t.atoms.bg_contrast_100,
          { opacity, height: textHeights[size] },
        ]}
      />
    </View>
  )
}

// ==========================================
// Circle Skeleton
// ==========================================

interface CircleProps extends ViewStyleProp {
  /** Diameter of the circle */
  size: number
  children?: ReactNode
}

/**
 * Circular skeleton (for avatars).
 */
export function Circle({ size, children, style }: CircleProps) {
  const t = useTheme()
  const opacity = useSkeletonAnimation()

  return (
    <Animated.View
      style={[
        a.rounded_full,
        a.justify_center,
        a.align_center,
        t.atoms.bg_contrast_100,
        { opacity, width: size, height: size },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )
}

// ==========================================
// Layout Containers
// ==========================================

interface LayoutProps extends ViewStyleProp {
  children: ReactNode
  /** Gap between items */
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

const gapStyles = {
  xs: a.gap_xs,
  sm: a.gap_sm,
  md: a.gap_md,
  lg: a.gap_lg,
}

/**
 * Horizontal row container.
 */
export function Row({ children, gap = 'sm', style }: LayoutProps) {
  return (
    <View style={[a.flex_row, a.align_center, gap && gapStyles[gap], style]}>
      {children}
    </View>
  )
}

/**
 * Vertical column container.
 */
export function Col({ children, gap = 'xs', style }: LayoutProps) {
  return (
    <View style={[a.flex_1, gap && gapStyles[gap], style]}>
      {children}
    </View>
  )
}

// ==========================================
// Card Skeleton
// ==========================================

interface CardSkeletonProps extends ViewStyleProp {
  /** Include image placeholder */
  hasImage?: boolean
  /** Aspect ratio for image */
  imageRatio?: 'square' | 'video'
  /** Number of text lines */
  lines?: number
}

/**
 * Pre-composed card skeleton.
 */
export function Card({
  hasImage = true,
  imageRatio = 'video',
  lines = 2,
  style,
}: CardSkeletonProps) {
  const t = useTheme()

  const aspectRatio = imageRatio === 'square' ? 1 : 16 / 9

  return (
    <View style={[t.atoms.bg, a.rounded_lg, a.p_md, style]}>
      {hasImage && (
        <Box
          style={[a.w_full, a.rounded_md, a.mb_md, { aspectRatio }]}
          height={undefined}
        />
      )}
      <Col gap="xs">
        <Text width="80%" size="lg" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <Text key={i} width={`${60 + Math.random() * 30}%`} />
        ))}
      </Col>
    </View>
  )
}
