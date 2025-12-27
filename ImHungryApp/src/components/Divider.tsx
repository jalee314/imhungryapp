/**
 * Divider.tsx
 *
 * Horizontal divider/separator component.
 *
 * Usage:
 *   import { Divider } from '#/components/Divider'
 *
 *   <Divider />
 *   <Divider spacing="lg" />
 */

import React from 'react'
import { View } from 'react-native'

import { atoms as a, useTheme, ViewStyleProp } from '#/ui'

// ==========================================
// Types
// ==========================================

interface DividerProps extends ViewStyleProp {
  /** Vertical spacing around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

const spacingStyles = {
  none: {},
  sm: a.my_sm,
  md: a.my_md,
  lg: a.my_lg,
}

// ==========================================
// Component
// ==========================================

/**
 * Horizontal divider line.
 */
export function Divider({ spacing = 'none', style }: DividerProps) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.border_t,
        t.atoms.border_contrast_low,
        spacingStyles[spacing],
        style,
      ]}
    />
  )
}
