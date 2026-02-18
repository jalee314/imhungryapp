/**
 * @file CommunityDealsGrid — Two-column grid of community (featured) deals.
 *
 * Purely presentational. State & callbacks come from useCommunity.
 */

import React from 'react';
import { View } from 'react-native';
import type { Deal } from '../../../types/deal';
import DealCard from '../../../components/DealCard';
import { Box } from '../../../ui/primitives';
import type { CommunityInteractions } from '../types';

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
          style={
            index % 2 === 0
              ? { marginBottom: 4, marginRight: 2 }
              : { marginBottom: 4, marginLeft: 2 }
          }
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
