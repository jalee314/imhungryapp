import type { NavigationProp } from '@react-navigation/native';
import { useCallback } from 'react';

import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';

export interface RestaurantDetailNavigationPayload {
  restaurant: {
    restaurant_id: string;
    name: string;
    address: string;
    logo_image: string;
    deal_count: number;
    distance_miles: number;
    lat: number;
    lng: number;
  };
}

export interface DealDetailNavigationPayload {
  deal: {
    id: string;
    title: string;
    restaurant: string;
    details: string;
    image: { uri: string } | number;
    imageVariants?: FavoriteDeal['imageVariants'];
    votes: number;
    isUpvoted: boolean;
    isDownvoted: boolean;
    isFavorited: boolean;
    cuisine: string;
    cuisineId: string | undefined;
    timeAgo: string;
    author: string;
    milesAway: string;
    userId?: string;
    userDisplayName?: string;
    userProfilePhoto?: string | null;
    restaurantAddress: string;
    isAnonymous: boolean;
  };
}

export interface UserProfileNavigationPayload {
  viewUser: true;
  username: string;
  userId: string;
}

export type FavoritesNavigationRoutes = {
  RestaurantDetail: RestaurantDetailNavigationPayload;
  DealDetail: DealDetailNavigationPayload;
  UserProfile: UserProfileNavigationPayload;
};

interface UseFavoritesNavigationHandlersParams {
  deals: FavoriteDeal[];
  restaurants: FavoriteRestaurant[];
  navigation: NavigationProp<FavoritesNavigationRoutes>;
}

const parseDistanceMiles = (distance: string): number => {
  return parseFloat(distance.replace('mi', '').replace('m', '')) || 0;
};

const buildRestaurantDetailPayload = (
  restaurant: FavoriteRestaurant,
): RestaurantDetailNavigationPayload => ({
  restaurant: {
    restaurant_id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    logo_image: restaurant.imageUrl,
    deal_count: restaurant.dealCount,
    distance_miles: parseDistanceMiles(restaurant.distance),
    lat: 0,
    lng: 0,
  },
});

const buildDealDetailPayload = (deal: FavoriteDeal): DealDetailNavigationPayload => ({
  deal: {
    id: deal.id,
    title: deal.title,
    restaurant: deal.restaurantName,
    details: deal.description,
    image: deal.imageUrl
      ? { uri: deal.imageUrl }
      : require('../../../img/default-rest.png'),
    imageVariants: deal.imageVariants,
    votes: 0,
    isUpvoted: false,
    isDownvoted: false,
    isFavorited: true,
    cuisine: deal.cuisineName,
    cuisineId: undefined,
    timeAgo: 'Unknown',
    author: deal.userDisplayName || 'Unknown',
    milesAway: deal.distance,
    userId: deal.userId,
    userDisplayName: deal.userDisplayName,
    userProfilePhoto: deal.userProfilePhoto,
    restaurantAddress: deal.restaurantAddress,
    isAnonymous: deal.isAnonymous,
  },
});

export const useFavoritesNavigationHandlers = ({
  deals,
  restaurants,
  navigation,
}: UseFavoritesNavigationHandlersParams) => {
  const handleRestaurantPress = useCallback(
    (restaurantId: string) => {
      const restaurant = restaurants.find((item) => item.id === restaurantId);
      if (restaurant) {
        navigation.navigate('RestaurantDetail', buildRestaurantDetailPayload(restaurant));
      }
    },
    [navigation, restaurants],
  );

  const handleDealPress = useCallback(
    (dealId: string) => {
      const deal = deals.find((item) => item.id === dealId);
      if (deal) {
        navigation.navigate('DealDetail', buildDealDetailPayload(deal));
      }
    },
    [deals, navigation],
  );

  const handleUserPress = useCallback(
    (userId: string) => {
      const deal = deals.find((item) => item.userId === userId);
      if (deal && deal.userDisplayName) {
        navigation.navigate('UserProfile', {
          viewUser: true,
          username: deal.userDisplayName,
          userId,
        });
      }
    },
    [deals, navigation],
  );

  return {
    handleRestaurantPress,
    handleDealPress,
    handleUserPress,
  };
};

