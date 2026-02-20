/**
 * @file DiscoverEmptyState — Shown when no restaurants match the search.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { GRAY, ICON_SIZE } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface DiscoverEmptyStateProps {
  searchQuery: string;
}

const discoverTitleStyle = { fontFamily: 'Inter' };
const discoverSubtitleStyle = { fontFamily: 'Inter', lineHeight: 20 };

export function DiscoverEmptyState({ searchQuery }: DiscoverEmptyStateProps) {
  return (
    <Box flex={1} center py="6xl" px="4xl">
      <Ionicons name="restaurant-outline" size={ICON_SIZE.lg} color={GRAY[350]} />
      <Text
        size="lg"
        weight="semibold"
        color={GRAY[600]}
        textAlign="center"
        mt="lg"
        mb="sm"
        style={discoverTitleStyle}
      >
        No restaurants found
      </Text>
      <Text
        size="sm"
        color={GRAY[500]}
        textAlign="center"
        style={discoverSubtitleStyle}
      >
        {searchQuery
          ? 'Try a different search term'
          : 'No restaurants with deals available'}
      </Text>
    </Box>
  );
}
