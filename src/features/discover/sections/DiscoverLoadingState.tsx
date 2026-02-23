/**
 * @file DiscoverLoadingState — Skeleton placeholder for the Discover screen.
 */

import React from 'react';

import RowCardSkeleton from '../../../components/RowCardSkeleton';
import { Box } from '../../../ui/primitives';

export function DiscoverLoadingState() {
  return (
    <Box flex={1} pt="xs">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <RowCardSkeleton key={item} />
      ))}
    </Box>
  );
}
