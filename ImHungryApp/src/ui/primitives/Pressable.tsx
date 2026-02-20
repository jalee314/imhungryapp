/**
 * Pressable Primitive
 * 
 * A styled Pressable component that provides visual feedback on press
 * and supports the same styling props as Box.
 * 
 * Usage:
 * ```tsx
 * import { Pressable } from '@/ui/primitives';
 * 
 * <Pressable p="md" bg="primary" rounded="lg" onPress={handlePress}>
 *   <Text color="textInverted">Click me</Text>
 * </Pressable>
 * ```
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import {
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
  ViewStyle,
  StyleProp,
  View,
  PressableStateCallbackType,
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
type PressableStyleKey = keyof ViewStyle;
type SpacingAssignment = readonly [SpacingValue | undefined, PressableStyleKey];
type RawAssignment = readonly [unknown, PressableStyleKey];

// ============================================================================
// PROP TYPES
// ============================================================================

export interface PressablePrimitiveProps extends Omit<RNPressableProps, 'style'> {
  // Style prop with special handling for both static and callback styles
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  
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
  
  // Layout
  /** Flex value */
  flex?: number;
  /** Flex direction */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Align items */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  /** Justify content */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  /** Align self */
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch';
  
  // Sizing
  /** Width */
  w?: ViewStyle['width'];
  /** Height */
  h?: ViewStyle['height'];
  
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
  /** Background color when pressed (theme palette key or direct color) */
  bgPressed?: PaletteColorKey | string;
  
  // Opacity
  /** Opacity value */
  opacity?: number;
  /** Opacity when pressed (default: 0.7) */
  opacityPressed?: number;
  
  // Overflow
  /** Overflow behavior */
  overflow?: 'visible' | 'hidden' | 'scroll';
  
  // Convenience shortcuts
  /** Center content (align + justify center) */
  center?: boolean;
  /** Row layout shortcut */
  row?: boolean;
  
  // Press feedback behavior
  /** Disable opacity change on press */
  noFeedback?: boolean;
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

function setStyleValue(style: ViewStyle, key: PressableStyleKey, value: unknown): void {
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
 * Pressable - A styled Pressable component with convenient styling props
 * 
 * Provides visual feedback on press and supports Box-like styling props.
 * Can be used alongside traditional StyleSheet styles.
 */
export const Pressable = forwardRef<View, PressablePrimitiveProps>(
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
      // Layout
      flex,
      direction,
      align,
      justify,
      alignSelf,
      // Sizing
      w,
      h,
      // Borders
      rounded,
      borderWidth,
      borderColor,
      // Colors
      bg,
      bgPressed,
      // Opacity
      opacity,
      opacityPressed = 0.7,
      // Overflow
      overflow,
      // Convenience
      center,
      row,
      // Feedback
      noFeedback,
      // Standard props
      style,
      disabled,
      children,
      ...pressableProps
    },
    ref
  ) => {
    const { theme } = useThemeSafe();
    const palette = theme.palette;

    // Compute base styles (not state-dependent)
    const baseStyle = useMemo<ViewStyle>(() => {
      const pressableStyle: ViewStyle = {};

      applySpacingAssignments(pressableStyle, [
        [p, 'padding'],
        [px, 'paddingHorizontal'],
        [py, 'paddingVertical'],
        [pt, 'paddingTop'],
        [pb, 'paddingBottom'],
        [pl, 'paddingLeft'],
        [pr, 'paddingRight'],
      ]);
      applySpacingAssignments(pressableStyle, [
        [m, 'margin'],
        [mx, 'marginHorizontal'],
        [my, 'marginVertical'],
        [mt, 'marginTop'],
        [mb, 'marginBottom'],
        [ml, 'marginLeft'],
        [mr, 'marginRight'],
        [gap, 'gap'],
      ]);
      applyRawAssignments(pressableStyle, [
        [flex, 'flex'],
        [direction, 'flexDirection'],
        [align, 'alignItems'],
        [justify, 'justifyContent'],
        [alignSelf, 'alignSelf'],
        [w, 'width'],
        [h, 'height'],
        [opacity, 'opacity'],
        [overflow, 'overflow'],
      ]);

      if (rounded !== undefined) {
        setStyleValue(pressableStyle, 'borderRadius', resolveRadius(rounded));
      }
      if (borderWidth !== undefined) {
        setStyleValue(pressableStyle, 'borderWidth', borderWidth);
      }
      if (borderColor !== undefined) {
        setStyleValue(pressableStyle, 'borderColor', resolveColor(borderColor, palette));
      }
      if (bg !== undefined) {
        setStyleValue(pressableStyle, 'backgroundColor', resolveColor(bg, palette));
      }

      // Convenience shortcuts
      if (center) {
        applyRawAssignments(pressableStyle, [
          ['center', 'alignItems'],
          ['center', 'justifyContent'],
        ]);
      }
      if (row) {
        applyRawAssignments(pressableStyle, [['row', 'flexDirection']]);
        setStyleValue(
          pressableStyle,
          'alignItems',
          pressableStyle.alignItems ?? 'center'
        );
      }

      return pressableStyle;
    }, [
      p, px, py, pt, pb, pl, pr,
      m, mx, my, mt, mb, ml, mr,
      gap,
      flex, direction, align, justify, alignSelf,
      w, h,
      rounded, borderWidth, borderColor,
      bg, palette,
      opacity, overflow,
      center, row,
    ]);

    // Create style callback that handles pressed state
    const styleCallback = useCallback(
      (state: PressableStateCallbackType): StyleProp<ViewStyle> => {
        const { pressed } = state;
        
        const stateStyle: ViewStyle = { ...baseStyle };

        // Apply pressed styles
        if (pressed && !disabled) {
          // Pressed background color
          if (bgPressed !== undefined) {
            stateStyle.backgroundColor = resolveColor(bgPressed, palette);
          } else if (!noFeedback && bg) {
            // Default: use theme pressedBackground
            stateStyle.backgroundColor = palette.pressedBackground;
          }

          // Pressed opacity
          if (!noFeedback && opacityPressed !== undefined) {
            stateStyle.opacity = opacityPressed;
          }
        }

        // Disabled styles
        if (disabled) {
          stateStyle.opacity = 0.5;
        }

        // Merge with user-provided style
        const userStyle = typeof style === 'function' ? style(state) : style;
        
        return [stateStyle, userStyle];
      },
      [baseStyle, bgPressed, bg, noFeedback, opacityPressed, disabled, style, palette]
    );

    return (
      <RNPressable
        ref={ref}
        style={styleCallback}
        disabled={disabled}
        {...pressableProps}
      >
        {children}
      </RNPressable>
    );
  }
);

// ============================================================================
// DISPLAY NAME
// ============================================================================

Pressable.displayName = 'Pressable';

export default Pressable;
