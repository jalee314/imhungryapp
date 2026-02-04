/**
 * Header - App Header Component
 * 
 * Displays the Hungri logo and location selector.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React, { memo } from 'react';
import { Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from './atoms';
import { colors } from '../lib/theme';

interface HeaderProps {
  onLocationPress?: () => void;
  currentLocation?: string;
  paddingHorizontal?: number;
}

const Header: React.FC<HeaderProps> = memo(({ 
  onLocationPress, 
  currentLocation, 
  paddingHorizontal 
}) => {
  const screenWidth = Dimensions.get('window').width;
  const dynamicPadding = paddingHorizontal || Math.max(10, screenWidth * 0.025);

  return (
    <Box
      width="100%"
      height={100}
      bg="background"
      borderBottom={0.5}
      borderColor="border"
      justifyEnd
      pb={4}
    >
      <Box
        row
        justifyBetween
        alignCenter
        width="100%"
        style={{ paddingHorizontal: dynamicPadding }}
      >
        {/* Logo */}
        <Box height={40} justifyCenter>
          <Image
            source={require('../../img/logo/hungri_logo.png')}
            style={{ width: 120 }}
            resizeMode="contain"
          />
        </Box>

        {/* Location Selector */}
        <Pressable 
          onPress={onLocationPress}
          p={4}
          center
        >
          <Box row alignCenter gap={4}>
            <Ionicons name="location-sharp" size={16} color={colors.text} />
            <Text 
              size="sm" 
              weight="medium" 
              color="text" 
              numberOfLines={1}
              style={{ maxWidth: 120 }}
            >
              {currentLocation || 'Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
          </Box>
        </Pressable>
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  return prevProps.currentLocation === nextProps.currentLocation && 
         prevProps.onLocationPress === nextProps.onLocationPress;
});

Header.displayName = 'Header';

export default Header;
