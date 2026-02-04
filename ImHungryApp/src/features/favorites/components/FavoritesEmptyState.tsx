/**
 * FavoritesEmptyState - Empty state for Favorites page
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';

interface FavoritesEmptyStateProps {
  type: 'deals' | 'restaurants';
}

export const FavoritesEmptyState: React.FC<FavoritesEmptyStateProps> = ({ type }) => {
  const icon = type === 'deals' ? 'pricetag-outline' : 'restaurant-outline';
  const title = type === 'deals' ? 'No Favorite Deals' : 'No Favorite Restaurants';
  const subtitle = type === 'deals' 
    ? 'Deals you save will appear here' 
    : 'Restaurants you save will appear here';

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingVertical="s6"
      paddingHorizontal="s5"
    >
      <Ionicons name={icon} size={48} color="#CCC" />
      <Text variant="h3" color="textSecondary" marginTop="s4" marginBottom="s2" textAlign="center">
        {title}
      </Text>
      <Text variant="body" color="textMuted" textAlign="center">
        {subtitle}
      </Text>
    </Box>
  );
};
