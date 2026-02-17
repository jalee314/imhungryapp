/**
 * @file FavoritesDealsList — Renders the list of favorited deals.
 */

import React from 'react';

import RowCard from '../../../components/RowCard';
import { FavoriteDeal } from '../../../services/favoritesService';

export interface FavoritesDealsListProps {
  deals: FavoriteDeal[];
  onDealPress: (dealId: string) => void;
  onUserPress: (userId: string) => void;
}

export function FavoritesDealsList({
  deals,
  onDealPress,
  onUserPress,
}: FavoritesDealsListProps) {
  return (
    <>
      {deals.map((deal) => (
        <RowCard
          key={deal.id}
          data={{
            id: deal.id,
            title: deal.title,
            subtitle: `${deal.restaurantName} • ${deal.distance}`,
            image:
              deal.imageUrl === 'placeholder' || !deal.imageUrl
                ? require('../../../../img/default-rest.png')
                : { uri: deal.imageUrl },
            userId: deal.userId,
            userProfilePhoto: deal.userProfilePhoto,
            userDisplayName: deal.userDisplayName,
          }}
          variant="favorites-deal-card"
          onPress={() => onDealPress(deal.id)}
          onUserPress={onUserPress}
        />
      ))}
    </>
  );
}
