/**
 * @file CommunityDealsGrid — Two-column grid of community (featured) deals.
 *
 * Purely presentational. State & callbacks come from useCommunity.
 */

import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';

import DealCard from '../../../components/DealCard';
import type { Deal } from '../../../types/deal';
import { Box } from '../../../ui/primitives';
import type { CommunityInteractions } from '../types';

const GRID_GAP = 4;

export interface CommunityDealsGridProps {
  deals: Deal[];
  interactions: CommunityInteractions;
}

export function CommunityDealsGrid({ deals, interactions }: CommunityDealsGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const columnWidth = containerWidth > 0 ? (containerWidth - GRID_GAP) / 2 : 0;

  return (
    <Box
      direction="row"
      wrap="wrap"
      justify="flex-start"
      pb={100}
      onLayout={handleLayout}
    >
      {containerWidth > 0 && deals.map((deal, index) => (
        <View
          key={deal.id}
          style={{
            width: columnWidth,
            marginBottom: GRID_GAP,
            marginRight: index % 2 === 0 ? GRID_GAP : 0,
          }}
        >
          <DealCard
            deal={deal}
            variant="vertical"
            onUpvote={interactions.handleUpvote}
            onDownvote={interactions.handleDownvote}
            onFavorite={interactions.handleFavorite}
            onPress={interactions.handleDealPress}
          />
        </View>
      ))}
    </Box>
  );
}
