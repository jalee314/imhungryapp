/**
 * FavoritesPage.tsx
 *
 * Favorites screen using React Query and FlashList for performant scrolling.
 * Shows favorited deals and restaurants with tabs.
 * Follows Bluesky's performance patterns.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RowCard from '#/components/cards/RowCard';
import RowCardSkeleton from '#/components/RowCardSkeleton';
import SkeletonLoader from '#/components/SkeletonLoader';
import { useFavoritesPageQuery } from '#/state/queries';
import { useFavorites } from '../hooks/useFavorites';
import { tokens, atoms as a } from '#/ui';
import type { FavoriteDeal, FavoriteRestaurant } from '#/services/favoritesService';

const FavoritesPage: React.FC = () => {
  const navigation = useNavigation();
  const { markAsUnfavorited, isUnfavorited, clearUnfavorited, clearNewlyFavorited, getNewlyFavoritedDeals } = useFavorites();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'deals'>('deals');
  const [unfavoritingIds, setUnfavoritingIds] = useState<Set<string>>(new Set());

  // Use React Query hook for data management
  const {
    deals: queryDeals,
    restaurants: queryRestaurants,
    isDealsLoading,
    isRestaurantsLoading,
    isRefreshing,
    onRefresh,
    unfavoriteDeal,
    unfavoriteRestaurant,
    removeDealOptimistic,
    removeRestaurantOptimistic,
  } = useFavoritesPageQuery();

  // Filter out unfavorited items (from global state)
  const deals = queryDeals.filter(deal => !isUnfavorited(deal.id, 'deal'));
  const restaurants = queryRestaurants.filter(restaurant => !isUnfavorited(restaurant.id, 'restaurant'));

  // Apply instant updates from global favorites store when screen focuses
  useFocusEffect(
    useCallback(() => {
      // Clear stale unfavorited state on focus
      clearUnfavorited();

      // Add newly favorited deals instantly
      const newDeals = getNewlyFavoritedDeals();
      if (newDeals.length > 0) {
        // The query will be refetched, which will include the new deals
        // For now, the realtime subscription handles this
      }

      // Clear newly favorited tracking after applying
      clearNewlyFavorited();
    }, [clearUnfavorited, clearNewlyFavorited, getNewlyFavoritedDeals])
  );

  const handleRefresh = useCallback(async () => {
    await onRefresh(activeTab);
  }, [onRefresh, activeTab]);

  const handleRestaurantPress = useCallback((restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      const restaurantForDetail = {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        logo_image: restaurant.imageUrl,
        deal_count: restaurant.dealCount,
        distance_miles: parseFloat(restaurant.distance.replace('mi', '').replace('m', '')) || 0,
        lat: 0,
        lng: 0,
      };
      (navigation as any).navigate('RestaurantDetail', { restaurant: restaurantForDetail });
    }
  }, [restaurants, navigation]);

  const handleDealPress = useCallback((dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      const dealForDetail = {
        id: deal.id,
        title: deal.title,
        restaurant: deal.restaurantName,
        details: deal.description,
        image: deal.imageUrl ? { uri: deal.imageUrl } : require('../../../../img/default-rest.png'),
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
      };
      (navigation as any).navigate('DealDetail', { deal: dealForDetail });
    }
  }, [deals, navigation]);

  const handleUserPress = useCallback((userId: string) => {
    const deal = deals.find(d => d.userId === userId);
    if (deal && deal.userDisplayName) {
      (navigation as any).navigate('ProfilePage', {
        viewUser: true,
        username: deal.userDisplayName,
        userId: userId,
      });
    }
  }, [deals, navigation]);

  const handleUnfavorite = useCallback(async (id: string, type: 'restaurant' | 'deal') => {
    if (unfavoritingIds.has(id)) return;

    try {
      setUnfavoritingIds(prev => new Set(prev).add(id));

      // Mark in global state
      markAsUnfavorited(id, type);

      // Optimistic UI update via React Query
      if (type === 'restaurant') {
        removeRestaurantOptimistic(id);
        // Background API call
        unfavoriteRestaurant(id).catch(err => {
          console.error('Failed to unfavorite restaurant:', err);
        });
      } else {
        removeDealOptimistic(id);
        // Background API call
        unfavoriteDeal(id).catch(err => {
          console.error('Failed to unfavorite deal:', err);
        });
      }
    } catch (error) {
      console.error('Error unfavoriting:', error);
    } finally {
      setUnfavoritingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [unfavoritingIds, markAsUnfavorited, removeRestaurantOptimistic, removeDealOptimistic, unfavoriteRestaurant, unfavoriteDeal]);

  const renderRestaurantCard = ({ item: restaurant }: { item: FavoriteRestaurant }) => (
    <RowCard
      data={{
        id: restaurant.id,
        title: restaurant.name,
        subtitle: `${restaurant.distance} • ${restaurant.dealCount} Deals`,
        image: restaurant.imageUrl ? { uri: restaurant.imageUrl } : require('../../../../img/default-rest.png'),
      }}
      variant="favorites-deal-card"
      onPress={() => handleRestaurantPress(restaurant.id)}
    />
  );

  const renderDealCard = ({ item: deal }: { item: FavoriteDeal }) => (
    <RowCard
      data={{
        id: deal.id,
        title: deal.title,
        subtitle: `${deal.restaurantName} • ${deal.distance}`,
        image: deal.imageUrl === 'placeholder' || !deal.imageUrl
          ? require('../../../../img/default-rest.png')
          : { uri: deal.imageUrl },
        userId: deal.userId,
        userProfilePhoto: deal.userProfilePhoto,
        userDisplayName: deal.userDisplayName,
      }}
      variant="favorites-deal-card"
      onPress={() => handleDealPress(deal.id)}
      onUserPress={handleUserPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        No {activeTab === 'restaurants' ? 'Restaurants' : 'Deals'} Favorited
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'restaurants'
          ? 'Start favoriting restaurants to see them here'
          : 'Start favoriting deals to see them here'}
      </Text>
    </View>
  );

  // Show loading skeleton only on initial load
  const isInitialLoading = (activeTab === 'deals' && isDealsLoading && queryDeals.length === 0) ||
                           (activeTab === 'restaurants' && isRestaurantsLoading && queryRestaurants.length === 0);

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonLoader width={120} height={28} borderRadius={4} />
        </View>
        <View style={styles.tabContainer}>
          <SkeletonLoader width={85} height={34} borderRadius={20} />
          <SkeletonLoader width={115} height={34} borderRadius={20} />
        </View>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <RowCardSkeleton key={item} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deals' && styles.activeTab]}
          onPress={() => setActiveTab('deals')}
        >
          <Text style={[styles.tabText, activeTab === 'deals' && styles.activeTabText]}>
            🤝 Deals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
          onPress={() => setActiveTab('restaurants')}
        >
          <Text style={[styles.tabText, activeTab === 'restaurants' && styles.activeTabText]}>
            🍽 Restaurants
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content - FlashList for performant scrolling */}
      <View style={styles.content}>
        {activeTab === 'restaurants' ? (
          <FlashList
            data={restaurants}
            renderItem={renderRestaurantCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <FlashList
            data={deals}
            renderItem={renderDealCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    ...a.bg_white,
    height: 100,
    ...a.justify_end,
    paddingBottom: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    borderBottomWidth: 0.5,
    ...a.border_gray_200,
  },
  headerTitle: {
    fontSize: tokens.fontSize._2xl,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_black,
    fontFamily: 'Inter',
  },
  tabContainer: {
    ...a.flex_row,
    ...a.bg_white,
    paddingHorizontal: tokens.space.xl,
    paddingVertical: tokens.space.sm,
    gap: tokens.space.xs,
  },
  tab: {
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
    ...a.rounded_xl,
    borderWidth: 1,
    ...a.border_gray_200,
    ...a.bg_white,
  },
  activeTab: {
    ...a.bg_primary_600,
    ...a.border_primary_600,
  },
  tabText: {
    fontSize: tokens.fontSize.sm,
    ...a.text_black,
    fontFamily: 'Inter',
    ...a.text_center,
  },
  activeTabText: {
    ...a.text_black,
  },
  content: {
    ...a.flex_1,
    paddingTop: tokens.space.sm,
  },
  emptyState: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingHorizontal: tokens.space._4xl,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.color.text_primary,
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    ...a.text_center,
  },
  emptySubtitle: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_600,
    ...a.text_center,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  skeletonContainer: {
    paddingTop: tokens.space.xs,
  },
});

export default FavoritesPage;
