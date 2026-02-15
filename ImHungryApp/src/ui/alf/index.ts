/**
 * ALF - Atomic Layout Framework
 * 
 * A styling foundation inspired by Bluesky's ALF, providing:
 * - Design tokens (colors, spacing, typography, etc.)
 * - Theme definitions (light/dark themes)
 * - Atomic style primitives for composition
 * 
 * Usage:
 * ```tsx
 * import { tokens, themes, atoms, flex, p, gap } from '@/ui/alf';
 * 
 * // Use tokens for raw values
 * const color = tokens.BRAND.primary;
 * 
 * // Use theme palette for semantic colors
 * const backgroundColor = themes.lightTheme.palette.background;
 * 
 * // Compose atomic styles
 * const containerStyle = [flex.flex1, p.lg, gap.md];
 * ```
 */

// ============================================================================
// TOKENS
// ============================================================================

export {
  // Color Palettes
  BRAND,
  GRAY,
  SEMANTIC,
  STATIC,
  // Spacing & Layout
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  SHADOW,
  Z_INDEX,
  // Typography
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  LETTER_SPACING,
  // Animation
  DURATION,
  EASING,
  // Types
  type BrandColor,
  type GrayColor,
  type SemanticColor,
  type StaticColor,
  type SpacingKey,
  type FontSizeKey,
  type FontWeightKey,
  type RadiusKey,
  type ShadowKey,
  type DurationKey,
  type ZIndexKey,
} from './tokens';

// Re-export all tokens as a namespace
import * as tokens from './tokens';
export { tokens };

// ============================================================================
// THEMES
// ============================================================================

export {
  // Theme objects
  lightTheme,
  darkTheme,
  defaultTheme,
  // Theme helpers
  getTheme,
  themeHelpers,
  // Types
  type Theme,
  type ThemePalette,
  type ThemeName,
  type PaletteKey,
} from './themes';

// Re-export all themes as a namespace
import * as themes from './themes';
export { themes };

// ============================================================================
// ATOMS
// ============================================================================

export {
  // Flex
  flex,
  flexDirection,
  flexWrap,
  // Alignment
  align,
  justify,
  alignSelf,
  // Layout
  position,
  overflow,
  display,
  // Sizing
  width,
  height,
  // Margin
  m,
  mt,
  mb,
  ml,
  mr,
  mx,
  my,
  // Padding
  p,
  pt,
  pb,
  pl,
  pr,
  px,
  py,
  // Gaps
  gap,
  rowGap,
  colGap,
  // Borders
  rounded,
  border,
  // Typography
  text,
  font,
  leading,
  textAlign,
  // Common patterns
  atoms,
  // Utility functions
  spacing,
  lineHeight,
  inset,
  compose,
} from './atoms';

// Re-export all atoms as a namespace
import * as atomStyles from './atoms';
export { atomStyles };
