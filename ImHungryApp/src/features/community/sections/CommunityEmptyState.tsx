/**
 * @file CommunityEmptyState — Shown when no community deals are available.
 */

import React from 'react';

import { GRAY } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

const interFont = { fontFamily: 'Inter' };

export function CommunityEmptyState() {
  return (
    <Box flex={1} center py="5xl">
      <Text
        size="lg"
        weight="semibold"
        color={GRAY[600]}
        textAlign="center"
        mb="sm"
        style={interFont}
      >
        No community deals available
      </Text>
      <Text
        size="sm"
        color={GRAY[500]}
        textAlign="center"
        style={interFont}
      >
        Check back later for new deals!
      </Text>
    </Box>
  );
}
