/**
 * FeedEmptyState - Empty state display for Feed screen
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';
import { colors } from '../../../lib/theme';

interface FeedEmptyStateProps {
  reason: 'needs_location' | 'no_deals';
}

export const FeedEmptyState: React.FC<FeedEmptyStateProps> = ({ reason }) => {
  if (reason === 'needs_location') {
    return (
      <Box 
        flex={1} 
        justifyContent="center" 
        alignItems="center" 
        paddingVertical="s6"
        minHeight={300}
      >
        <Ionicons 
          name="location-outline" 
          size={48} 
          color={colors.primary} 
          style={{ marginBottom: 16 }} 
        />
        <Text 
          variant="h3" 
          color="textSecondary" 
          textAlign="center" 
          marginBottom="s2"
        >
          Set your location to see deals
        </Text>
        <Text 
          variant="body" 
          color="textMuted" 
          textAlign="center"
          paddingHorizontal="s5"
        >
          Click the location icon above to get personalized deals in your area!
        </Text>
      </Box>
    );
  }

  return (
    <Box 
      flex={1} 
      justifyContent="center" 
      alignItems="center" 
      paddingVertical="s6"
      minHeight={300}
    >
      <Text 
        variant="h3" 
        color="textSecondary" 
        textAlign="center" 
        marginBottom="s2"
      >
        No Deals Found
      </Text>
      <Text 
        variant="body" 
        color="textMuted" 
        textAlign="center"
      >
        Try a different filter or check back later!
      </Text>
    </Box>
  );
};
