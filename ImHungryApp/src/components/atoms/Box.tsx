/**
 * Box - Layout Primitive Component
 * 
 * A flexible container that accepts token-based style props.
 * Replaces raw Views with complex StyleSheet definitions.
 * 
 * @example
 * <Box flex={1} padding="xl" bg="background" center>
 *   <Text>Content</Text>
 * </Box>
 */

import React from 'react';
import { View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { 
  colors, 
  spacing, 
  borderRadius,
  borderWidth,
  shadows,
  type ColorToken, 
  type SpacingToken,
  type BorderRadiusToken,
  type ShadowToken,
} from '../../lib/theme';

export interface BoxProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  
  // Layout
  flex?: number;
  row?: boolean;
  wrap?: boolean;
  center?: boolean;
  alignCenter?: boolean;
  justifyCenter?: boolean;
  alignStart?: boolean;
  alignEnd?: boolean;
  justifyStart?: boolean;
  justifyEnd?: boolean;
  justifyBetween?: boolean;
  justifyAround?: boolean;
  absolute?: boolean;
  relative?: boolean;
  
  // Position
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;
  
  // Dimensions
  width?: DimensionValue;
  height?: DimensionValue;
  minWidth?: DimensionValue;
  minHeight?: DimensionValue;
  maxWidth?: DimensionValue;
  maxHeight?: DimensionValue;
  
  // Spacing (padding)
  p?: SpacingToken | number;
  px?: SpacingToken | number;
  py?: SpacingToken | number;
  pt?: SpacingToken | number;
  pr?: SpacingToken | number;
  pb?: SpacingToken | number;
  pl?: SpacingToken | number;
  
  // Spacing (margin)
  m?: SpacingToken | number;
  mx?: SpacingToken | number;
  my?: SpacingToken | number;
  mt?: SpacingToken | number;
  mr?: SpacingToken | number;
  mb?: SpacingToken | number;
  ml?: SpacingToken | number;
  
  // Gap
  gap?: SpacingToken | number;
  rowGap?: SpacingToken | number;
  columnGap?: SpacingToken | number;
  
  // Colors
  bg?: ColorToken;
  borderColor?: ColorToken;
  
  // Border
  rounded?: BorderRadiusToken | number;
  roundedTop?: BorderRadiusToken | number;
  roundedBottom?: BorderRadiusToken | number;
  border?: number;
  borderTop?: number;
  borderBottom?: number;
  
  // Shadow
  shadow?: ShadowToken;
  
  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll';
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

export const Box: React.FC<BoxProps> = ({
  children,
  style,
  flex,
  row,
  wrap,
  center,
  alignCenter,
  justifyCenter,
  alignStart,
  alignEnd,
  justifyStart,
  justifyEnd,
  justifyBetween,
  justifyAround,
  absolute,
  relative,
  top,
  right,
  bottom,
  left,
  zIndex: zIndexProp,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  gap,
  rowGap,
  columnGap,
  bg,
  borderColor,
  rounded,
  roundedTop,
  roundedBottom,
  border,
  borderTop,
  borderBottom,
  shadow,
  overflow,
}) => {
  const computedStyle: ViewStyle = {
    // Layout
    ...(flex !== undefined && { flex }),
    ...(row && { flexDirection: 'row' }),
    ...(wrap && { flexWrap: 'wrap' }),
    ...(center && { justifyContent: 'center', alignItems: 'center' }),
    ...(alignCenter && { alignItems: 'center' }),
    ...(justifyCenter && { justifyContent: 'center' }),
    ...(alignStart && { alignItems: 'flex-start' }),
    ...(alignEnd && { alignItems: 'flex-end' }),
    ...(justifyStart && { justifyContent: 'flex-start' }),
    ...(justifyEnd && { justifyContent: 'flex-end' }),
    ...(justifyBetween && { justifyContent: 'space-between' }),
    ...(justifyAround && { justifyContent: 'space-around' }),
    
    // Position
    ...(absolute && { position: 'absolute' }),
    ...(relative && { position: 'relative' }),
    ...(top !== undefined && { top }),
    ...(right !== undefined && { right }),
    ...(bottom !== undefined && { bottom }),
    ...(left !== undefined && { left }),
    ...(zIndexProp !== undefined && { zIndex: zIndexProp }),
    
    // Dimensions
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...(minWidth !== undefined && { minWidth }),
    ...(minHeight !== undefined && { minHeight }),
    ...(maxWidth !== undefined && { maxWidth }),
    ...(maxHeight !== undefined && { maxHeight }),
    
    // Padding
    ...(p !== undefined && { padding: resolveSpacing(p) }),
    ...(px !== undefined && { paddingHorizontal: resolveSpacing(px) }),
    ...(py !== undefined && { paddingVertical: resolveSpacing(py) }),
    ...(pt !== undefined && { paddingTop: resolveSpacing(pt) }),
    ...(pr !== undefined && { paddingRight: resolveSpacing(pr) }),
    ...(pb !== undefined && { paddingBottom: resolveSpacing(pb) }),
    ...(pl !== undefined && { paddingLeft: resolveSpacing(pl) }),
    
    // Margin
    ...(m !== undefined && { margin: resolveSpacing(m) }),
    ...(mx !== undefined && { marginHorizontal: resolveSpacing(mx) }),
    ...(my !== undefined && { marginVertical: resolveSpacing(my) }),
    ...(mt !== undefined && { marginTop: resolveSpacing(mt) }),
    ...(mr !== undefined && { marginRight: resolveSpacing(mr) }),
    ...(mb !== undefined && { marginBottom: resolveSpacing(mb) }),
    ...(ml !== undefined && { marginLeft: resolveSpacing(ml) }),
    
    // Gap
    ...(gap !== undefined && { gap: resolveSpacing(gap) }),
    ...(rowGap !== undefined && { rowGap: resolveSpacing(rowGap) }),
    ...(columnGap !== undefined && { columnGap: resolveSpacing(columnGap) }),
    
    // Colors
    ...(bg && { backgroundColor: colors[bg] }),
    ...(borderColor && { borderColor: colors[borderColor] }),
    
    // Border radius
    ...(rounded !== undefined && { borderRadius: resolveRadius(rounded) }),
    ...(roundedTop !== undefined && { 
      borderTopLeftRadius: resolveRadius(roundedTop),
      borderTopRightRadius: resolveRadius(roundedTop),
    }),
    ...(roundedBottom !== undefined && { 
      borderBottomLeftRadius: resolveRadius(roundedBottom),
      borderBottomRightRadius: resolveRadius(roundedBottom),
    }),
    
    // Border width
    ...(border !== undefined && { borderWidth: border }),
    ...(borderTop !== undefined && { borderTopWidth: borderTop }),
    ...(borderBottom !== undefined && { borderBottomWidth: borderBottom }),
    
    // Shadow
    ...(shadow && shadows[shadow]),
    
    // Overflow
    ...(overflow && { overflow }),
  };

  return (
    <View style={[computedStyle, style]}>
      {children}
    </View>
  );
};

export default Box;
