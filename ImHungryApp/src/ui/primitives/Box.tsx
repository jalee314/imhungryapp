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
  StyleSheet,
  StyleProp,
} from 'react-native';
import { SPACING, RADIUS, BORDER_WIDTH, SpacingKey, RadiusKey } from '../alf/tokens';
import { ThemePalette } from '../alf/themes';
import { useThemeSafe } from './ThemeProvider';

// ============================================================================
// TYPE HELPERS
// ============================================================================

type SpacingValue = SpacingKey | number;
type RadiusValue = RadiusKey | number;
type PaletteColorKey = keyof ThemePalette;

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

      // Spacing - Padding
      if (p !== undefined) boxStyle.padding = resolveSpacing(p);
      if (px !== undefined) boxStyle.paddingHorizontal = resolveSpacing(px);
      if (py !== undefined) boxStyle.paddingVertical = resolveSpacing(py);
      if (pt !== undefined) boxStyle.paddingTop = resolveSpacing(pt);
      if (pb !== undefined) boxStyle.paddingBottom = resolveSpacing(pb);
      if (pl !== undefined) boxStyle.paddingLeft = resolveSpacing(pl);
      if (pr !== undefined) boxStyle.paddingRight = resolveSpacing(pr);

      // Spacing - Margin
      if (m !== undefined) boxStyle.margin = resolveSpacing(m);
      if (mx !== undefined) boxStyle.marginHorizontal = resolveSpacing(mx);
      if (my !== undefined) boxStyle.marginVertical = resolveSpacing(my);
      if (mt !== undefined) boxStyle.marginTop = resolveSpacing(mt);
      if (mb !== undefined) boxStyle.marginBottom = resolveSpacing(mb);
      if (ml !== undefined) boxStyle.marginLeft = resolveSpacing(ml);
      if (mr !== undefined) boxStyle.marginRight = resolveSpacing(mr);

      // Spacing - Gap
      if (gap !== undefined) boxStyle.gap = resolveSpacing(gap);
      if (rowGap !== undefined) boxStyle.rowGap = resolveSpacing(rowGap);
      if (colGap !== undefined) boxStyle.columnGap = resolveSpacing(colGap);

      // Layout
      if (flex !== undefined) boxStyle.flex = flex;
      if (direction) boxStyle.flexDirection = direction;
      if (align) boxStyle.alignItems = align;
      if (justify) boxStyle.justifyContent = justify;
      if (wrap) boxStyle.flexWrap = wrap;
      if (alignSelf) boxStyle.alignSelf = alignSelf;

      // Sizing
      if (w !== undefined) boxStyle.width = w;
      if (h !== undefined) boxStyle.height = h;
      if (minW !== undefined) boxStyle.minWidth = minW;
      if (minH !== undefined) boxStyle.minHeight = minH;
      if (maxW !== undefined) boxStyle.maxWidth = maxW;
      if (maxH !== undefined) boxStyle.maxHeight = maxH;

      // Borders
      if (rounded !== undefined) boxStyle.borderRadius = resolveRadius(rounded);
      if (borderWidth !== undefined) boxStyle.borderWidth = borderWidth;
      if (borderColor !== undefined) boxStyle.borderColor = resolveColor(borderColor, palette);

      // Colors
      if (bg !== undefined) boxStyle.backgroundColor = resolveColor(bg, palette);

      // Position
      if (position) boxStyle.position = position;
      if (top !== undefined) boxStyle.top = top;
      if (bottom !== undefined) boxStyle.bottom = bottom;
      if (left !== undefined) boxStyle.left = left;
      if (right !== undefined) boxStyle.right = right;

      // Overflow
      if (overflow) boxStyle.overflow = overflow;

      // Opacity
      if (opacity !== undefined) boxStyle.opacity = opacity;

      // Convenience shortcuts
      if (center) {
        boxStyle.alignItems = 'center';
        boxStyle.justifyContent = 'center';
      }
      if (row) {
        boxStyle.flexDirection = 'row';
        boxStyle.alignItems = boxStyle.alignItems || 'center';
      }
      if (absoluteFill) {
        boxStyle.position = 'absolute';
        boxStyle.top = 0;
        boxStyle.left = 0;
        boxStyle.right = 0;
        boxStyle.bottom = 0;
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
