/**
 * RestaurantSearchBar - Search bar for restaurant selection
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';
import { colors } from '../../../lib/theme';
import type { Restaurant } from '../types';

interface RestaurantSearchBarProps {
  selectedRestaurant: Restaurant | null;
  onSearchPress: () => void;
  onClear: () => void;
}

export const RestaurantSearchBar: React.FC<RestaurantSearchBarProps> = ({
  selectedRestaurant,
  onSearchPress,
  onClear,
}) => {
  if (selectedRestaurant) {
    return (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingVertical="s4"
        paddingHorizontal="s4"
        height={59}
        backgroundColor="background"
        borderRadius="md"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.93)' }}
      >
        <Box flex={1} marginRight="s4">
          <Text variant="bodySmall" weight="bold" marginBottom="s0">
            {selectedRestaurant.name}
          </Text>
          <Text variant="bodySmall">
            {selectedRestaurant.subtext}
          </Text>
        </Box>
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={24} color="#C1C1C1" />
        </TouchableOpacity>
      </Box>
    );
  }

  return (
    <TouchableOpacity onPress={onSearchPress}>
      <Box
        flexDirection="row"
        alignItems="center"
        padding="s3"
        height={48}
        borderRadius="full"
        gap="s2"
        paddingHorizontal="s4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.93)' }}
      >
        <Ionicons name="search" size={20} color="rgba(60, 60, 67, 0.6)" />
        <Text variant="bodySmall" color="text" marginLeft="s2">
          Search for Restaurant *
        </Text>
      </Box>
    </TouchableOpacity>
  );
};
