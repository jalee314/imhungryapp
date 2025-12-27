/**
 * FavoritesPage.tsx
 *
 * Favorites screen using React Query for data management.
 * Shows favorited deals and restaurants with tabs.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RowCard from '../../components/RowCard';
import RowCardSkeleton from '../../components/RowCardSkeleton';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useFavoritesPageQuery } from '../../state/queries';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoriteDeal, FavoriteRestaurant } from '../../services/favoritesService';

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
        image: deal.imageUrl ? { uri: deal.imageUrl } : require('../../../img/default-rest.png'),
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

  const renderRestaurantCard = (restaurant: FavoriteRestaurant) => (
    <RowCard
      key={restaurant.id}
      data={{
        id: restaurant.id,
        title: restaurant.name,
        subtitle: `${restaurant.distance} • ${restaurant.dealCount} Deals`,
        image: restaurant.imageUrl ? { uri: restaurant.imageUrl } : require('../../../img/default-rest.png'),
      }}
      variant="favorites-deal-card"
      onPress={() => handleRestaurantPress(restaurant.id)}
    />
  );

  const renderDealCard = (deal: FavoriteDeal) => (
    <RowCard
      key={deal.id}
      data={{
        id: deal.id,
        title: deal.title,
        subtitle: `${deal.restaurantName} • ${deal.distance}`,
        image: deal.imageUrl === 'placeholder' || !deal.imageUrl
          ? require('../../../img/default-rest.png')
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'restaurants' ? (
          restaurants.length > 0 ? (
            restaurants.map(renderRestaurantCard)
          ) : (
            renderEmptyState()
          )
        ) : (
          deals.length > 0 ? (
            deals.map(renderDealCard)
          ) : (
            renderEmptyState()
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#ffffff',
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: '#ff8c4c',
    borderColor: '#ff8c4c',
  },
  tabText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  skeletonContainer: {
    paddingTop: 4,
  },
});

export default FavoritesPage;
