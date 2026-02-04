/**
 * DiscoverLoadingState - Loading skeleton for Discover feed
 */

import React from 'react';
import { Dimensions } from 'react-native';
import { Box } from '../../../components/atoms';
import RowCardSkeleton from '../../../components/RowCardSkeleton';
import SkeletonLoader from '../../../components/SkeletonLoader';

const { width: screenWidth } = Dimensions.get('window');

export const DiscoverLoadingState: React.FC = () => {
  return (
    <>
      <Box paddingHorizontal="s4" paddingVertical="s2">
        <SkeletonLoader width={screenWidth - 24} height={35} borderRadius={30} />
      </Box>
      <Box flex={1} paddingTop="s1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <RowCardSkeleton key={item} />
        ))}
      </Box>
    </>
  );
};
