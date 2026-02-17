/**
 * @file FavoritesRestaurantsList — Renders the list of favorited restaurants.
 */

import React from 'react';

import RowCard from '../../../components/RowCard';
import { FavoriteRestaurant } from '../../../services/favoritesService';

export interface FavoritesRestaurantsListProps {
  restaurants: FavoriteRestaurant[];
  onRestaurantPress: (restaurantId: string) => void;
}

export function FavoritesRestaurantsList({
  restaurants,
  onRestaurantPress,
}: FavoritesRestaurantsListProps) {
  return (
    <>
      {restaurants.map((restaurant) => (
        <RowCard
          key={restaurant.id}
          data={{
            id: restaurant.id,
            title: restaurant.name,
            subtitle: `${restaurant.distance} • ${restaurant.dealCount} Deals`,
            image: restaurant.imageUrl
              ? { uri: restaurant.imageUrl }
              : require('../../../../img/default-rest.png'),
          }}
          variant="favorites-deal-card"
          onPress={() => onRestaurantPress(restaurant.id)}
        />
      ))}
    </>
  );
}
