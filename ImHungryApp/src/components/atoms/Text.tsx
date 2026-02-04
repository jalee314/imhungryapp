/**
 * Text - Typography Primitive Component
 * 
 * A text component that accepts token-based style props.
 * Replaces raw Text components with inline styles.
 * 
 * @example
 * <Text variant="h1" color="text">Hello World</Text>
 * <Text size="sm" weight="bold" color="textMuted">Caption</Text>
 */

import React from 'react';
import { Text as RNText, TextStyle, StyleProp, TextProps as RNTextProps, DimensionValue } from 'react-native';
import { 
  colors, 
  fontFamily,
  fontSize,
  fontWeight as fontWeightTokens,
  textVariants,
  type ColorToken,
  type FontFamilyToken,
  type FontSizeToken,
  type TextVariant,
} from '../../lib/theme';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  
  // Variant (pre-defined styles)
  variant?: TextVariant;
  
  // Typography
  family?: FontFamilyToken;
  size?: FontSizeToken | number;
  weight?: keyof typeof fontWeightTokens;
  lineHeight?: number;
  letterSpacing?: number;
  
  // Color
  color?: ColorToken;
  
  // Alignment
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  
  // Decoration
  underline?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  
  // Layout
  flex?: number;
  width?: DimensionValue;
  
  // Margin
  mt?: number;
  mr?: number;
  mb?: number;
  ml?: number;
}

export const Text: React.FC<TextProps> = ({
  children,
  style,
  variant,
  family,
  size,
  weight,
  lineHeight,
  letterSpacing,
  color,
  align,
  underline,
  strikethrough,
  italic,
  uppercase,
  lowercase,
  capitalize,
  flex,
  width,
  mt,
  mr,
  mb,
  ml,
  ...restProps
}) => {
  // Start with variant styles if provided
  const variantStyles = variant ? textVariants[variant] : {};
  
  const computedStyle: TextStyle = {
    // Apply variant first (can be overridden)
    ...variantStyles,
    
    // Typography overrides
    ...(family && { fontFamily: fontFamily[family] }),
    ...(size !== undefined && { fontSize: typeof size === 'number' ? size : fontSize[size] }),
    ...(weight && { fontWeight: fontWeightTokens[weight] }),
    ...(lineHeight !== undefined && { lineHeight }),
    ...(letterSpacing !== undefined && { letterSpacing }),
    
    // Color
    ...(color && { color: colors[color] }),
    
    // Default color if not specified
    ...(!color && !variant && { color: colors.text }),
    
    // Alignment
    ...(align && { textAlign: align }),
    
    // Decoration
    ...(underline && { textDecorationLine: 'underline' }),
    ...(strikethrough && { textDecorationLine: 'line-through' }),
    ...(italic && { fontStyle: 'italic' }),
    
    // Text transform
    ...(uppercase && { textTransform: 'uppercase' }),
    ...(lowercase && { textTransform: 'lowercase' }),
    ...(capitalize && { textTransform: 'capitalize' }),
    
    // Layout
    ...(flex !== undefined && { flex }),
    ...(width !== undefined && { width }),
    
    // Margin
    ...(mt !== undefined && { marginTop: mt }),
    ...(mr !== undefined && { marginRight: mr }),
    ...(mb !== undefined && { marginBottom: mb }),
    ...(ml !== undefined && { marginLeft: ml }),
  };

  return (
    <RNText style={[computedStyle, style]} {...restProps}>
      {children}
    </RNText>
  );
};

export default Text;
