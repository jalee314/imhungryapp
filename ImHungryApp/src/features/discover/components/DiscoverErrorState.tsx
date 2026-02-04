/**
 * DiscoverErrorState - Error state for Discover feed
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Button } from '../../../components/atoms';
import { colors } from '../../../lib/theme';

interface DiscoverErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const DiscoverErrorState: React.FC<DiscoverErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingVertical="s6"
      paddingHorizontal="s5"
    >
      <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      <Text variant="h3" marginTop="s4" marginBottom="s2" textAlign="center">
        Unable to load restaurants
      </Text>
      <Text variant="body" color="textSecondary" textAlign="center" marginBottom="s6">
        {error}
      </Text>
      <Button label="Try Again" onPress={onRetry} variant="primary" />
    </Box>
  );
};
