/**
 * @file FeedEmptyState — Empty-state views (no location / no deals).
 *
 * Purely presentational.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { BRAND, GRAY, SPACING } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface FeedEmptyStateProps {
  reason: 'needs_location' | 'no_deals';
}

const feedEmptyIconStyle = { marginBottom: SPACING.lg };
const feedEmptyTitleStyle = { fontFamily: 'Inter' };
const feedEmptyBodyStyle = { fontFamily: 'Inter', paddingHorizontal: SPACING.xl };

export function FeedEmptyState({ reason }: FeedEmptyStateProps) {
  if (reason === 'needs_location') {
    return (
      <Box flex={1} center py="5xl" minH={300}>
        <Ionicons name="location-outline" size={48} color={BRAND.primary} style={feedEmptyIconStyle} />
        <Text
          size="lg"
          weight="semibold"
          color={GRAY[600]}
          textAlign="center"
          mb="sm"
          style={feedEmptyTitleStyle}
        >
          Set your location to see deals
        </Text>
        <Text
          size="sm"
          color={GRAY[500]}
          textAlign="center"
          style={feedEmptyBodyStyle}
        >
          Click the location icon above to get personalized deals in your area!
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} center py="5xl" minH={300}>
      <Text
        size="lg"
        weight="semibold"
        color={GRAY[600]}
        textAlign="center"
        mb="sm"
        style={feedEmptyTitleStyle}
      >
        No Deals Found
      </Text>
      <Text
        size="sm"
        color={GRAY[500]}
        textAlign="center"
        style={feedEmptyBodyStyle}
      >
        Try a different filter or check back later!
      </Text>
    </Box>
  );
}
