/**
 * Text Primitive
 * 
 * A styled Text component that provides convenient props for typography.
 * Supports all Text props plus shorthand props for font sizes, weights,
 * colors, and alignment.
 * 
 * Usage:
 * ```tsx
 * import { Text } from '@/ui/primitives';
 * 
 * <Text size="lg" weight="bold" color="text">
 *   Hello World
 * </Text>
 * ```
 */

import React, { forwardRef, useMemo } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
  StyleProp,
} from 'react-native';

import { ThemePalette } from '../alf/themes';
import {
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  SpacingKey,
  FontSizeKey,
  FontWeightKey,
} from '../alf/tokens';

import { useThemeSafe } from './ThemeProvider';

// ============================================================================
// TYPE HELPERS
// ============================================================================

type SpacingValue = SpacingKey | number;
type FontSizeValue = FontSizeKey | number;
type FontWeightValue = FontWeightKey;
type LineHeightKey = keyof typeof LINE_HEIGHT;
type PaletteColorKey = keyof ThemePalette;
type TextAlignValue = 'auto' | 'left' | 'right' | 'center' | 'justify';

// ============================================================================
// PROP TYPES
// ============================================================================

export interface TextPrimitiveProps extends RNTextProps {
  // Typography
  /** Font size (token key or number) */
  size?: FontSizeValue;
  /** Font weight (token key) */
  weight?: FontWeightValue;
  /** Line height multiplier key */
  leading?: LineHeightKey;
  /** Letter spacing */
  tracking?: number;
  /** Text alignment */
  textAlign?: TextAlignValue;
  /** Italic style */
  italic?: boolean;
  /** Underline decoration */
  underline?: boolean;
  /** Strikethrough decoration */
  strikethrough?: boolean;
  /** Uppercase transform */
  uppercase?: boolean;
  /** Lowercase transform */
  lowercase?: boolean;
  /** Capitalize transform */
  capitalize?: boolean;
  
  // Colors
  /** Text color (theme palette key or direct color) */
  color?: PaletteColorKey | string;
  
  // Spacing
  /** Margin on all sides */
  m?: SpacingValue;
  /** Margin horizontal */
  mx?: SpacingValue;
  /** Margin vertical */
  my?: SpacingValue;
  /** Margin top */
  mt?: SpacingValue;
  /** Margin bottom */
  mb?: SpacingValue;
  /** Margin left */
  ml?: SpacingValue;
  /** Margin right */
  mr?: SpacingValue;
  
  // Opacity
  /** Opacity value */
  opacity?: number;
  
  // Flex
  /** Flex value */
  flex?: number;
  /** Flex shrink */
  shrink?: number;
  
  // Convenience presets
  /** Muted text style */
  muted?: boolean;
  /** Subtle text style */
  subtle?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve spacing value to number
 */
function resolveSpacing(value: SpacingValue | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return SPACING[value];
}

/**
 * Resolve font size to number
 */
function resolveFontSize(value: FontSizeValue | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return FONT_SIZE[value];
}

/**
 * Resolve color value (palette key or direct color)
 */
function resolveColor(
  value: PaletteColorKey | string | undefined,
  palette: ThemePalette
): string | undefined {
  if (value === undefined) return undefined;
  // Check if it's a palette key
  if (value in palette) {
    return palette[value as PaletteColorKey];
  }
  // Return as direct color value
  return value;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Text - A styled Text component with convenient typography props
 * 
 * Supports all standard Text props plus shorthand props for common styles.
 * Can be used alongside traditional StyleSheet styles.
 */
export const Text = forwardRef<RNText, TextPrimitiveProps>(
  (
    {
      // Typography
      size,
      weight,
      leading,
      tracking,
      textAlign,
      italic,
      underline,
      strikethrough,
      uppercase,
      lowercase,
      capitalize,
      // Colors
      color,
      // Spacing
      m,
      mx,
      my,
      mt,
      mb,
      ml,
      mr,
      // Opacity
      opacity,
      // Flex
      flex,
      shrink,
      // Convenience
      muted,
      subtle,
      // Standard props
      style,
      children,
      ...textProps
    },
    ref
  ) => {
    const { theme } = useThemeSafe();
    const palette = theme.palette;

    const computedStyle = useMemo<StyleProp<TextStyle>>(() => {
      const textStyle: TextStyle = {};

      // Default text color
      textStyle.color = palette.text;

      // Font size
      if (size !== undefined) {
        const fontSize = resolveFontSize(size);
        textStyle.fontSize = fontSize;
        // Auto-calculate line height if not specified
        if (!leading && fontSize) {
          textStyle.lineHeight = Math.round(fontSize * LINE_HEIGHT.normal);
        }
      }

      // Font weight
      if (weight) {
        textStyle.fontWeight = FONT_WEIGHT[weight];
      }

      // Line height
      if (leading) {
        const fontSize = resolveFontSize(size) || FONT_SIZE.md;
        textStyle.lineHeight = Math.round(fontSize * LINE_HEIGHT[leading]);
      }

      // Letter spacing
      if (tracking !== undefined) {
        textStyle.letterSpacing = tracking;
      }

      // Text alignment
      if (textAlign) {
        textStyle.textAlign = textAlign;
      }

      // Font style
      if (italic) {
        textStyle.fontStyle = 'italic';
      }

      // Text decoration
      if (underline) {
        textStyle.textDecorationLine = 'underline';
      }
      if (strikethrough) {
        textStyle.textDecorationLine = strikethrough && underline 
          ? 'underline line-through' 
          : 'line-through';
      }

      // Text transform
      if (uppercase) {
        textStyle.textTransform = 'uppercase';
      } else if (lowercase) {
        textStyle.textTransform = 'lowercase';
      } else if (capitalize) {
        textStyle.textTransform = 'capitalize';
      }

      // Colors (applied after default)
      if (color !== undefined) {
        textStyle.color = resolveColor(color, palette);
      }

      // Convenience presets (applied after explicit color)
      if (muted && color === undefined) {
        textStyle.color = palette.textMuted;
      }
      if (subtle && color === undefined) {
        textStyle.color = palette.textSubtle;
      }

      // Spacing - Margin
      if (m !== undefined) textStyle.margin = resolveSpacing(m);
      if (mx !== undefined) textStyle.marginHorizontal = resolveSpacing(mx);
      if (my !== undefined) textStyle.marginVertical = resolveSpacing(my);
      if (mt !== undefined) textStyle.marginTop = resolveSpacing(mt);
      if (mb !== undefined) textStyle.marginBottom = resolveSpacing(mb);
      if (ml !== undefined) textStyle.marginLeft = resolveSpacing(ml);
      if (mr !== undefined) textStyle.marginRight = resolveSpacing(mr);

      // Opacity
      if (opacity !== undefined) {
        textStyle.opacity = opacity;
      }

      // Flex
      if (flex !== undefined) {
        textStyle.flex = flex;
      }
      if (shrink !== undefined) {
        textStyle.flexShrink = shrink;
      }

      return [textStyle, style];
    }, [
      size, weight, leading, tracking, textAlign,
      italic, underline, strikethrough,
      uppercase, lowercase, capitalize,
      color, palette,
      m, mx, my, mt, mb, ml, mr,
      opacity, flex, shrink,
      muted, subtle,
      style,
    ]);

    return (
      <RNText ref={ref} style={computedStyle} {...textProps}>
        {children}
      </RNText>
    );
  }
);

// ============================================================================
// DISPLAY NAME
// ============================================================================

Text.displayName = 'Text';

export default Text;
