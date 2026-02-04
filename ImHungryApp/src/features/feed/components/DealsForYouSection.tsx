/**
 * DealsForYouSection - Grid of deals for the user
 */

import React from 'react';
import { Box, Text } from '../../../components/atoms';
import DealCard from '../../../components/DealCard';
import type { Deal } from '../types';

interface DealsForYouSectionProps {
  deals: Deal[];
  onDealPress: (dealId: string) => void;
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onFavorite: (dealId: string) => void;
}

export const DealsForYouSection: React.FC<DealsForYouSectionProps> = ({
  deals,
  onDealPress,
  onUpvote,
  onDownvote,
  onFavorite,
}) => {
  if (deals.length === 0) return null;

  return (
    <>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingTop="s1"
        paddingBottom="s1"
        paddingLeft="s4"
        paddingRight="s3"
      >
        <Text variant="h3" weight="bold">💰️ Deals For You</Text>
      </Box>
      <Box
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="flex-start"
        paddingLeft="s3"
        paddingRight="s3"
        paddingBottom="s6"
        style={{ paddingBottom: 100 }}
      >
        {deals.map((deal, index) => (
          <Box 
            key={deal.id} 
            marginBottom="s0"
            marginRight={index % 2 === 0 ? 2 : 0}
            marginLeft={index % 2 === 1 ? 2 : 0}
          >
            <DealCard 
              deal={deal} 
              variant="vertical" 
              onUpvote={onUpvote} 
              onDownvote={onDownvote} 
              onFavorite={onFavorite} 
              onPress={onDealPress} 
            />
          </Box>
        ))}
      </Box>
    </>
  );
};
