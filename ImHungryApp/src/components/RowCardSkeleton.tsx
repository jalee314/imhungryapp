/**
 * RowCardSkeleton - Loading State for RowCard
 * 
 * A skeleton placeholder for RowCard components.
 * Uses Skeleton atom and Box for consistent styling.
 */

import React from 'react';
import { Box, Skeleton } from './atoms';

const RowCardSkeleton: React.FC = () => {
  return (
    <Box
      bg="background"
      rounded="md"
      p="s"
      mx="m"
      my="xs"
      height={86}
    >
      <Box row alignCenter gap="m" width="100%" height="100%">
        {/* Image skeleton */}
        <Skeleton width={70} height={70} rounded="s" />

        {/* Text content skeleton */}
        <Box flex={1} gap="s" justifyCenter pr="s">
          {/* Title skeleton */}
          <Skeleton width="80%" height={14} rounded="xs" />
          
          {/* Subtitle skeleton */}
          <Skeleton width="60%" height={12} rounded="xs" />
        </Box>

        {/* Arrow skeleton */}
        <Skeleton circle size={16} />
      </Box>
    </Box>
  );
};

export default RowCardSkeleton;
