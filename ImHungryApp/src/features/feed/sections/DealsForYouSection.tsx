/**
 * @file DealsForYouSection — Two-column grid of "Deals For You".
 *
 * Purely presentational. State & callbacks come from useFeed.
 */

import React from 'react';
import { View } from 'react-native';
import DealCard, { Deal } from '../../../components/DealCard';
import { Box, Text } from '../../../ui/primitives';
import { STATIC, SPACING } from '../../../ui/alf';
import type { FeedInteractions } from '../types';

export interface DealsForYouSectionProps {
  deals: Deal[];
  interactions: FeedInteractions;
}

export function DealsForYouSection({ deals, interactions }: DealsForYouSectionProps) {
  if (deals.length === 0) return null;

  return (
    <>
      <Box
        row
        justify="space-between"
        align="center"
        pt="xs"
        pb="xs"
        pl="lg"
        pr={10}
      >
        <Text
          size={17}
          weight="bold"
          color={STATIC.black}
          style={{ fontFamily: 'Inter' }}
        >
          💰️ Deals For You
        </Text>
      </Box>

      <Box
        direction="row"
        wrap="wrap"
        justify="flex-start"
        pl={10}
        pr={10}
        pb={100}
      >
        {deals.map((deal, index) => (
          <View
            key={deal.id}
            style={index % 2 === 0 ? { marginBottom: 0, marginRight: 2 } : { marginTop: 0, marginLeft: 2 }}
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
    </>
  );
}
