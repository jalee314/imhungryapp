import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import RowCard from '../../components/RowCard';
import RowCardSkeleton from '../../components/RowCardSkeleton';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, spacing, typography } from '../../lib/theme';
import { fetchFavoriteDeals, fetchFavoriteRestaurants, clearFavoritesCache, toggleRestaurantFavorite, FavoriteDeal, FavoriteRestaurant } from '../../services/favoritesService';
import { toggleFavorite } from '../../services/voteService';
import { useFavorites } from '../../hooks/useFavorites';

const FavoritesPage: React.FC = () => {
  const navigation = useNavigation();
  const { markAsUnfavorited, isUnfavorited, clearUnfavorited, clearNewlyFavorited, getNewlyFavoritedDeals } = useFavorites();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'deals'>('deals');
  const [restaurants, setRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [deals, setDeals] = useState<FavoriteDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [unfavoritingIds, setUnfavoritingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasLoadedDeals, setHasLoadedDeals] = useState(false);
  const [hasLoadedRestaurants, setHasLoadedRestaurants] = useState(false);
  const favoriteChannel = useRef<any>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
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

  const loadRestaurants = async (silent: boolean = false) => {
    try {
      if (!silent && !hasLoadedRestaurants) {
        setRestaurantsLoading(true);
      }
      console.log('🔄 Loading restaurants...', silent ? '(silent)' : '');

      if (!hasLoadedInitialData) {
        clearUnfavorited();
        setHasLoadedInitialData(true);
      }

      const restaurantsData = await fetchFavoriteRestaurants();
      console.log('📊 Raw restaurants data:', restaurantsData);
      const filteredData = restaurantsData.filter(restaurant => !isUnfavorited(restaurant.id, 'restaurant'));
      console.log('🔍 Filtered restaurants:', filteredData);
      setRestaurants(filteredData);
      setHasLoadedRestaurants(true);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      if (!silent && !hasLoadedRestaurants) {
        setRestaurantsLoading(false);
      }
    }
  };

  const loadDeals = async (silent: boolean = false) => {
    try {
      if (!silent && !hasLoadedDeals) {
        setDealsLoading(true);
      }
      console.log('🔄 Loading deals...', silent ? '(silent)' : '');

      if (!hasLoadedInitialData) {
        clearUnfavorited();
        setHasLoadedInitialData(true);
      }

      const dealsData = await fetchFavoriteDeals();
      const filteredData = dealsData.filter(deal => !isUnfavorited(deal.id, 'deal'));
      setDeals(filteredData);
      setHasLoadedDeals(true);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      if (!silent && !hasLoadedDeals) {
        setDealsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      clearFavoritesCache();

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
    if (activeTab === 'restaurants') {
      loadRestaurants();
    } else {
      loadDeals();
    }
    setupRealtimeSubscription();

    return () => {
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
      }
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔄 Tab changed to:', activeTab);
    if (activeTab === 'restaurants' && !restaurantsLoading) {
      const isSilent = hasLoadedRestaurants;
      console.log('🔄 Loading restaurants for tab switch', isSilent ? '(silent)' : '');
      loadRestaurants(isSilent);
    } else if (activeTab === 'deals' && !dealsLoading) {
      const isSilent = hasLoadedDeals;
      console.log('🔄 Loading deals for tab switch', isSilent ? '(silent)' : '');
      loadDeals(isSilent);
    }
  }, [activeTab]);

  useFocusEffect(
    React.useCallback(() => {
      setupRealtimeSubscription();

      if (hasLoadedInitialData) {
        setDeals(prev => prev.filter(deal => !isUnfavorited(deal.id, 'deal')));
        setRestaurants(prev => prev.filter(restaurant => !isUnfavorited(restaurant.id, 'restaurant')));

        const newDeals = getNewlyFavoritedDeals();
        if (newDeals.length > 0) {
          setDeals(prev => {
            const existingIds = new Set(prev.map(d => d.id));
            const uniqueNewDeals = newDeals
              .filter(d => !existingIds.has(d.id))
              .map(d => ({
                id: d.id,
                title: d.title,
                description: d.description,
                imageUrl: d.imageUrl,
                restaurantName: d.restaurantName,
                restaurantAddress: d.restaurantAddress,
                distance: d.distance,
                dealCount: 0,
                cuisineName: '',
                categoryName: '',
                createdAt: d.favoritedAt,
                isFavorited: true,
                userId: d.userId,
                userDisplayName: d.userDisplayName,
                userProfilePhoto: d.userProfilePhoto,
                isAnonymous: d.isAnonymous || false,
              }))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return [...uniqueNewDeals, ...prev];
          });
        }
      }

      const silentRefresh = async () => {
        clearFavoritesCache();
        if (activeTab === 'deals') {
          await loadDeals(true);
        } else {
          await loadRestaurants(true);
        }
        clearNewlyFavorited();
      };

      if (hasLoadedInitialData) {
        silentRefresh();
      }

      return () => {
        if (favoriteChannel.current) {
          supabase.removeChannel(favoriteChannel.current);
        }
      };
    }, [activeTab, hasLoadedInitialData])
  );

  const setupRealtimeSubscription = async () => {
    try {
      if (!realtimeEnabled) {
        return;
      }

      if (favoriteChannel.current) {
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

      const userId = user.id.trim();
      if (!userId) {
        console.error('❌ Invalid user ID for realtime subscription');
        return;
      }

      console.log('🔗 Setting up favorites realtime for user:', userId);

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
            console.log('🔄 Favorites realtime update:', payload.eventType, payload);

            const payloadUserId = payload.new?.user_id || payload.old?.user_id;
            if (payloadUserId !== userId) {
              console.log('🔄 Ignoring realtime update for different user:', payloadUserId);
              return;
            }

            if (payload.eventType === 'DELETE') {
              console.log('🔪 Realtime DELETE detected. Updating local state.');
              const oldFavorite = payload.old;

              if (oldFavorite.deal_id) {
                const dealIdToRemove = oldFavorite.deal_id;
                setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealIdToRemove));
              }
              else if (oldFavorite.restaurant_id) {
                const restaurantIdToRemove = oldFavorite.restaurant_id;
                setRestaurants(prevRestaurants => prevRestaurants.filter(r => r.id !== restaurantIdToRemove));
              }
            }
            else if (payload.eventType === 'INSERT') {
              console.log('📥 Realtime INSERT detected. Refreshing active tab.');
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
            if (refreshInterval.current) {
              clearInterval(refreshInterval.current);
              refreshInterval.current = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            // error handling
          }
        });

      favoriteChannel.current = channel;
    } catch (error) {
      console.error('Error setting up favorites realtime subscription:', error);
    }
  };

  const handleRestaurantPress = (restaurantId: string) => {
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
  };

  const handleDealPress = (dealId: string) => {
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
  };

  const handleUserPress = (userId: string) => {
    const deal = deals.find(d => d.userId === userId);
    if (deal && deal.userDisplayName) {
      (navigation as any).navigate('UserProfile', {
        viewUser: true,
        username: deal.userDisplayName,
        userId: userId,
      });
    }
  };

  const handleUnfavorite = async (id: string, type: 'restaurant' | 'deal') => {
    if (unfavoritingIds.has(id)) return;

    try {
      setUnfavoritingIds(prev => new Set(prev).add(id));

      markAsUnfavorited(id, type);

      if (type === 'restaurant') {
        setRestaurants(prev => prev.filter(r => r.id !== id));

        const restaurant = restaurants.find(r => r.id === id);
        if (restaurant) {
          setDeals(prev => prev.filter(d => d.restaurantName !== restaurant.name));
        }
      } else {
        setDeals(prev => prev.filter(d => d.id !== id));
      }

      if (type === 'restaurant') {
        toggleRestaurantFavorite(id, true).catch(err => {
          console.error('Failed to unfavorite restaurant:', err);
        });
      } else {
        toggleFavorite(id, true).catch(err => {
          console.error('Failed to unfavorite deal:', err);
        });
      }

      clearFavoritesCache();

    } catch (error) {
      console.error('Error unfavoriting:', error);
    } finally {
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
    <Box flex={1} center px="5xl" py="7xl">
      <Ionicons name="heart-outline" size={64} color="#ccc" />
      <Text 
        size="lg" 
        weight="semiBold" 
        color="textLight" 
        align="center"
        mt={spacing.xl}
        mb={spacing.m}
      >
        No {activeTab === 'restaurants' ? 'Restaurants' : 'Deals'} Favorited
      </Text>
      <Text size="md" color="textMuted" align="center" lineHeight={20}>
        {activeTab === 'restaurants'
          ? 'Start favoriting restaurants to see them here'
          : 'Start favoriting deals to see them here'
        }
      </Text>
    </Box>
  );

  if (loading) {
    return (
      <Box flex={1} bg="background">
        {/* Header Skeleton */}
        <Box 
          bg="background" 
          height={100} 
          justifyEnd 
          pb="m" 
          px="xl"
          style={{ borderBottomWidth: 0.5, borderBottomColor: '#DEDEDE' }}
        >
          <SkeletonLoader width={120} height={28} borderRadius={4} />
        </Box>

        {/* Tab Skeleton */}
        <Box row bg="background" px="2xl" py="m" gap="xs">
          <SkeletonLoader width={85} height={34} borderRadius={20} />
          <SkeletonLoader width={115} height={34} borderRadius={20} />
        </Box>

        {/* Content Skeleton */}
        <Box pt="xs">
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <RowCardSkeleton key={item} />
          ))}
        </Box>
      </Box>
    );
  }

  const isTabLoading = (activeTab === 'restaurants' && restaurantsLoading && !hasLoadedRestaurants) ||
    (activeTab === 'deals' && dealsLoading && !hasLoadedDeals);

  return (
    <Box flex={1} bg="background">
      {/* Header */}
      <Box 
        bg="background" 
        height={100} 
        justifyEnd 
        pb="m" 
        px="xl"
        style={{ borderBottomWidth: 0.5, borderBottomColor: '#DEDEDE' }}
      >
        <Text 
          size="2xl" 
          weight="semiBold" 
          color="text"
          style={{ fontFamily: typography.fontFamily.regular }}
        >
          Favorites
        </Text>
      </Box>

      {/* Tab Selector */}
      <Box row bg="background" px="2xl" py="m" gap="xs">
        <Pressable
          onPress={() => setActiveTab('deals')}
          rounded="full"
          alignCenter
          justifyCenter
          px="xl"
          py="m"
          height={35}
          bg={activeTab === 'deals' ? 'primaryDark' : 'background'}
          style={{
            borderWidth: 1,
            borderColor: activeTab === 'deals' ? colors.primaryDark : '#d7d7d7',
          }}
        >
          <Text 
            size="md" 
            color="text"
            style={{ fontFamily: typography.fontFamily.regular, lineHeight: 18 }}
          >
            🤝 Deals
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('restaurants')}
          rounded="full"
          alignCenter
          justifyCenter
          px="xl"
          py="m"
          height={35}
          bg={activeTab === 'restaurants' ? 'primaryDark' : 'background'}
          style={{
            borderWidth: 1,
            borderColor: activeTab === 'restaurants' ? colors.primaryDark : '#d7d7d7',
          }}
        >
          <Text 
            size="md" 
            color="text"
            style={{ fontFamily: typography.fontFamily.regular, lineHeight: 18 }}
          >
            🍽 Restaurants
          </Text>
        </Pressable>
      </Box>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, paddingTop: spacing.m }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isTabLoading ? (
          <Box pt="xs">
            {[1, 2, 3, 4, 5].map((item) => (
              <RowCardSkeleton key={item} />
            ))}
          </Box>
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
    </Box>
  );
};

export default FavoritesPage;
