/**
 * Divider - Separator Primitive Component
 * 
 * A simple line separator using design tokens.
 * 
 * @example
 * <Divider />
 * <Divider vertical height={20} />
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, type ColorToken, type SpacingToken } from '../../lib/theme';

export interface DividerProps {
  vertical?: boolean;
  color?: ColorToken;
  thickness?: number;
  width?: number | string;
  height?: number | string;
  spacing?: SpacingToken | number;
  style?: StyleProp<ViewStyle>;
}

export const Divider: React.FC<DividerProps> = ({
  vertical = false,
  color = 'border',
  thickness = 1,
  width,
  height,
  spacing: spacingProp,
  style,
}) => {
  const resolvedSpacing = spacingProp 
    ? (typeof spacingProp === 'number' ? spacingProp : spacing[spacingProp])
    : 0;

  const dividerStyle: ViewStyle = vertical
    ? {
        width: thickness,
        height: height ?? '100%',
        backgroundColor: colors[color],
        marginHorizontal: resolvedSpacing,
      }
    : {
        width: width ?? '100%',
        height: thickness,
        backgroundColor: colors[color],
        marginVertical: resolvedSpacing,
      };

  return <View style={[dividerStyle, style]} />;
};

export default Divider;
