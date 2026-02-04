/**
 * Theme System - Main Entry Point
 * 
 * Exports all design tokens and provides a useTheme hook
 * for accessing the theme in components.
 */

import { useMemo } from 'react';
import { colors, type ColorToken } from './colors';
import { spacing, getSpacing, type SpacingToken } from './spacing';
import { 
  fontFamily, 
  fontSize, 
  fontWeight, 
  lineHeight, 
  textVariants,
  type FontFamilyToken,
  type FontSizeToken,
  type TextVariant,
} from './typography';
import { 
  borderRadius, 
  borderWidth, 
  iconSize, 
  avatarSize, 
  zIndex, 
  shadows,
  type BorderRadiusToken,
  type IconSizeToken,
  type AvatarSizeToken,
  type ShadowToken,
} from './layout';

// Re-export everything
export { colors, type ColorToken } from './colors';
export { spacing, getSpacing, type SpacingToken } from './spacing';
export { 
  fontFamily, 
  fontSize, 
  fontWeight, 
  lineHeight, 
  textVariants,
  type FontFamilyToken,
  type FontSizeToken,
  type TextVariant,
} from './typography';

/**
 * Grouped typography object for convenience
 */
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} as const;
export { 
  borderRadius, 
  borderWidth, 
  iconSize, 
  avatarSize, 
  zIndex, 
  shadows,
  type BorderRadiusToken,
  type IconSizeToken,
  type AvatarSizeToken,
  type ShadowToken,
} from './layout';

/**
 * Complete theme object
 */
export const theme = {
  colors,
  spacing,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textVariants,
  borderRadius,
  borderWidth,
  iconSize,
  avatarSize,
  zIndex,
  shadows,
} as const;

export type Theme = typeof theme;

/**
 * Hook to access theme values
 * 
 * @example
 * const { colors, spacing } = useTheme();
 * <View style={{ backgroundColor: colors.primary, padding: spacing.m }} />
 */
export const useTheme = () => {
  return useMemo(() => theme, []);
};

/**
 * Helper to create styles using theme tokens
 * (Similar to StyleSheet.create but with token access)
 */
export const createThemedStyles = <T extends Record<string, any>>(
  styleFactory: (t: Theme) => T
): T => {
  return styleFactory(theme);
};
