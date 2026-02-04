/**
 * FavoritesLoadingState - Loading skeleton for Favorites
 */

import React from 'react';
import { Box } from '../../../components/atoms';
import RowCardSkeleton from '../../../components/RowCardSkeleton';

export const FavoritesLoadingState: React.FC = () => {
  return (
    <Box flex={1} paddingTop="s2">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <RowCardSkeleton key={item} />
      ))}
    </Box>
  );
};
