/**
 * useGutters.ts
 *
 * Hook for responsive gutter (padding) values.
 * Provides consistent spacing that adapts to screen size.
 *
 * Based on Bluesky's useGutters pattern.
 */

import { useMemo } from 'react'
import { useBreakpoints, Breakpoint } from '../breakpoints'
import * as tokens from '../tokens'

// ==========================================
// Gutter Types
// ==========================================

/** Gutter size presets */
export type Gutter = 'compact' | 'base' | 'wide' | 0

/** Resolved gutter values */
export interface Gutters {
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

// ==========================================
// Gutter Values by Breakpoint
// ==========================================

/**
 * Gutter values for each size preset at different breakpoints.
 * Values increase on larger screens.
 */
const gutterValues: Record<
  Exclude<Gutter, 0>,
  Record<Breakpoint | 'default', number>
> = {
  compact: {
    default: tokens.space.sm,      // 8px on mobile
    gtPhone: tokens.space.sm,      // 8px
    gtMobile: tokens.space.md,     // 12px on tablet
    gtTablet: tokens.space.md,     // 12px on desktop
  },
  base: {
    default: tokens.space.lg,      // 16px on mobile
    gtPhone: tokens.space.lg,      // 16px
    gtMobile: tokens.space.xl,     // 20px on tablet
    gtTablet: tokens.space.xl,     // 20px on desktop
  },
  wide: {
    default: tokens.space.xl,      // 20px on mobile
    gtPhone: tokens.space.xl,      // 20px
    gtMobile: tokens.space._3xl,   // 32px on tablet
    gtTablet: tokens.space._3xl,   // 32px on desktop
  },
}

// ==========================================
// Hook Overloads
// ==========================================

/**
 * Get gutters with the same value on all sides.
 *
 * @example
 * const gutters = useGutters(['base'])
 * // { paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16 }
 */
export function useGutters(args: [Gutter]): Gutters

/**
 * Get gutters with different vertical and horizontal values.
 *
 * @example
 * const gutters = useGutters(['compact', 'base'])
 * // { paddingTop: 8, paddingRight: 16, paddingBottom: 8, paddingLeft: 16 }
 */
export function useGutters(args: [Gutter, Gutter]): Gutters

/**
 * Get gutters with individual values for each side.
 *
 * @example
 * const gutters = useGutters(['compact', 'base', 'wide', 0])
 * // { paddingTop: 8, paddingRight: 16, paddingBottom: 20, paddingLeft: 0 }
 */
export function useGutters(args: [Gutter, Gutter, Gutter, Gutter]): Gutters

// ==========================================
// Hook Implementation
// ==========================================

export function useGutters(args: Gutter[]): Gutters {
  const { activeBreakpoint } = useBreakpoints()

  // Parse arguments (CSS-like shorthand)
  let [top, right, bottom, left] = args

  // Single value: all sides
  if (right === undefined) {
    right = bottom = left = top
  }
  // Two values: vertical, horizontal
  else if (bottom === undefined) {
    bottom = top
    left = right
  }
  // Three values: top, horizontal, bottom
  else if (left === undefined) {
    left = right
  }

  return useMemo(() => {
    const breakpoint = activeBreakpoint || 'default'

    return {
      paddingTop: top === 0 ? 0 : gutterValues[top][breakpoint],
      paddingRight: right === 0 ? 0 : gutterValues[right!][breakpoint],
      paddingBottom: bottom === 0 ? 0 : gutterValues[bottom!][breakpoint],
      paddingLeft: left === 0 ? 0 : gutterValues[left!][breakpoint],
    }
  }, [activeBreakpoint, top, right, bottom, left])
}

// ==========================================
// Static Helper
// ==========================================

/**
 * Get gutter value for a specific size and breakpoint.
 * Useful outside of React components.
 */
export function getGutterValue(
  size: Exclude<Gutter, 0>,
  breakpoint: Breakpoint | 'default' = 'default'
): number {
  return gutterValues[size][breakpoint]
}
