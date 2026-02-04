/**
 * FavoritesTabBar - Tab switcher for Deals and Restaurants
 */

import React from 'react';
import { Box, Text, Pressable } from '../../../components/atoms';
import { colors, spacing } from '../../../lib/theme';

interface FavoritesTabBarProps {
  activeTab: 'deals' | 'restaurants';
  onTabChange: (tab: 'deals' | 'restaurants') => void;
}

export const FavoritesTabBar: React.FC<FavoritesTabBarProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      paddingVertical="s3"
      gap="s2"
    >
      <Pressable
        onPress={() => onTabChange('deals')}
        paddingVertical="s2"
        paddingHorizontal="s5"
        borderRadius="full"
        backgroundColor={activeTab === 'deals' ? 'primary' : 'surface'}
        borderWidth={activeTab === 'deals' ? 0 : 1}
        borderColor="border"
        activeOpacity={0.7}
      >
        <Text
          variant="bodySmall"
          weight="semibold"
          color={activeTab === 'deals' ? 'background' : 'text'}
        >
          Deals
        </Text>
      </Pressable>
      
      <Pressable
        onPress={() => onTabChange('restaurants')}
        paddingVertical="s2"
        paddingHorizontal="s5"
        borderRadius="full"
        backgroundColor={activeTab === 'restaurants' ? 'primary' : 'surface'}
        borderWidth={activeTab === 'restaurants' ? 0 : 1}
        borderColor="border"
        activeOpacity={0.7}
      >
        <Text
          variant="bodySmall"
          weight="semibold"
          color={activeTab === 'restaurants' ? 'background' : 'text'}
        >
          Restaurants
        </Text>
      </Pressable>
    </Box>
  );
};
