/**
 * @file DiscoverRestaurantList — FlatList of discover restaurants.
 */

import React, { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import RowCard, { RowCardData } from '../../../components/RowCard';
import { DiscoverRestaurant } from '../../../services/discoverService';

import { DiscoverEmptyState } from './DiscoverEmptyState';

export interface DiscoverRestaurantListProps {
  restaurants: DiscoverRestaurant[];
  searchQuery: string;
  onPress: (id: string) => void;
}

const convertToRowCardData = (restaurant: DiscoverRestaurant): RowCardData => ({
  id: restaurant.restaurant_id,
  title: restaurant.name,
  subtitle: restaurant.address,
  image: restaurant.logo_image
    ? { uri: restaurant.logo_image }
    : require('../../../../img/gallery.jpg'),
  distance: `${restaurant.distance_miles}mi`,
  dealCount: restaurant.deal_count,
});

export function DiscoverRestaurantList({
  restaurants,
  searchQuery,
  onPress,
}: DiscoverRestaurantListProps) {
  const renderItem = useCallback(
    ({ item }: { item: DiscoverRestaurant }) => (
      <RowCard data={convertToRowCardData(item)} variant="rest-deal" onPress={onPress} />
    ),
    [onPress],
  );

  return (
    <FlatList
      data={restaurants}
      renderItem={renderItem}
      keyExtractor={(item) => item.restaurant_id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={<DiscoverEmptyState searchQuery={searchQuery} />}
      numColumns={1}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
});
