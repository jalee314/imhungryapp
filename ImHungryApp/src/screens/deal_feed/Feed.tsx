import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import DealCard, { Deal } from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import CuisineFilter from '../../components/CuisineFilter';
import SkeletonLoader from '../../components/SkeletonLoader';
import { fetchRankedDeals, transformDealForUI } from '../../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite, calculateVoteCounts } from '../../services/voteService';
import { supabase } from '../../../lib/supabase';
import { logClick } from '../../services/interactionService';
import { dealCacheService } from '../../services/dealCacheService';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useDataCache } from '../../hooks/useDataCache';
import { useLocation } from '../../context/LocationContext';
import { useFavorites } from '../../hooks/useFavorites';  

/**
 * Get the current authenticated user's ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

const Feed: React.FC = () => {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal } = useDealUpdate();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
  const { currentLocation, updateLocation, selectedCoordinates, hasLocationSet, hasLocationPermission, isInitialLoad, isLoading: isLocationLoading } = useLocation();
  const { markAsUnfavorited, markAsFavorited } = useFavorites();
  
  const [selectedCuisineId, setSelectedCuisineId] = useState<string>('All');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());

  const loadDeals = async () => {
    try {
      if (deals.length === 0) setLoading(true);
      const cachedDeals = await dealCacheService.getDeals(false, selectedCoordinates || undefined);
      setDeals(cachedDeals);
      setError(null);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't do anything until the initial location load is complete.
    if (isInitialLoad) {
      return;
    }

    if (hasLocationSet) {
      loadDeals();
      
      // Initialize realtime subscriptions for deal cache updates
      dealCacheService.initializeRealtime();
      const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
        setTimeout(() => setDeals(updatedDeals), 0);
      });

      return () => unsubscribe();
    } else {
      // If no location is set after initial load, just stop the loading indicator
      // Don't clear existing deals - they can still be viewed
      setLoading(false);
    }
  }, [selectedCoordinates, hasLocationSet, isInitialLoad]);

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;

      // Clean up existing subscriptions first
      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current);
        interactionChannel.current = null;
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
        favoriteChannel.current = null;
      }

      interactionChannel.current = supabase
        .channel('all-interactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interaction' },
          async (payload: any) => {
            const interaction = payload.new || payload.old;
            // Skip clicks - we don't need realtime updates for those
            if (interaction.interaction_type === 'click') return;
            
            // Skip if this is our own action - optimistic updates already handled it
            // This prevents the "flicker" where DB response overwrites local calculation
            if (interaction.user_id === userId) return;
            
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;
            
            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);
            
            const changedDealId = interaction.deal_id;
            // Only fetch vote count - we preserve our own vote state from optimistic updates
            const voteCounts = await calculateVoteCounts([changedDealId]);
            
            setDeals(prevDeals => prevDeals.map(deal => {
              if (deal.id === changedDealId) {
                return {
                  ...deal,
                  // Only update vote count from other users, keep our own vote state
                  votes: voteCounts[changedDealId] ?? deal.votes,
                };
              }
              return deal;
            }));
          }
        )
        .subscribe();

      favoriteChannel.current = supabase
        .channel('user-favorites')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'favorite', filter: `user_id=eq.${userId}` },
          (payload: any) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id;
            const isFavorited = payload.eventType === 'INSERT';
            setTimeout(() => {
              setDeals(prevDeals => prevDeals.map(deal => 
                deal.id === dealId ? { ...deal, isFavorited } : deal
              ));
            }, 0);
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (interactionChannel.current) supabase.removeChannel(interactionChannel.current);
      if (favoriteChannel.current) supabase.removeChannel(favoriteChannel.current);
      recentActions.current.clear();
    };
  }, []); // 🔥 CRITICAL FIX: Empty dependency array - only setup once on mount

  useFocusEffect(
    React.useCallback(() => {
      const timeoutId = setTimeout(() => {
        setDeals(prevDeals => {
          let hasChanges = false;
          const dealIdsToClear: string[] = [];
          const updatedDeals = prevDeals.map(deal => {
            const updatedDeal = getUpdatedDeal(deal.id);
            if (updatedDeal) {
              hasChanges = true;
              dealIdsToClear.push(deal.id);
              return updatedDeal;
            }
            return deal;
          });
          
          if (hasChanges) {
            setTimeout(() => {
              dealIdsToClear.forEach(id => clearUpdatedDeal(id));
            }, 0);
          }
          
          return hasChanges ? updatedDeals : prevDeals;
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }, [getUpdatedDeal, clearUpdatedDeal])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshDeals = await dealCacheService.getDeals(true);
      setTimeout(() => setDeals(freshDeals), 0);
    } catch (err) {
      console.error('Error refreshing deals:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handlers - optimistic updates happen synchronously to prevent flickering
  const handleUpvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
    // Synchronous optimistic update - no setTimeout to prevent flicker
    setDeals(prevDeals => {
      return prevDeals.map(d => {
        if (d.id === dealId) {
          originalDeal = d;
          const wasUpvoted = d.isUpvoted;
          const wasDownvoted = d.isDownvoted;
          return {
            ...d,
            isUpvoted: !wasUpvoted,
            isDownvoted: false,
            votes: wasUpvoted ? d.votes - 1 : (wasDownvoted ? d.votes + 2 : d.votes + 1)
          };
        }
        return d;
      });
    });
    
    // Background database save
    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      if (originalDeal) {
        setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? originalDeal! : d));
      }
    });
  };

  const handleDownvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
    // Synchronous optimistic update - no setTimeout to prevent flicker
    setDeals(prevDeals => {
      return prevDeals.map(d => {
        if (d.id === dealId) {
          originalDeal = d;
          const wasDownvoted = d.isDownvoted;
          const wasUpvoted = d.isUpvoted;
          return {
            ...d,
            isDownvoted: !wasDownvoted,
            isUpvoted: false,
            votes: wasDownvoted ? d.votes + 1 : (wasUpvoted ? d.votes - 2 : d.votes - 1)
          };
        }
        return d;
      });
    });
    
    // Background database save
    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      if (originalDeal) {
        setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? originalDeal! : d));
      }
    });
  };

  const handleFavorite = (dealId: string) => {
    const originalDeal = deals.find(d => d.id === dealId);
    if (!originalDeal) return;
    const wasFavorited = originalDeal.isFavorited;
    
    // 1. Instant UI update
    setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, isFavorited: !wasFavorited } : d));
    
    // 2. Notify global store for instant favorites page update
    if (wasFavorited) {
      markAsUnfavorited(dealId, 'deal');
    } else {
      // Pass full deal data for instant display in favorites
      markAsFavorited(dealId, 'deal', {
        id: originalDeal.id,
        title: originalDeal.title,
        description: originalDeal.details || '',
        imageUrl: typeof originalDeal.image === 'object' ? originalDeal.image.uri : '',
        restaurantName: originalDeal.restaurant,
        restaurantAddress: originalDeal.restaurantAddress || '',
        distance: originalDeal.milesAway || '',
        userId: originalDeal.userId,
        userDisplayName: originalDeal.userDisplayName,
        userProfilePhoto: originalDeal.userProfilePhoto,
        isAnonymous: originalDeal.isAnonymous,
        favoritedAt: new Date().toISOString(),
      });
    }
    
    // 3. Background database save
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? originalDeal : d));
    });
  };
  
  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = filteredDeals.findIndex(d => d.id === dealId);
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
        console.error('Failed to log click:', err);
      });
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  };


  const filteredDeals = deals.filter(deal => {
    if (selectedCuisineId === 'All') return true;
    return deal.cuisineId === selectedCuisineId;
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

  const renderCommunityDeal = ({ item }: { item: Deal }) => (
    <DealCard deal={item} variant="horizontal" onUpvote={handleUpvote} onDownvote={handleDownvote} onFavorite={handleFavorite} onPress={handleDealPress} />
  );

  const renderItemSeparator = () => <View style={{ width: 0 }} />;

  const renderFilterSkeleton = () => (
    <View style={styles.filterSkeletonContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSkeletonList}>
        {[60, 75, 55, 80, 65, 70].map((width, index) => (
          <SkeletonLoader key={index} width={width} height={34} borderRadius={20} style={styles.filterSkeletonItem} />
        ))}
      </ScrollView>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {/* Filter Skeleton */}
      {renderFilterSkeleton()}
      
      {/* Featured Deals Section Skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={140} height={20} borderRadius={4} />
        <SkeletonLoader width={30} height={30} borderRadius={15} />
      </View>
      <FlatList data={[1, 2, 3]} renderItem={() => <DealCardSkeleton variant="horizontal" />} keyExtractor={(item) => item.toString()} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityList} ItemSeparatorComponent={renderItemSeparator} />
      <View style={styles.skeletonSeparator} />
      
      {/* Deals For You Section Skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonLoader width={130} height={20} borderRadius={4} />
      </View>
      <View style={styles.dealsGrid}>
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <View key={item} style={[index % 2 === 0 ? styles.leftCard : styles.rightCard]}>
            <DealCardSkeleton variant="vertical" />
          </View>
        ))}
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadDeals}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderEmptyState = (reason: 'needs_location' | 'no_deals') => {
    if (reason === 'needs_location') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color="#FF8C4C" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Set your location to see deals</Text>
          <Text style={styles.emptySubtext}>Click the location icon above to get personalized deals in your area!</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Deals Found</Text>
        <Text style={styles.emptySubtext}>Try a different filter or check back later!</Text>
      </View>
    );
  };

  const renderContent = () => {
    // Priority 1: While location context is doing its initial load OR still loading location, ALWAYS show the skeleton loader.
    if (isInitialLoad || isLocationLoading) {
      return renderLoadingState();
    }
    
    // Priority 2: Handle errors.
    if (error) {
      return renderErrorState();
    }

    // Priority 3: Show skeleton if we are fetching deals for the first time.
    // This takes priority over the location check to prevent flashing the "set location" message.
    if (loading && deals.length === 0) {
      return renderLoadingState();
    }

    // Priority 4: After initial load is complete and not loading, if location is not set AND no deals loaded, show the prompt.
    if (!hasLocationSet && deals.length === 0) {
      return renderEmptyState('needs_location');
    }

    // Priority 5: If filters result in no deals.
    if (filteredDeals.length === 0) {
      return renderEmptyState('no_deals');
    }

    // Priority 6: Render the deals with cuisine filter.
    const cuisinesWithDeals = cuisines.filter(cuisine => 
      deals.some(deal => deal.cuisineId === cuisine.id)
    );

    return (
      <>
        {/* Cuisine Filter */}
        {!cuisinesLoading && cuisinesWithDeals.length > 0 && (
          <CuisineFilter
            filters={cuisinesWithDeals.map(c => c.name)}
            selectedFilter={selectedCuisineId === 'All' ? 'All' : cuisinesWithDeals.find(c => c.id === selectedCuisineId)?.name || 'All'}
            onFilterSelect={(filterName) => {
              const cuisine = cuisinesWithDeals.find(c => c.name === filterName);
              setSelectedCuisineId(cuisine ? cuisine.id : 'All');
            }}
          />
        )}
        
        {communityDeals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ Featured Deals</Text>
              <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('CommunityUploaded' as never)}>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
              </TouchableOpacity>
            </View>
            <FlatList data={communityDeals} renderItem={renderCommunityDeal} keyExtractor={(item) => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityList} ItemSeparatorComponent={renderItemSeparator} />
          </>
        )}
        {communityDeals.length > 0 && dealsForYou.length > 0 && <View style={styles.sectionSeparator} />}
        {dealsForYou.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💰️ Deals For You</Text>
            </View>
            <View style={styles.dealsGrid}>
              {dealsForYou.map((deal, index) => (
                <View key={deal.id} style={[index % 2 === 0 ? styles.leftCard : styles.rightCard]}>
                  <DealCard deal={deal} variant="vertical" onUpvote={handleUpvote} onDownvote={handleDownvote} onFavorite={handleFavorite} onPress={handleDealPress} />
                </View>
              ))}
            </View>
          </>
        )}
      </>
    );
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8C4C']} tintColor="#FF8C4C" />
        }
      >
        {renderContent()}

      </ScrollView>
    </View>
  );
};

// Styles are unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    paddingRight: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 17,
    color: '#000000',
  },
  seeAllButton: {
    backgroundColor: '#F1F1F1',
    borderRadius: 50,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityList: {
    paddingLeft: 10.5,
    paddingRight: 10,
  },
  sectionSeparator: {
    height: 0.5,
    backgroundColor: '#DEDEDE',
    marginHorizontal: -20,
    width: '110%',
    marginBottom: 4,
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 100,
  },
  leftCard: {
    marginBottom: 0,
    marginRight: 2,
  },
  rightCard: {
    marginTop: 0,
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  filterSkeletonContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  filterSkeletonList: {
    paddingLeft: 18.5,
    gap: 4,
  },
  filterSkeletonItem: {
    marginRight: 4,
  },
  skeletonSeparator: {
    height: 0.5,
    marginVertical: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#FFA05C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    minHeight: 300,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Inter',
    paddingHorizontal: 20,
  },
});

export default Feed;