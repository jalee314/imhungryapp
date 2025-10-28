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
import { fetchRankedDeals, transformDealForUI } from '../../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite, getUserVoteStates, calculateVoteCounts } from '../../services/voteService';
import { supabase } from '../../../lib/supabase';
import { logClick } from '../../services/interactionService';
import { dealCacheService } from '../../services/dealCacheService';
import { useDealUpdate } from '../../context/DealUpdateContext';
import { useDataCache } from '../../context/DataCacheContext';
import { useLocation } from '../../context/LocationContext';  

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
  const { currentLocation, updateLocation, selectedCoordinates, hasLocationSet, hasLocationPermission, isInitialLoad } = useLocation();
  
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
    } else {
      // If location is definitively not set after initialization, stop loading.
      setLoading(false);
      setDeals([]);
    }

    dealCacheService.initializeRealtime();
    const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
      setTimeout(() => setDeals(updatedDeals), 0);
    });

    return () => unsubscribe();
  }, [selectedCoordinates, hasLocationSet, isInitialLoad]);

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || deals.length === 0) return;

      const userId = user.id;
      const dealIds = deals.map(d => d.id);

      interactionChannel.current = supabase
        .channel('all-interactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interaction' },
          async (payload) => {
            const interaction = payload.new || payload.old;
            if (!dealIds.includes(interaction.deal_id) || interaction.interaction_type === 'click') return;
            
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;
            
            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);
            
            const changedDealId = interaction.deal_id;
            const [voteStates, voteCounts] = await Promise.all([
              getUserVoteStates([changedDealId]),
              calculateVoteCounts([changedDealId])
            ]);
            
            setTimeout(() => {
              setDeals(prevDeals => prevDeals.map(deal => {
                if (deal.id === changedDealId) {
                  return {
                    ...deal,
                    isUpvoted: voteStates[changedDealId]?.isUpvoted || false,
                    isDownvoted: voteStates[changedDealId]?.isDownvoted || false,
                    votes: voteCounts[changedDealId] || 0,
                  };
                }
                return deal;
              }));
            }, 0);
          }
        )
        .subscribe();

      favoriteChannel.current = supabase
        .channel('user-favorites')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'favorite', filter: `user_id=eq.${userId}` },
          (payload) => {
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

    if (deals.length > 0) {
      setupRealtimeSubscription();
    }

    return () => {
      if (interactionChannel.current) supabase.removeChannel(interactionChannel.current);
      if (favoriteChannel.current) supabase.removeChannel(favoriteChannel.current);
      recentActions.current.clear();
    };
  }, [deals.length]);

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

  // Handlers (handleUpvote, handleDownvote, etc.) are unchanged
  const handleUpvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    setTimeout(() => {
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
    }, 0);
    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      if (originalDeal) {
        setTimeout(() => {
          setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? originalDeal! : d));
        }, 0);
      }
    });
  };

  const handleDownvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    setTimeout(() => {
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
    }, 0);
    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      if (originalDeal) {
        setTimeout(() => {
          setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? originalDeal! : d));
        }, 0);
      }
    });
  };

  const handleFavorite = (dealId: string) => {
    const originalDeal = deals.find(d => d.id === dealId);
    if (!originalDeal) return;
    const wasFavorited = originalDeal.isFavorited;
    setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, isFavorited: !wasFavorited } : d));
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

  const renderItemSeparator = () => <View style={{ width: 8 }} />;

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>✨ Featured Deals</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
        </TouchableOpacity>
      </View>
      <FlatList data={[1, 2, 3]} renderItem={() => <DealCardSkeleton variant="horizontal" />} keyExtractor={(item) => item.toString()} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityList} ItemSeparatorComponent={renderItemSeparator} />
      <View style={styles.sectionSeparator} />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>💰️ Deals For You</Text>
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
    // Priority 1: While location context is doing its initial load, ALWAYS show the skeleton loader.
    if (isInitialLoad) {
      return renderLoadingState();
    }
    
    // Priority 2: Handle errors.
    if (error) {
      return renderErrorState();
    }

    // Priority 3: After initial load is complete, if location is not set, show the prompt.
    if (!hasLocationSet) {
      return renderEmptyState('needs_location');
    }

    // Priority 4: Show skeleton if we are fetching deals for the first time.
    if (loading && deals.length === 0) {
      return renderLoadingState();
    }

    // Priority 5: If filters result in no deals.
    if (filteredDeals.length === 0) {
      return renderEmptyState('no_deals');
    }

    // Priority 6: Render the deals.
    return (
      <>
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
        {!cuisinesLoading && cuisines.length > 0 && (
          <CuisineFilter
            filters={cuisines.map(c => c.name)}
            selectedFilter={selectedCuisineId === 'All' ? 'All' : cuisines.find(c => c.id === selectedCuisineId)?.name || 'All'}
            onFilterSelect={(filterName) => {
                const cuisine = cuisines.find(c => c.name === filterName);
                setSelectedCuisineId(cuisine ? cuisine.id : 'All');
            }}
          />
        )}
        
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
    paddingVertical: 4,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
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
    paddingBottom: 4,
    paddingHorizontal: 10,
  },
  sectionSeparator: {
    height: 0.5,
    backgroundColor: '#AAAAAA',
    marginVertical: 8,
    marginHorizontal: -10,
    width: '110%',
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  leftCard: {
    marginBottom: 8,
    marginRight: 4,
  },
  rightCard: {
    marginBottom: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    paddingBottom: 0,
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