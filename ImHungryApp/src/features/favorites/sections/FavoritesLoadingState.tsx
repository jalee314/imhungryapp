/**
 * @file FavoritesLoadingState — Skeleton placeholder for the Favorites screen.
 */

import React from 'react';

import RowCardSkeleton from '../../../components/RowCardSkeleton';
import SkeletonLoader from '../../../components/SkeletonLoader';
import { STATIC, RADIUS } from '../../../ui/alf';
import { Box } from '../../../ui/primitives';

const favoritesLoadingHeaderStyle = { borderBottomWidth: 0.5, borderBottomColor: '#DEDEDE' };

/**
 * Full-screen skeleton shown on initial load (header + tabs + cards).
 */
export function FavoritesFullSkeleton() {
  return (
    <Box flex={1} bg={STATIC.white}>
      {/* Header skeleton */}
      <Box
        h={100}
        justify="flex-end"
        pb="sm"
        px="lg"
        style={favoritesLoadingHeaderStyle}
      >
        <SkeletonLoader width={120} height={28} borderRadius={RADIUS.sm} />
      </Box>

      {/* Tab skeleton */}
      <Box direction="row" px="xl" py="sm" gap="xs">
        <SkeletonLoader width={85} height={34} borderRadius={RADIUS.circle} />
        <SkeletonLoader width={115} height={34} borderRadius={RADIUS.circle} />
      </Box>

      {/* Cards skeleton */}
      <Box pt="xs">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <RowCardSkeleton key={item} />
        ))}
      </Box>
    </Box>
  );
}

/**
 * Inline skeleton for a tab that hasn't loaded its data yet.
 */
export function FavoritesTabSkeleton() {
  return (
    <Box pt="xs">
      {[1, 2, 3, 4, 5].map((item) => (
        <RowCardSkeleton key={item} />
      ))}
    </Box>
  );
}
