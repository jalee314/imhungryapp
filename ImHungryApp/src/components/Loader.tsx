/**
 * Loader.tsx
 *
 * Loading indicator component.
 *
 * Usage:
 *   import { Loader } from '#/components/Loader'
 *
 *   <Loader /> // Default
 *   <Loader size="lg" color="primary" />
 */

import React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { atoms as a, useTheme, ViewStyleProp } from '#/ui'
import * as tokens from '#/ui/tokens'

// ==========================================
// Types
// ==========================================

export type LoaderSize = 'sm' | 'md' | 'lg'

export interface LoaderProps extends ViewStyleProp {
  /** Size of the loader */
  size?: LoaderSize
  /** Color variant */
  color?: 'primary' | 'secondary' | 'muted' | 'white'
  /** Center the loader in its container */
  center?: boolean
}

// ==========================================
// Size Mapping
// ==========================================

const sizeMap: Record<LoaderSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
}

// ==========================================
// Component
// ==========================================

/**
 * Loading spinner indicator.
 */
export function Loader({
  size = 'md',
  color = 'primary',
  center = false,
  style,
}: LoaderProps) {
  const t = useTheme()

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return t.palette.primary
      case 'secondary':
        return t.palette.text_secondary
      case 'muted':
        return t.palette.text_muted
      case 'white':
        return tokens.color.white
      default:
        return t.palette.primary
    }
  }

  const indicator = (
    <ActivityIndicator size={sizeMap[size]} color={getColor()} />
  )

  if (center) {
    return (
      <View style={[a.flex_1, a.justify_center, a.align_center, style]}>
        {indicator}
      </View>
    )
  }

  return indicator
}

// ==========================================
// Full Screen Loader
// ==========================================

interface FullScreenLoaderProps extends LoaderProps {
  /** Background color for loading screen */
  background?: 'default' | 'brand'
}

/**
 * Full screen loading indicator.
 * Useful for initial app loading states.
 */
export function FullScreenLoader({
  background = 'default',
  ...props
}: FullScreenLoaderProps) {
  const t = useTheme()

  const bgColor =
    background === 'brand'
      ? { backgroundColor: tokens.color.primary_100 }
      : t.atoms.bg

  return (
    <View style={[a.flex_1, a.justify_center, a.align_center, bgColor]}>
      <Loader size="lg" {...props} />
    </View>
  )
}
