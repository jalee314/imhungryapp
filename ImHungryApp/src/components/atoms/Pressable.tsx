/**
 * Pressable - Interactive Container Primitive
 * 
 * Combines Box styling with TouchableOpacity behavior.
 * Use when you need a clickable container with token-based styles.
 * 
 * @example
 * <Pressable onPress={handlePress} padding="m" bg="interactive" rounded="md">
 *   <Text>Click me</Text>
 * </Pressable>
 */

import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle, StyleProp } from 'react-native';
import { 
  colors, 
  spacing, 
  borderRadius,
  shadows,
  type ColorToken, 
  type SpacingToken,
  type BorderRadiusToken,
  type ShadowToken,
} from '../../lib/theme';

export interface PressableProps extends Omit<TouchableOpacityProps, 'style'> {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  
  // Layout
  flex?: number;
  row?: boolean;
  center?: boolean;
  alignCenter?: boolean;
  justifyCenter?: boolean;
  justifyBetween?: boolean;
  
  // Dimensions
  width?: number | string;
  height?: number | string;
  
  // Spacing
  p?: SpacingToken | number;
  px?: SpacingToken | number;
  py?: SpacingToken | number;
  m?: SpacingToken | number;
  mx?: SpacingToken | number;
  my?: SpacingToken | number;
  gap?: SpacingToken | number;
  
  // Colors
  bg?: ColorToken;
  borderColor?: ColorToken;
  
  // Border
  rounded?: BorderRadiusToken | number;
  border?: number;
  
  // Shadow
  shadow?: ShadowToken;
}

const resolveSpacing = (value: SpacingToken | number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return spacing[value];
};

const resolveRadius = (value: BorderRadiusToken | number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return borderRadius[value];
};

export const Pressable: React.FC<PressableProps> = ({
  children,
  style,
  flex,
  row,
  center,
  alignCenter,
  justifyCenter,
  justifyBetween,
  width,
  height,
  p,
  px,
  py,
  m,
  mx,
  my,
  gap,
  bg,
  borderColor,
  rounded,
  border,
  shadow,
  ...restProps
}) => {
  const computedStyle: ViewStyle = {
    ...(flex !== undefined && { flex }),
    ...(row && { flexDirection: 'row' }),
    ...(center && { justifyContent: 'center', alignItems: 'center' }),
    ...(alignCenter && { alignItems: 'center' }),
    ...(justifyCenter && { justifyContent: 'center' }),
    ...(justifyBetween && { justifyContent: 'space-between' }),
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...(p !== undefined && { padding: resolveSpacing(p) }),
    ...(px !== undefined && { paddingHorizontal: resolveSpacing(px) }),
    ...(py !== undefined && { paddingVertical: resolveSpacing(py) }),
    ...(m !== undefined && { margin: resolveSpacing(m) }),
    ...(mx !== undefined && { marginHorizontal: resolveSpacing(mx) }),
    ...(my !== undefined && { marginVertical: resolveSpacing(my) }),
    ...(gap !== undefined && { gap: resolveSpacing(gap) }),
    ...(bg && { backgroundColor: colors[bg] }),
    ...(borderColor && { borderColor: colors[borderColor] }),
    ...(rounded !== undefined && { borderRadius: resolveRadius(rounded) }),
    ...(border !== undefined && { borderWidth: border }),
    ...(shadow && shadows[shadow]),
  };

  return (
    <TouchableOpacity style={[computedStyle, style]} activeOpacity={0.7} {...restProps}>
      {children}
    </TouchableOpacity>
  );
};

export default Pressable;
