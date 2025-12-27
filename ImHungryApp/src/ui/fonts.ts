/**
 * fonts.ts
 *
 * Font configuration for the ImHungry app.
 * The app uses the Inter font family loaded via expo-google-fonts.
 */

// ==========================================
// Font Family
// ==========================================

/**
 * Font family names as loaded in App.tsx
 * These map to the Inter font variants.
 */
export const fontFamily = {
  light: 'Inter-Light',
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  // Default fallback
  default: 'Inter-Regular',
} as const

// ==========================================
// Font Scale
// ==========================================

/**
 * Font scale multiplier for accessibility.
 * Can be adjusted based on user preferences.
 */
export type FontScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const fontScaleMultipliers: Record<FontScale, number> = {
  xs: 0.85,
  sm: 0.925,
  md: 1.0,      // Default
  lg: 1.075,
  xl: 1.15,
}

/**
 * Get the font scale multiplier for a given scale setting.
 */
export function getFontScaleMultiplier(scale: FontScale = 'md'): number {
  return fontScaleMultipliers[scale]
}

// ==========================================
// Font Style Helpers
// ==========================================

/**
 * Create a font style object with the correct family and weight.
 * React Native requires fontFamily to include the weight variant.
 */
export function getFontStyle(weight: keyof typeof fontFamily = 'regular') {
  return {
    fontFamily: fontFamily[weight],
  }
}

// ==========================================
// Type Exports
// ==========================================

export type FontFamily = keyof typeof fontFamily
