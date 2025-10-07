import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import RowCard from '../../components/RowCard';
import { fetchFavoriteDeals, fetchFavoriteRestaurants, clearFavoritesCache, toggleRestaurantFavorite, FavoriteDeal, FavoriteRestaurant } from '../../services/favoritesService';
import { toggleFavorite } from '../../services/voteService';
import { useFavorites } from '../../context/FavoritesContext';

const FavoritesPage: React.FC = () => {
  const navigation = useNavigation();
  const { markAsUnfavorited, isUnfavorited, clearUnfavorited } = useFavorites();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'deals'>('deals');
  const [restaurants, setRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [deals, setDeals] = useState<FavoriteDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [unfavoritingIds, setUnfavoritingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const favoriteChannel = useRef<any>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Clear any stale unfavorited state when loading fresh data
      clearUnfavorited();
      const [restaurantsData, dealsData] = await Promise.all([
        fetchFavoriteRestaurants(),
        fetchFavoriteDeals(),
      ]);
      setRestaurants(restaurantsData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      setRestaurantsLoading(true);
      console.log('🔄 Loading restaurants...');
      
      // Clear unfavorited state on initial load
      if (!hasLoadedInitialData) {
        clearUnfavorited();
        setHasLoadedInitialData(true);
      }
      
      const restaurantsData = await fetchFavoriteRestaurants();
      console.log('📊 Raw restaurants data:', restaurantsData);
      // Filter out unfavorited restaurants
      const filteredData = restaurantsData.filter(restaurant => !isUnfavorited(restaurant.id, 'restaurant'));
      console.log('🔍 Filtered restaurants:', filteredData);
      setRestaurants(filteredData);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const loadDeals = async () => {
    try {
      setDealsLoading(true);
      
      // Clear unfavorited state on initial load
      if (!hasLoadedInitialData) {
        clearUnfavorited();
        setHasLoadedInitialData(true);
      }
      
      const dealsData = await fetchFavoriteDeals();
      // Filter out unfavorited deals
      const filteredData = dealsData.filter(deal => !isUnfavorited(deal.id, 'deal'));
      setDeals(filteredData);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setDealsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear cache to ensure fresh data
      clearFavoritesCache();
      
      // Only refresh the active tab's data, preserve other state
      if (activeTab === 'deals') {
        await loadDeals();
      } else {
        await loadRestaurants();
      }
    } catch (error) {
      console.error('Error refreshing favorites:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only load the initial tab's data for faster startup
    if (activeTab === 'restaurants') {
      loadRestaurants();
    } else {
      loadDeals();
    }
    setupRealtimeSubscription();
    
    return () => {
      // Cleanup subscription on unmount
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
      }
      // Cleanup refresh interval
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, []);

  // Load data when tab changes
  useEffect(() => {
    console.log('🔄 Tab changed to:', activeTab);
    if (activeTab === 'restaurants' && !restaurantsLoading) {
      console.log('🔄 Loading restaurants for tab switch');
      loadRestaurants();
    } else if (activeTab === 'deals' && !dealsLoading) {
      console.log('🔄 Loading deals for tab switch');
      loadDeals();
    }
  }, [activeTab]);

  // Re-establish subscription when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setupRealtimeSubscription();
      
      return () => {
        // Cleanup when screen loses focus
        if (favoriteChannel.current) {
          supabase.removeChannel(favoriteChannel.current);
        }
      };
    }, [])
  );

  const setupRealtimeSubscription = async () => {
    try {
      // Skip realtime if disabled
      if (!realtimeEnabled) {
        console.log('🔄 Realtime disabled, using fallback refresh mechanism');
        if (!refreshInterval.current) {
          refreshInterval.current = setInterval(() => {
            console.log('🔄 Fallback refresh triggered');
            if (activeTab === 'deals') {
              loadDeals();
            } else {
              loadRestaurants();
            }
          }, 30000); // Refresh every 30 seconds
        }
        return;
      }

      // Prevent multiple subscriptions
      if (favoriteChannel.current) {
        console.log('🔄 Realtime subscription already exists, cleaning up first...');
        try {
          await supabase.removeChannel(favoriteChannel.current);
        } catch (error) {
          console.error('Error removing existing channel:', error);
        }
        favoriteChannel.current = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) {
        console.log('❌ No user found for realtime subscription');
        return;
      }

      console.log('🔗 Setting up favorites realtime for user:', user.id);

      // Ensure user ID is properly formatted for Supabase filter
      const userId = user.id.trim();
      if (!userId) {
        console.error('❌ Invalid user ID for realtime subscription');
        return;
      }

      // Subscribe to favorite changes for the current user
      // Use a more specific channel name to avoid conflicts
      const channel = supabase
        .channel(`favorites-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            console.log('🔄 Favorites realtime update:', payload.eventType);
            
            // Check if this change is for the current user
            const payloadUserId = payload.new?.user_id || payload.old?.user_id;
            if (payloadUserId !== userId) {
              console.log('🔄 Ignoring realtime update for different user:', payloadUserId);
              return;
            }
            
            // Handle specific changes for better performance
            if (payload.eventType === 'INSERT') {
              // New favorite added - reload only the active tab
              if (activeTab === 'deals') {
                loadDeals();
              } else {
                loadRestaurants();
              }
            } else if (payload.eventType === 'DELETE') {
              // Favorite removed - remove from local state
              const dealId = payload.old?.deal_id;
              if (dealId) {
                setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealId));
                // For restaurants, we need to check if any restaurant should be removed
                // This is a simplified approach - reload restaurants to be safe
                if (activeTab === 'restaurants') {
                  loadRestaurants();
                }
              }
            } else {
              // For other events or if we can't determine the change, reload active tab
              if (activeTab === 'deals') {
                loadDeals();
              } else {
                loadRestaurants();
              }
            }
          }
        )
        .subscribe((status: any, err: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Favorites realtime channel: SUBSCRIBED');
            // Clear any existing refresh interval since realtime is working
            if (refreshInterval.current) {
              clearInterval(refreshInterval.current);
              refreshInterval.current = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Favorites realtime channel error:', err);
            // Disable realtime after multiple failures and use fallback
            console.log('🔄 Disabling realtime due to persistent errors, using fallback refresh');
            setRealtimeEnabled(false);
            // Set up fallback refresh mechanism
            if (!refreshInterval.current) {
              console.log('🔄 Setting up fallback refresh mechanism...');
              refreshInterval.current = setInterval(() => {
                console.log('🔄 Fallback refresh triggered');
                if (activeTab === 'deals') {
                  loadDeals();
                } else {
                  loadRestaurants();
                }
              }, 30000); // Refresh every 30 seconds
            }
          } else if (status === 'TIMED_OUT') {
            console.error('⏰ Favorites realtime channel timed out');
          } else if (status === 'CLOSED') {
            console.log('🔒 Favorites realtime channel closed');
          }
        });

      // Store the channel reference AFTER subscription
      favoriteChannel.current = channel;
    } catch (error) {
      console.error('Error setting up favorites realtime subscription:', error);
      // Fallback to interval-based refresh on error
      if (!refreshInterval.current) {
        console.log('🔄 Setting up fallback refresh due to subscription error');
        refreshInterval.current = setInterval(() => {
          if (activeTab === 'deals') {
            loadDeals();
          } else {
            loadRestaurants();
          }
        }, 30000);
      }
    }
  };

  const handleRestaurantPress = (restaurantId: string) => {
    // Find the restaurant object from the restaurants array
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      // Transform FavoriteRestaurant to DiscoverRestaurant format expected by RestaurantDetailScreen
      const restaurantForDetail = {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        logo_image: restaurant.imageUrl,
        deal_count: restaurant.dealCount,
        distance_miles: parseFloat(restaurant.distance.replace('mi', '').replace('m', '')) || 0,
        lat: 0, // We'll need to get this from the restaurant data if needed
        lng: 0, // We'll need to get this from the restaurant data if needed
      };
      
      (navigation as any).navigate('RestaurantDetail', { restaurant: restaurantForDetail });
    }
  };

  const handleDealPress = (dealId: string) => {
    // Find the deal object from the deals array
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      // Transform FavoriteDeal to Deal format expected by DealDetailScreen
      const dealForDetail = {
        id: deal.id,
        title: deal.title,
        restaurant: deal.restaurantName,
        details: deal.description,
        image: deal.imageUrl ? { uri: deal.imageUrl } : require('../../../img/Default_pfp.svg.png'),
        votes: 0, // We don't have vote data in favorites
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: true, // It's favorited since it's in favorites
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
  };

  const handleUserPress = (userId: string) => {
    // Find the deal to get the username
    const deal = deals.find(d => d.userId === userId);
    if (deal && deal.userDisplayName) {
      (navigation as any).navigate('ProfilePage', { 
        viewUser: true, 
        username: deal.userDisplayName,
        userId: userId 
      });
    }
  };

  const handleUnfavorite = async (id: string, type: 'restaurant' | 'deal') => {
    // Prevent multiple rapid clicks
    if (unfavoritingIds.has(id)) return;
    
    try {
      // Add to unfavoriting set to prevent duplicate clicks
      setUnfavoritingIds(prev => new Set(prev).add(id));
      
      // 1. MARK AS UNFAVORITED IN GLOBAL STATE (persists across navigation)
      markAsUnfavorited(id, type);
      
      // 2. INSTANT UI UPDATE (optimistic update)
      if (type === 'restaurant') {
        // Remove restaurant from UI immediately
        setRestaurants(prev => prev.filter(r => r.id !== id));
        
        // Also remove all deals from this restaurant
        const restaurant = restaurants.find(r => r.id === id);
        if (restaurant) {
          setDeals(prev => prev.filter(d => d.restaurantName !== restaurant.name));
        }
      } else {
        // Remove deal from UI immediately
        setDeals(prev => prev.filter(d => d.id !== id));
      }
      
      // 3. BACKGROUND API CALLS (fire and forget)
      if (type === 'restaurant') {
        // Unfavorite restaurant directly in background
        toggleRestaurantFavorite(id, true).catch(err => {
          console.error('Failed to unfavorite restaurant:', err);
        });
      } else {
        // Unfavorite specific deal in background
        toggleFavorite(id, true).catch(err => {
          console.error('Failed to unfavorite deal:', err);
        });
      }
      
      // 4. CLEAR CACHE IMMEDIATELY (synchronous)
      clearFavoritesCache();
      
    } catch (error) {
      console.error('Error unfavoriting:', error);
    } finally {
      // Remove from unfavoriting set
      setUnfavoritingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

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
        // Use placeholder image for old deals, Cloudinary URL for new ones
        image: deal.imageUrl === 'placeholder' || !deal.imageUrl
          ? require('../../../img/albert.webp') 
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
          : 'Start favoriting deals to see them here'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c4c" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  const isTabLoading = (activeTab === 'restaurants' && restaurantsLoading) || (activeTab === 'deals' && dealsLoading);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isTabLoading ? (
          <View style={styles.tabLoadingContainer}>
            <ActivityIndicator size="small" color="#ff8c4c" />
            <Text style={styles.tabLoadingText}>
              Loading {activeTab === 'restaurants' ? 'restaurants' : 'deals'}...
            </Text>
          </View>
        ) : activeTab === 'restaurants' ? (
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
    paddingBottom: 0, // MainAppLayout handles bottom navigation spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d7d7d7',
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
    paddingBottom: 20, // Add extra padding at bottom
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
  tabLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  tabLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
});

export default FavoritesPage;
