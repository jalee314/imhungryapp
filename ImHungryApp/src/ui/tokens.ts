/**
 * tokens.ts
 *
 * Design tokens for the ImHungry app.
 * These are the raw values used throughout the design system.
 *
 * Based on Bluesky's ALF pattern but customized for ImHungry's brand.
 * All spacing follows a 4px base grid for visual consistency.
 *
 * ===========================================================
 * COLOR REFERENCE (extracted from existing implementation):
 * ===========================================================
 *
 * PRIMARY COLORS:
 *   #FFA05C (primary_500) - Accent color, retry buttons (Feed.tsx)
 *   #FF8C4C (primary_600) - Auth buttons, filter selections (SignUp.tsx, CuisineFilter.tsx)
 *   #FFE5B4 (primary_100) - Peach background
 *
 * TEXT COLORS:
 *   #181619 (text_primary) - Primary text (SignUp.tsx)
 *   #1D1B20 (text_dark)    - Icon dark (Header.tsx)
 *   #333333 (gray_800)     - Dark text (Header.tsx locationText)
 *   #404040 (gray_700)     - Secondary text (SignUp.tsx)
 *   #666666 (gray_600)     - Muted text (Feed.tsx empty/error)
 *   #757575 (gray_500)     - Details text (DealCard.tsx)
 *   #999999 (gray_400)     - Subtext (Feed.tsx emptySubtext)
 *
 * BORDER COLORS:
 *   #D7D7D7 (gray_300) - Default border (DealCard, CuisineFilter, VoteButtons)
 *   #DEDEDE (gray_200) - Light border (Header, separators)
 *
 * BACKGROUND COLORS:
 *   #FFFFFF (white)    - Primary background
 *   #F7F4F4 (gray_100) - Card/vote container background (DealCard)
 *   #F9F9F9 (gray_50)  - Secondary background
 *
 * SEMANTIC:
 *   #FF1E00 (favorite_red) - Favorited heart icon
 */

// ==========================================
// Color Palette
// ==========================================

/**
 * Brand colors specific to ImHungry
 *
 * These values are extracted from the existing app implementation
 * to ensure visual consistency during migration.
 */
export const color = {
  // Primary brand colors (orange/peach tones)
  // Note: primary_500 is the main accent, primary_600 is used for buttons/selections
  primary_50: '#FFF5EB',
  primary_100: '#FFE5B4',   // Peach background
  primary_200: '#FFD494',
  primary_300: '#FFC274',
  primary_400: '#FFB064',
  primary_500: '#FFA05C',   // Primary brand orange (accent, retry buttons)
  primary_600: '#FF8C4C',   // Button/selection background (filters, auth buttons)
  primary_700: '#E87A3C',
  primary_800: '#D16830',
  primary_900: '#B85624',

  // Neutral grays - exact values from existing implementation
  gray_0: '#FFFFFF',
  gray_25: '#FDFDFD',
  gray_50: '#F9F9F9',
  gray_100: '#F7F4F4',      // Card/vote container background (from DealCard)
  gray_200: '#DEDEDE',      // Border light (from Header, DealCard separators)
  gray_300: '#D7D7D7',      // Default border (from DealCard, CuisineFilter)
  gray_400: '#999999',      // Subtext/caption color
  gray_500: '#757575',      // Muted text (from DealCard details)
  gray_600: '#666666',      // Secondary muted text (from Feed error/empty)
  gray_700: '#404040',      // Secondary text (from SignUp)
  gray_800: '#333333',      // Dark text (from Header location)
  gray_900: '#181619',      // Primary text (from SignUp)
  gray_1000: '#000000',

  // Special grays for specific uses
  // 1D1B20 is used in Header for location icon - very close to gray_900
  text_primary: '#181619',  // Primary text color
  text_dark: '#1D1B20',     // Slightly different dark (Header icon)

  // Semantic colors
  success_500: '#22C55E',
  success_600: '#16A34A',
  warning_500: '#F59E0B',
  warning_600: '#D97706',
  error_500: '#EF4444',
  error_600: '#DC2626',
  favorite_red: '#FF1E00',  // Heart icon when favorited

  // Special UI colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

// ==========================================
// Spacing Scale (4px base grid)
// ==========================================

/**
 * Spacing scale following a 4px base grid.
 * Use these for padding, margin, and gap values.
 */
export const space = {
  _2xs: 2,   // 2px - micro spacing
  xs: 4,     // 4px - extra small
  sm: 8,     // 8px - small
  md: 12,    // 12px - medium
  lg: 16,    // 16px - large (1 rem equivalent)
  xl: 20,    // 20px - extra large
  _2xl: 24,  // 24px
  _3xl: 32,  // 32px
  _4xl: 40,  // 40px
  _5xl: 48,  // 48px
  _6xl: 64,  // 64px
} as const

// ==========================================
// Border Radius
// ==========================================

/**
 * Border radius scale for consistent rounded corners.
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,  // Fully rounded (pill shape)
} as const

// ==========================================
// Font Sizes
// ==========================================

/**
 * Font size scale.
 * Uses rem-like sizing where base (md) = 16px.
 */
export const fontSize = {
  _2xs: 10,
  xs: 12,
  sm: 14,
  md: 16,   // Base size
  lg: 18,
  xl: 20,
  _2xl: 24,
  _3xl: 28,
  _4xl: 32,
  _5xl: 40,
} as const

// ==========================================
// Line Heights
// ==========================================

/**
 * Line height multipliers for text readability.
 * Applied as multipliers to font size.
 */
export const lineHeight = {
  none: 1,
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const

// ==========================================
// Font Weights
// ==========================================

/**
 * Font weight values for Inter font family.
 */
export const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

// ==========================================
// Shadows
// ==========================================

/**
 * Shadow definitions for elevation.
 * iOS and Android have different shadow implementations,
 * so we define both properties.
 */
export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: color.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const

// ==========================================
// Z-Index Scale
// ==========================================

/**
 * Z-index values for consistent layering.
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
} as const

// ==========================================
// Type Exports
// ==========================================

export type Color = keyof typeof color
export type Space = keyof typeof space
export type Radius = keyof typeof radius
export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type FontWeight = keyof typeof fontWeight
