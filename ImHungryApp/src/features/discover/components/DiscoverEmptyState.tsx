/**
 * DiscoverEmptyState - Empty state for Discover feed
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';

interface DiscoverEmptyStateProps {
  searchQuery: string;
}

export const DiscoverEmptyState: React.FC<DiscoverEmptyStateProps> = ({ searchQuery }) => {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingVertical="s6"
      paddingHorizontal="s5"
    >
      <Ionicons name="restaurant-outline" size={48} color="#CCC" />
      <Text variant="h3" color="textSecondary" marginTop="s4" marginBottom="s2" textAlign="center">
        No restaurants found
      </Text>
      <Text variant="body" color="textMuted" textAlign="center">
        {searchQuery ? 'Try a different search term' : 'No restaurants with deals available'}
      </Text>
    </Box>
  );
};
