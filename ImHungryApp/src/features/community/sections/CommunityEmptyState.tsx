/**
 * @file CommunityEmptyState — Shown when no community deals are available.
 */

import React from 'react';
import { Box, Text } from '../../../ui/primitives';
import { GRAY } from '../../../ui/alf';

export function CommunityEmptyState() {
  return (
    <Box flex={1} center py="5xl">
      <Text
        size="lg"
        weight="semibold"
        color={GRAY[600]}
        textAlign="center"
        mb="sm"
        style={{ fontFamily: 'Inter' }}
      >
        No community deals available
      </Text>
      <Text
        size="sm"
        color={GRAY[500]}
        textAlign="center"
        style={{ fontFamily: 'Inter' }}
      >
        Check back later for new deals!
      </Text>
    </Box>
  );
}
