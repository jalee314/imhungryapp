/**
 * Box Primitive
 * 
 * A flexible View wrapper that provides convenient props for common styling needs.
 * Supports all View props plus shorthand props for spacing, layout, and theming.
 * 
 * Usage:
 * ```tsx
 * import { Box } from '@/ui/primitives';
 * 
 * <Box p="md" bg="background" rounded="lg">
 *   <Text>Content</Text>
 * </Box>
 * ```
 */

import React, { forwardRef, useMemo } from 'react';
import {
  View,
  ViewProps,
  ViewStyle,
  StyleProp,
} from 'react-native';

import { ThemePalette } from '../alf/themes';
import { SPACING, RADIUS, SpacingKey, RadiusKey } from '../alf/tokens';

import { useThemeSafe } from './ThemeProvider';

// ============================================================================
// TYPE HELPERS
// ============================================================================

type SpacingValue = SpacingKey | number;
type RadiusValue = RadiusKey | number;
type PaletteColorKey = keyof ThemePalette;
type BoxStyleKey = keyof ViewStyle;
type SpacingAssignment = readonly [SpacingValue | undefined, BoxStyleKey];
type RawAssignment = readonly [unknown, BoxStyleKey];

// ============================================================================
// PROP TYPES
// ============================================================================

export interface BoxProps extends ViewProps {
  // Spacing
  /** Padding on all sides */
  p?: SpacingValue;
  /** Padding horizontal */
  px?: SpacingValue;
  /** Padding vertical */
  py?: SpacingValue;
  /** Padding top */
  pt?: SpacingValue;
  /** Padding bottom */
  pb?: SpacingValue;
  /** Padding left */
  pl?: SpacingValue;
  /** Padding right */
  pr?: SpacingValue;
  
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
  
  /** Gap between children */
  gap?: SpacingValue;
  /** Row gap */
  rowGap?: SpacingValue;
  /** Column gap */
  colGap?: SpacingValue;
  
  // Layout
  /** Flex value */
  flex?: number;
  /** Flex direction */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Align items */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  /** Justify content */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  /** Flex wrap */
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  /** Align self */
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch';
  
  // Sizing
  /** Width */
  w?: ViewStyle['width'];
  /** Height */
  h?: ViewStyle['height'];
  /** Min width */
  minW?: ViewStyle['minWidth'];
  /** Min height */
  minH?: ViewStyle['minHeight'];
  /** Max width */
  maxW?: ViewStyle['maxWidth'];
  /** Max height */
  maxH?: ViewStyle['maxHeight'];
  
  // Borders
  /** Border radius */
  rounded?: RadiusValue;
  /** Border width */
  borderWidth?: number;
  /** Border color (theme palette key or direct color) */
  borderColor?: PaletteColorKey | string;
  
  // Colors
  /** Background color (theme palette key or direct color) */
  bg?: PaletteColorKey | string;
  
  // Position
  /** Position type */
  position?: 'relative' | 'absolute';
  /** Top */
  top?: number;
  /** Bottom */
  bottom?: number;
  /** Left */
  left?: number;
  /** Right */
  right?: number;
  
  // Overflow
  /** Overflow behavior */
  overflow?: 'visible' | 'hidden' | 'scroll';
  
  // Opacity
  /** Opacity value */
  opacity?: number;
  
  // Convenience shortcuts
  /** Center content (align + justify center) */
  center?: boolean;
  /** Row layout shortcut */
  row?: boolean;
  /** Absolute fill */
  absoluteFill?: boolean;
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
 * Resolve radius value to number
 */
function resolveRadius(value: RadiusValue | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return RADIUS[value];
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

function setStyleValue(style: ViewStyle, key: BoxStyleKey, value: unknown): void {
  if (value === undefined) {
    return;
  }
  (style as Record<string, unknown>)[key] = value;
}

function applySpacingAssignments(style: ViewStyle, assignments: readonly SpacingAssignment[]): void {
  for (const [value, key] of assignments) {
    setStyleValue(style, key, resolveSpacing(value));
  }
}

function applyRawAssignments(style: ViewStyle, assignments: readonly RawAssignment[]): void {
  for (const [value, key] of assignments) {
    setStyleValue(style, key, value);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Box - A flexible View wrapper with convenient styling props
 * 
 * Supports all standard View props plus shorthand props for common styles.
 * Can be used alongside traditional StyleSheet styles.
 */
export const Box = forwardRef<View, BoxProps>(
  (
    {
      // Spacing
      p,
      px,
      py,
      pt,
      pb,
      pl,
      pr,
      m,
      mx,
      my,
      mt,
      mb,
      ml,
      mr,
      gap,
      rowGap,
      colGap,
      // Layout
      flex,
      direction,
      align,
      justify,
      wrap,
      alignSelf,
      // Sizing
      w,
      h,
      minW,
      minH,
      maxW,
      maxH,
      // Borders
      rounded,
      borderWidth,
      borderColor,
      // Colors
      bg,
      // Position
      position,
      top,
      bottom,
      left,
      right,
      // Overflow
      overflow,
      // Opacity
      opacity,
      // Convenience
      center,
      row,
      absoluteFill,
      // Standard props
      style,
      children,
      ...viewProps
    },
    ref
  ) => {
    const { theme } = useThemeSafe();
    const palette = theme.palette;

    const computedStyle = useMemo<StyleProp<ViewStyle>>(() => {
      const boxStyle: ViewStyle = {};

      applySpacingAssignments(boxStyle, [
        [p, 'padding'],
        [px, 'paddingHorizontal'],
        [py, 'paddingVertical'],
        [pt, 'paddingTop'],
        [pb, 'paddingBottom'],
        [pl, 'paddingLeft'],
        [pr, 'paddingRight'],
      ]);
      applySpacingAssignments(boxStyle, [
        [m, 'margin'],
        [mx, 'marginHorizontal'],
        [my, 'marginVertical'],
        [mt, 'marginTop'],
        [mb, 'marginBottom'],
        [ml, 'marginLeft'],
        [mr, 'marginRight'],
      ]);
      applySpacingAssignments(boxStyle, [
        [gap, 'gap'],
        [rowGap, 'rowGap'],
        [colGap, 'columnGap'],
      ]);

      applyRawAssignments(boxStyle, [
        [flex, 'flex'],
        [direction, 'flexDirection'],
        [align, 'alignItems'],
        [justify, 'justifyContent'],
        [wrap, 'flexWrap'],
        [alignSelf, 'alignSelf'],
        [w, 'width'],
        [h, 'height'],
        [minW, 'minWidth'],
        [minH, 'minHeight'],
        [maxW, 'maxWidth'],
        [maxH, 'maxHeight'],
        [position, 'position'],
        [top, 'top'],
        [bottom, 'bottom'],
        [left, 'left'],
        [right, 'right'],
        [overflow, 'overflow'],
        [opacity, 'opacity'],
      ]);

      if (rounded !== undefined) {
        setStyleValue(boxStyle, 'borderRadius', resolveRadius(rounded));
      }
      if (borderWidth !== undefined) {
        setStyleValue(boxStyle, 'borderWidth', borderWidth);
      }
      if (borderColor !== undefined) {
        setStyleValue(boxStyle, 'borderColor', resolveColor(borderColor, palette));
      }
      if (bg !== undefined) {
        setStyleValue(boxStyle, 'backgroundColor', resolveColor(bg, palette));
      }

      // Convenience shortcuts
      if (center) {
        applyRawAssignments(boxStyle, [
          ['center', 'alignItems'],
          ['center', 'justifyContent'],
        ]);
      }
      if (row) {
        applyRawAssignments(boxStyle, [['row', 'flexDirection']]);
        setStyleValue(
          boxStyle,
          'alignItems',
          boxStyle.alignItems ?? 'center'
        );
      }
      if (absoluteFill) {
        applyRawAssignments(boxStyle, [
          ['absolute', 'position'],
          [0, 'top'],
          [0, 'left'],
          [0, 'right'],
          [0, 'bottom'],
        ]);
      }

      return [boxStyle, style];
    }, [
      p, px, py, pt, pb, pl, pr,
      m, mx, my, mt, mb, ml, mr,
      gap, rowGap, colGap,
      flex, direction, align, justify, wrap, alignSelf,
      w, h, minW, minH, maxW, maxH,
      rounded, borderWidth, borderColor,
      bg, palette,
      position, top, bottom, left, right,
      overflow, opacity,
      center, row, absoluteFill,
      style,
    ]);

    return (
      <View ref={ref} style={computedStyle} {...viewProps}>
        {children}
      </View>
    );
  }
);

// ============================================================================
// DISPLAY NAME
// ============================================================================

Box.displayName = 'Box';

export default Box;
