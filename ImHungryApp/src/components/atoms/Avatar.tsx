/**
 * Avatar - User Image Primitive Component
 * 
 * A standardized avatar component using design tokens.
 * 
 * @example
 * <Avatar source={{ uri: photoUrl }} size="lg" />
 * <Avatar fallback="👤" size="md" />
 */

import React from 'react';
import { Image, ImageSourcePropType, ViewStyle, ImageStyle } from 'react-native';
import { 
  colors, 
  avatarSize,
  borderWidth,
  type AvatarSizeToken,
  type ColorToken,
} from '../../lib/theme';
import { Box } from './Box';
import { Text } from './Text';

export interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  size?: AvatarSizeToken | number;
  fallback?: string;
  borderColor?: ColorToken;
  showBorder?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'md',
  fallback = '👤',
  borderColor = 'transparent',
  showBorder = false,
  style,
}) => {
  const resolvedSize = typeof size === 'number' ? size : avatarSize[size];
  const borderRadius = resolvedSize / 2;
  
  const containerStyle: ViewStyle = {
    width: resolvedSize,
    height: resolvedSize,
    borderRadius,
    overflow: 'hidden',
    ...(showBorder && {
      borderWidth: borderWidth.medium,
      borderColor: colors[borderColor],
    }),
  };

  const imageStyle: ImageStyle = {
    width: resolvedSize,
    height: resolvedSize,
    borderRadius,
  };

  // Determine if we have a valid source
  const hasValidSource = source && (
    (typeof source === 'string' && source.length > 0) ||
    (typeof source === 'object' && 'uri' in source && source.uri)
  );

  if (hasValidSource) {
    const imageSource = typeof source === 'string' 
      ? { uri: source } 
      : source as ImageSourcePropType;
      
    return (
      <Box style={[containerStyle, style]}>
        <Image source={imageSource} style={imageStyle} />
      </Box>
    );
  }

  // Render fallback
  return (
    <Box 
      style={[containerStyle, style]} 
      bg="backgroundSkeleton" 
      center
    >
      <Text size="sm" color="textMuted">{fallback}</Text>
    </Box>
  );
};

export default Avatar;
