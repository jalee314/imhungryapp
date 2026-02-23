/**
 * @file DiscoverRestaurantList — FlatList of discover restaurants.
 */

import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import RowCard, { RowCardData } from '../../../components/RowCard';
import type { DiscoverRestaurant } from '../../../types/discover';

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

function DiscoverRestaurantListComponent({
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
  const emptyState = useMemo(
    () => <DiscoverEmptyState searchQuery={searchQuery} />,
    [searchQuery],
  );

  return (
    <FlatList
      data={restaurants}
      renderItem={renderItem}
      keyExtractor={(item) => item.restaurant_id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={emptyState}
      numColumns={1}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

export const DiscoverRestaurantList = memo(DiscoverRestaurantListComponent);

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
});
