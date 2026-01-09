import { Dimensions } from 'react-native'

/**
 * Breakpoint values (similar to Tailwind)
 */
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Get current screen width
 */
export function getScreenWidth(): number {
    return Dimensions.get('window').width
}

/**
 * Check if screen is at or above a breakpoint
 */
export function isAtBreakpoint(breakpoint: Breakpoint): boolean {
    return getScreenWidth() >= BREAKPOINTS[breakpoint]
}

/**
 * Check if screen is a mobile viewport
 */
export function isMobile(): boolean {
    return !isAtBreakpoint('md')
}

/**
 * Check if screen is a tablet viewport
 */
export function isTablet(): boolean {
    return isAtBreakpoint('md') && !isAtBreakpoint('lg')
}

/**
 * Check if screen is a desktop viewport
 */
export function isDesktop(): boolean {
    return isAtBreakpoint('lg')
}
