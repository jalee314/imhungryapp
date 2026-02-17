/**
 * ALF Design Tokens
 * 
 * Raw design primitives that define the visual language of the app.
 * These tokens are the foundation for themes and should not be used
 * directly in components - use themes instead.
 * 
 * Inspired by Bluesky's ALF (Atomic Layout Framework).
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Brand colors - The primary visual identity
 */
export const BRAND = {
  primary: '#FF8C4C',
  primaryLight: '#FFB088',
  primaryDark: '#E57A3A',
  accent: '#FFA05C',
} as const;

/**
 * Grayscale palette for text, backgrounds, and borders
 */
export const GRAY = {
  50: '#FAFAFA',
  75: '#F8F8F8',
  100: '#F5F5F5',
  150: '#F0F0F0',
  200: '#EEEEEE',
  250: '#DEDEDE',
  300: '#E0E0E0',
  325: '#D7D7D7',
  350: '#C1C1C1',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  1000: '#121212',
} as const;

/**
 * Semantic colors for feedback and status
 */
export const SEMANTIC = {
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  
  error: '#F44336',
  errorLight: '#E57373',
  errorDark: '#D32F2F',
  
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
} as const;

/**
 * Static colors that don't change with theme
 */
export const STATIC = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/**
 * Semi-transparent / alpha color variants
 * Use these for overlays, translucent cards, and placeholder text
 */
export const ALPHA_COLORS = {
  brandPrimary80: 'rgba(255, 140, 76, 0.8)',
  whiteOverlay70: 'rgba(255, 255, 255, 0.7)',
  whiteCard93: 'rgba(255, 255, 255, 0.93)',
  placeholderGray: 'rgba(60, 60, 67, 0.6)',
  nearBlack: 'rgba(12, 12, 13, 1)',
  /** Heavy overlay used by bottom-sheet modals */
  blackOverlay80: 'rgba(0, 0, 0, 0.8)',
} as const;

// ============================================================================
// SPACING
// ============================================================================

/**
 * Spacing scale based on 4px grid
 * Use these values for margins, paddings, and gaps
 */
export const SPACING = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Font families
 */
export const FONT_FAMILY = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
} as const;

/**
 * Font sizes following a modular scale
 */
export const FONT_SIZE = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

/**
 * Font weights
 */
export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Line heights (multipliers)
 */
export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Letter spacing
 */
export const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// ============================================================================
// BORDERS & RADII
// ============================================================================

/**
 * Border radius values
 */
export const RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  card: 10,
  lg: 12,
  xl: 16,
  circle: 20,
  '2xl': 24,
  pill: 30,
  full: 9999,
} as const;

/**
 * Border widths
 */
export const BORDER_WIDTH = {
  none: 0,
  hairline: 0.5,
  thin: 1,
  medium: 2,
  thick: 4,
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

/**
 * Shadow definitions for elevation
 * Compatible with React Native's shadow properties
 */
export const SHADOW = {
  none: {
    shadowColor: STATIC.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: STATIC.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: STATIC.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: STATIC.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: STATIC.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

/**
 * Animation durations in milliseconds
 */
export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
} as const;

/**
 * Common easing functions (for use with Animated API)
 */
export const EASING = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  loader: 1000,
} as const;

// ============================================================================
// OPACITY
// ============================================================================

/**
 * Opacity values for common UI states
 */
export const OPACITY = {
  disabled: 0.5,
  overlay: 0.7,
  active: 0.8,
  card: 0.93,
  full: 1,
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

/**
 * Standard icon sizes
 */
export const ICON_SIZE = {
  sm: 20,
  md: 24,
} as const;

// ============================================================================
// TIMING
// ============================================================================

/**
 * Timing constants for UX interactions (in milliseconds)
 */
export const TIMING = {
  focusDelay: 100,
  closeDelay: 200,
  debounce: 500,
  locationTimeout: 5000,
} as const;

// ============================================================================
// COMPONENT DIMENSIONS
// ============================================================================

/**
 * Reusable component dimension values
 */
export const DIMENSION = {
  hitArea: 40,
  searchBarHeight: 48,
  restaurantBarHeight: 59,
  buttonMinWidth: 90,
  formMinHeight: 600,
  extraScrollHeight: 120,
  compactLineHeight: 17,
  scrollTitleFocusY: 100,
  scrollDetailsFocusY: 300,
  /** Profile avatar displayed on the header row */
  profilePhoto: 85,
  /** Skeleton placeholder for profile photo */
  profilePhotoSkeleton: 75,
  /** Header row height on profile page */
  profileHeaderHeight: 117,
} as const;

// ============================================================================
// CAMERA
// ============================================================================

/**
 * Camera configuration constants
 */
export const CAMERA = {
  quality: 0.7,
  aspectRatio: [4, 3] as const,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BrandColor = keyof typeof BRAND;
export type GrayColor = keyof typeof GRAY;
export type SemanticColor = keyof typeof SEMANTIC;
export type StaticColor = keyof typeof STATIC;
export type AlphaColor = keyof typeof ALPHA_COLORS;
export type SpacingKey = keyof typeof SPACING;
export type FontSizeKey = keyof typeof FONT_SIZE;
export type FontWeightKey = keyof typeof FONT_WEIGHT;
export type RadiusKey = keyof typeof RADIUS;
export type ShadowKey = keyof typeof SHADOW;
export type DurationKey = keyof typeof DURATION;
export type ZIndexKey = keyof typeof Z_INDEX;
export type OpacityKey = keyof typeof OPACITY;
export type IconSizeKey = keyof typeof ICON_SIZE;
export type TimingKey = keyof typeof TIMING;
export type DimensionKey = keyof typeof DIMENSION;
export type CameraKey = keyof typeof CAMERA;