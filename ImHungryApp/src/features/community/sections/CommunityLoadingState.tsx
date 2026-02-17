/**
 * @file CommunityLoadingState — Skeleton placeholder grid for the Community screen.
 */

import React from 'react';
import { View } from 'react-native';
import DealCardSkeleton from '../../../components/DealCardSkeleton';
import { Box } from '../../../ui/primitives';

export function CommunityLoadingState() {
  return (
    <Box flex={1}>
      <Box direction="row" wrap="wrap" justify="flex-start" pb={100}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item, index) => (
          <View
            key={item}
            style={
              index % 2 === 0
                ? { marginBottom: 4, marginRight: 2 }
                : { marginBottom: 4, marginLeft: 2 }
            }
          >
            <DealCardSkeleton variant="vertical" />
          </View>
        ))}
      </Box>
    </Box>
  );
}
