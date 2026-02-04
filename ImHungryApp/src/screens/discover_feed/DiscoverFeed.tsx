/**
 * DiscoverFeed - Restaurant discovery screen
 */

import React, { useState, useEffect } from 'react';
import { View, FlatList, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box } from '../../components/atoms';
import RowCard, { RowCardData } from '../../components/RowCard';
import {
  DiscoverLoadingState,
  DiscoverEmptyState,
  DiscoverErrorState,
  SearchBar,
} from '../../features/discover';
import { getRestaurantsWithDeals, getRestaurantsWithDealsDirect, DiscoverRestaurant } from '../../services/discoverService';
import { useLocation } from '../../context/LocationContext';
import { colors } from '../../lib/theme';

const MAX_DISTANCE_MILES = 31;

const DiscoverFeed: React.FC = () => {
  const navigation = useNavigation();
  const { selectedCoordinates } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<DiscoverRestaurant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);

      let result = await getRestaurantsWithDeals(selectedCoordinates || undefined);

      if (!result.success && result.error?.includes('function')) {
        result = await getRestaurantsWithDealsDirect(selectedCoordinates || undefined);
      }

      if (result.success) {
        setRestaurants(result.restaurants);
      } else {
        setError(result.error || 'Failed to load restaurants');
      }
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [selectedCoordinates]);

  const filteredRestaurants = restaurants
    .filter(restaurant =>
      restaurant.distance_miles <= MAX_DISTANCE_MILES &&
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.distance_miles - b.distance_miles);

  const handleRowCardPress = (id: string) => {
    const restaurant = restaurants.find(r => r.restaurant_id === id);
    if (restaurant) {
      (navigation as any).navigate('RestaurantDetail', { restaurant });
    }
  };

  const convertToRowCardData = (restaurant: DiscoverRestaurant): RowCardData => ({
    id: restaurant.restaurant_id,
    title: restaurant.name,
    subtitle: restaurant.address,
    image: restaurant.logo_image
      ? { uri: restaurant.logo_image }
      : require('../../../img/gallery.jpg'),
    distance: `${restaurant.distance_miles}mi`,
    dealCount: restaurant.deal_count,
  });

  const renderRestaurantCard = ({ item }: { item: DiscoverRestaurant }) => (
    <RowCard
      data={convertToRowCardData(item)}
      variant="rest-deal"
      onPress={handleRowCardPress}
    />
  );

  if (loading) {
    return (
      <Box flex={1} backgroundColor="background">
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <DiscoverLoadingState />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} backgroundColor="background">
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <DiscoverErrorState error={error} onRetry={loadRestaurants} />
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="background">
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <Box flex={1}>
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurantCard}
          keyExtractor={(item) => item.restaurant_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<DiscoverEmptyState searchQuery={searchQuery} />}
          numColumns={1}
        />
      </Box>
    </Box>
  );
};

export default DiscoverFeed;
