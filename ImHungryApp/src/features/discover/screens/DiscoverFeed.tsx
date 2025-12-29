/**
 * DiscoverFeed.tsx
 *
 * Restaurant discovery screen using FlashList for performant scrolling.
 * Follows Bluesky's performance patterns.
 *
 * Key features:
 * - FlashList for better scroll performance
 * - React Query for data management
 * - Search filtering
 * - Distance-based sorting
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RowCard, { RowCardData } from '#/components/cards/RowCard';
import RowCardSkeleton from '#/components/RowCardSkeleton';
import SkeletonLoader from '#/components/SkeletonLoader';
import { useRestaurantsQuery } from '#/state/queries';
import { DiscoverRestaurant } from '#/services/discoverService';
import { useLocation } from '#/features/discover';
import { tokens, atoms as a } from '#/ui';

const { width: screenWidth } = Dimensions.get('window');

const DiscoverFeed: React.FC = () => {
  const navigation = useNavigation();
  const { currentLocation, updateLocation, selectedCoordinates } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Use React Query for data fetching
  const {
    data: queryData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useRestaurantsQuery({
    coordinates: selectedCoordinates || undefined,
  });

  // Extract restaurants from query data
  const restaurants = queryData?.restaurants ?? [];
  const error = queryData?.error || (queryError ? 'Failed to load restaurants' : null);

  // Maximum distance limit in miles
  const MAX_DISTANCE_MILES = 20;

  // Filter restaurants based on search query (name only) and 20-mile distance limit
  // Also sort by distance (nearest first)
  const filteredRestaurants = restaurants
    .filter(restaurant => 
      restaurant.distance_miles <= MAX_DISTANCE_MILES &&
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.distance_miles - b.distance_miles);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleRowCardPress = (id: string) => {
    const restaurant = restaurants.find(r => r.restaurant_id === id);
    if (restaurant) {
      (navigation as any).navigate('RestaurantDetail', { 
        restaurant 
      });
    }
  };

  // Convert DiscoverRestaurant to RowCardData
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


  const renderRestaurantCard = ({ item }: { item: DiscoverRestaurant }) => (
    <RowCard
      data={convertToRowCardData(item)}
      variant="rest-deal"
      onPress={handleRowCardPress}
    />
  );


  const renderSearchSkeleton = () => (
    <View style={styles.searchContainer}>
      <SkeletonLoader width={screenWidth - 24} height={35} borderRadius={30} />
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <RowCardSkeleton key={item} />
      ))}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
      <Text style={styles.errorTitle}>Unable to load restaurants</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={48} color="#CCC" />
      <Text style={styles.emptyTitle}>No restaurants found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try a different search term' : 'No restaurants with deals available'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderSearchSkeleton()}
        {renderLoadingState()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderSearchSkeleton()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          searchQuery.length > 0 && styles.searchInputContainerFocused
        ]}>
          <Ionicons 
            name="search" 
            size={16} 
            color="#666"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="rgba(60, 60, 67, 0.6)"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <FlashList
          data={filteredRestaurants}
          renderItem={renderRestaurantCard}
          keyExtractor={(item) => item.restaurant_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  searchContainer: {
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
  },
  searchInputContainer: {
    ...a.flex_row,
    ...a.items_center,
    backgroundColor: '#ffffffed',
    borderWidth: 0.5,
    borderColor: '#d7d7d7',
    ...a.rounded_full,
    paddingHorizontal: tokens.space.lg,
    height: 35,
    gap: tokens.space.lg,
    elevation: 2,
  },
  searchInputContainerFocused: {
    borderColor: '#d7d7d7',
    elevation: 4,
  },
  searchInput: {
    ...a.flex_1,
    fontSize: 17,
    color: 'rgba(60, 60, 67, 0.6)',
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    letterSpacing: -0.41,
    lineHeight: 22,
    padding: 0,
  },
  clearButton: {
    padding: tokens.space.xs,
  },
  content: {
    ...a.flex_1,
    paddingBottom: 0,
  },
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    ...a.flex_1,
    paddingTop: tokens.space.xs,
  },
  errorContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: 60,
    paddingHorizontal: tokens.space._4xl,
  },
  errorTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: '#333',
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    ...a.text_center,
  },
  errorSubtitle: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_600,
    fontFamily: 'Inter',
    ...a.text_center,
    lineHeight: 20,
    marginBottom: tokens.space._2xl,
  },
  retryButton: {
    ...a.bg_primary_500,
    paddingHorizontal: tokens.space._2xl,
    paddingVertical: tokens.space.md,
    ...a.rounded_sm,
  },
  retryButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.semibold,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: 60,
    paddingHorizontal: tokens.space._4xl,
  },
  emptyTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_gray_600,
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    ...a.text_center,
  },
  emptySubtitle: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_400,
    fontFamily: 'Inter',
    ...a.text_center,
    lineHeight: 20,
  },
});

export default DiscoverFeed;
