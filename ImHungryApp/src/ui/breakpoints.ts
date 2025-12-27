/**
 * breakpoints.ts
 *
 * Responsive breakpoints for the ImHungry app.
 * Based on common device widths.
 *
 * Usage:
 *   const { gtMobile, gtTablet } = useBreakpoints()
 *   if (gtMobile) { // render tablet/desktop UI }
 */

import { useWindowDimensions } from 'react-native'

// ==========================================
// Breakpoint Values
// ==========================================

/**
 * Breakpoint width values in pixels.
 * These represent the minimum width for each category.
 */
export const breakpoints = {
  phone: 0,       // 0-599px (default mobile)
  mobile: 600,    // 600-767px (large phones, small tablets)
  tablet: 768,    // 768-1023px (tablets)
  desktop: 1024,  // 1024px+ (desktops)
} as const

// ==========================================
// Breakpoint Types
// ==========================================

export type Breakpoint = 'gtPhone' | 'gtMobile' | 'gtTablet'

export interface BreakpointState {
  /** Screen width >= 600px (larger than typical phone) */
  gtPhone: boolean
  /** Screen width >= 768px (tablet and up) */
  gtMobile: boolean
  /** Screen width >= 1024px (desktop) */
  gtTablet: boolean
  /** The name of the active breakpoint */
  activeBreakpoint: Breakpoint | 'default'
}

// ==========================================
// Breakpoint Hook
// ==========================================

/**
 * Hook to get current breakpoint state.
 * Updates automatically when screen size changes.
 *
 * @example
 * const { gtMobile, gtTablet } = useBreakpoints()
 *
 * return (
 *   <View style={[styles.container, gtMobile && styles.containerWide]}>
 *     {gtTablet ? <DesktopNav /> : <MobileNav />}
 *   </View>
 * )
 */
export function useBreakpoints(): BreakpointState {
  const { width } = useWindowDimensions()

  const gtPhone = width >= breakpoints.mobile
  const gtMobile = width >= breakpoints.tablet
  const gtTablet = width >= breakpoints.desktop

  // Determine the active breakpoint name
  let activeBreakpoint: BreakpointState['activeBreakpoint'] = 'default'
  if (gtTablet) {
    activeBreakpoint = 'gtTablet'
  } else if (gtMobile) {
    activeBreakpoint = 'gtMobile'
  } else if (gtPhone) {
    activeBreakpoint = 'gtPhone'
  }

  return {
    gtPhone,
    gtMobile,
    gtTablet,
    activeBreakpoint,
  }
}

// ==========================================
// Static Breakpoint Helpers
// ==========================================

/**
 * Check if a given width exceeds a breakpoint.
 * Useful for non-hook contexts (like StyleSheet creation).
 */
export function isBreakpoint(width: number, breakpoint: keyof typeof breakpoints): boolean {
  return width >= breakpoints[breakpoint]
}

/**
 * Get responsive value based on current width.
 * Returns the value for the largest matching breakpoint.
 *
 * @example
 * const padding = getResponsiveValue(width, {
 *   default: 16,
 *   gtMobile: 24,
 *   gtTablet: 32,
 * })
 */
export function getResponsiveValue<T>(
  width: number,
  values: {
    default: T
    gtPhone?: T
    gtMobile?: T
    gtTablet?: T
  }
): T {
  if (width >= breakpoints.desktop && values.gtTablet !== undefined) {
    return values.gtTablet
  }
  if (width >= breakpoints.tablet && values.gtMobile !== undefined) {
    return values.gtMobile
  }
  if (width >= breakpoints.mobile && values.gtPhone !== undefined) {
    return values.gtPhone
  }
  return values.default
}
