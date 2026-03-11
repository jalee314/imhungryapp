/**
 * @file CommunityDealsGrid — Two-column grid of community (featured) deals.
 *
 * Purely presentational. State & callbacks come from useCommunity.
 */

import React from 'react';
import { View, Dimensions } from 'react-native';

import DealCard from '../../../components/DealCard';
import type { Deal } from '../../../types/deal';
import { Box } from '../../../ui/primitives';
import type { CommunityInteractions } from '../types';

const GRID_GAP = 4;
const COLUMN_WIDTH = (Dimensions.get('window').width - GRID_GAP) / 2;

export interface CommunityDealsGridProps {
  deals: Deal[];
  interactions: CommunityInteractions;
}

export function CommunityDealsGrid({ deals, interactions }: CommunityDealsGridProps) {
  return (
    <Box direction="row" wrap="wrap" justify="flex-start" pb={100}>
      {deals.map((deal, index) => (
        <View
          key={deal.id}
          style={{
            width: COLUMN_WIDTH,
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
