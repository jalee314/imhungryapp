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
type TextStyleKey = keyof TextStyle;
type SpacingAssignment = readonly [SpacingValue | undefined, TextStyleKey];
type RawAssignment = readonly [unknown, TextStyleKey];

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

function setStyleValue(style: TextStyle, key: TextStyleKey, value: unknown): void {
  if (value === undefined) {
    return;
  }
  (style as Record<string, unknown>)[key] = value;
}

function applySpacingAssignments(style: TextStyle, assignments: readonly SpacingAssignment[]): void {
  for (const [value, key] of assignments) {
    setStyleValue(style, key, resolveSpacing(value));
  }
}

function applyRawAssignments(style: TextStyle, assignments: readonly RawAssignment[]): void {
  for (const [value, key] of assignments) {
    setStyleValue(style, key, value);
  }
}

interface TypographyOptions {
  size?: FontSizeValue;
  weight?: FontWeightValue;
  leading?: LineHeightKey;
  tracking?: number;
  textAlign?: TextAlignValue;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
}

function resolveTextDecoration(
  underline: boolean | undefined,
  strikethrough: boolean | undefined
): TextStyle['textDecorationLine'] | undefined {
  if (underline && strikethrough) {
    return 'underline line-through';
  }
  if (underline) {
    return 'underline';
  }
  if (strikethrough) {
    return 'line-through';
  }
  return undefined;
}

function resolveTextTransform(
  uppercase: boolean | undefined,
  lowercase: boolean | undefined,
  capitalize: boolean | undefined
): TextStyle['textTransform'] | undefined {
  if (uppercase) {
    return 'uppercase';
  }
  if (lowercase) {
    return 'lowercase';
  }
  if (capitalize) {
    return 'capitalize';
  }
  return undefined;
}

function applyTypographyStyles(style: TextStyle, options: TypographyOptions): void {
  const {
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
  } = options;

  if (size !== undefined) {
    const fontSize = resolveFontSize(size);
    setStyleValue(style, 'fontSize', fontSize);
    if (!leading && fontSize) {
      setStyleValue(style, 'lineHeight', Math.round(fontSize * LINE_HEIGHT.normal));
    }
  }

  setStyleValue(style, 'fontWeight', weight ? FONT_WEIGHT[weight] : undefined);

  if (leading) {
    const fontSize = resolveFontSize(size) || FONT_SIZE.md;
    setStyleValue(style, 'lineHeight', Math.round(fontSize * LINE_HEIGHT[leading]));
  }

  setStyleValue(style, 'letterSpacing', tracking);
  setStyleValue(style, 'textAlign', textAlign);
  setStyleValue(style, 'fontStyle', italic ? 'italic' : undefined);
  setStyleValue(
    style,
    'textDecorationLine',
    resolveTextDecoration(underline, strikethrough)
  );
  setStyleValue(
    style,
    'textTransform',
    resolveTextTransform(uppercase, lowercase, capitalize)
  );
}

interface ColorOptions {
  color?: PaletteColorKey | string;
  muted?: boolean;
  subtle?: boolean;
}

function applyColorStyles(
  style: TextStyle,
  palette: ThemePalette,
  options: ColorOptions
): void {
  const { color, muted, subtle } = options;
  if (color !== undefined) {
    setStyleValue(style, 'color', resolveColor(color, palette));
    return;
  }
  if (muted) {
    setStyleValue(style, 'color', palette.textMuted);
    return;
  }
  if (subtle) {
    setStyleValue(style, 'color', palette.textSubtle);
  }
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
      setStyleValue(textStyle, 'color', palette.text);
      applyTypographyStyles(textStyle, {
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
      });
      applyColorStyles(textStyle, palette, { color, muted, subtle });

      applySpacingAssignments(textStyle, [
        [m, 'margin'],
        [mx, 'marginHorizontal'],
        [my, 'marginVertical'],
        [mt, 'marginTop'],
        [mb, 'marginBottom'],
        [ml, 'marginLeft'],
        [mr, 'marginRight'],
      ]);
      applyRawAssignments(textStyle, [
        [opacity, 'opacity'],
        [flex, 'flex'],
        [shrink, 'flexShrink'],
      ]);

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
