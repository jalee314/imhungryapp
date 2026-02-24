/**
 * @file FavoritesEmptyState — Shown when no favorites exist in the active tab.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { GRAY, ICON_SIZE } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { FavoritesTab } from '../types';

export interface FavoritesEmptyStateProps {
  activeTab: FavoritesTab;
}

export function FavoritesEmptyState({ activeTab }: FavoritesEmptyStateProps) {
  const noun = activeTab === 'restaurants' ? 'Restaurants' : 'Deals';
  const cta =
    activeTab === 'restaurants'
      ? 'Start favoriting restaurants to see them here'
      : 'Start favoriting deals to see them here';

  return (
    <Box flex={1} center px="4xl" py="6xl">
      <Ionicons name="heart-outline" size={ICON_SIZE.xl} color={GRAY[350]} />
      <Text
        size="lg"
        weight="semibold"
        color={GRAY[800]}
        textAlign="center"
        mt="lg"
        mb="sm"
        style={{ fontFamily: 'Inter' }}
      >
        No {noun} Favorited
      </Text>
      <Text
        size="sm"
        color={GRAY[600]}
        textAlign="center"
        style={{ fontFamily: 'Inter', lineHeight: 20 }}
      >
        {cta}
      </Text>
    </Box>
  );
}
