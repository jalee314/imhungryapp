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
  const { cuisines, loading: cuisinesLoading } = useDataCache(); // Get cuisines and loading state
  const { currentLocation, updateLocation, selectedCoordinates } = useLocation();
  const [selectedCuisineId, setSelectedCuisineId] = useState<string>('All');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());
  
  // ✅ Move loadDeals function here, outside the useEffect
  const loadDeals = async () => {
    try {
      setLoading(true);
      const cachedDeals = await dealCacheService.getDeals(false, selectedCoordinates || undefined);
      setTimeout(() => {
        setDeals(cachedDeals);
      }, 0);
      setError(null);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load deals on mount and when location changes
  useEffect(() => {
    loadDeals();

    // Initialize deal_instance realtime
    dealCacheService.initializeRealtime();

    // Subscribe to cache updates for deal_instance changes
    const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
      console.log('📬 Received deal_instance cache update');
      setTimeout(() => {
        setDeals(updatedDeals);
      }, 0);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [selectedCoordinates]); // Re-load when selectedCoordinates changes

  // Load current location is now handled by LocationContext

  // Setup Realtime subscriptions for interactions and favorites
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || deals.length === 0) return;

      const userId = user.id;
      const dealIds = deals.map(d => d.id);

      // Subscribe to ALL interaction changes
      interactionChannel.current = supabase
        .channel('all-interactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interaction',
          },
          async (payload) => {
            const interaction = payload.new || payload.old;
            
            // Only update if it affects our visible deals
            if (!dealIds.includes(interaction.deal_id)) return;
            
            // Skip click events (too noisy, not needed for UI updates)
            if (interaction.interaction_type === 'click') return;
            
            // Debounce: Skip if we just processed this exact action
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) {
              console.log('⏭️ Skipping duplicate realtime event');
              return;
            }
            
            // Mark this action as processed
            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);
            
            console.log('⚡ Realtime interaction:', payload.eventType, interaction.interaction_type);
            
            // ✅ FIX: Only fetch vote state for THE SPECIFIC deal that changed
            const changedDealId = interaction.deal_id;
            const [voteStates, voteCounts] = await Promise.all([
              getUserVoteStates([changedDealId]),  // Only this deal
              calculateVoteCounts([changedDealId])  // Only this deal
            ]);
            
            // ✅ FIX: Only update the specific deal that changed
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
                return deal; // ✅ Return unchanged deal object (no re-render)
              }));
            }, 0);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Interaction channel: SUBSCRIBED');
          }
        });

      // Subscribe to favorite changes
      favoriteChannel.current = supabase
        .channel('user-favorites')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id;
            const isFavorited = payload.eventType === 'INSERT';
            
            console.log('⚡ Realtime favorite:', payload.eventType, dealId);
            
            setTimeout(() => {
              setDeals(prevDeals => prevDeals.map(deal => 
                deal.id === dealId ? { ...deal, isFavorited } : deal
              ));
            }, 0);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Favorite channel: SUBSCRIBED');
          }
        });
    };

    if (deals.length > 0) {
      setupRealtimeSubscription();
    }

    return () => {
      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current);
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
      }
      recentActions.current.clear();
    };
  }, [deals.length]);

  // ✨ NEW: Sync updated deals from context when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Use setTimeout to defer the state update until after the current render cycle
      const timeoutId = setTimeout(() => {
        setDeals(prevDeals => {
          let hasChanges = false;
          const dealIdsToClear: string[] = [];
          const updatedDeals = prevDeals.map(deal => {
            const updatedDeal = getUpdatedDeal(deal.id);
            if (updatedDeal) {
              hasChanges = true;
              dealIdsToClear.push(deal.id); // Collect IDs to clear later
              return updatedDeal;
            }
            return deal;
          });
          
          // Clear updated deals after state update
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

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshDeals = await dealCacheService.getDeals(true);
      setTimeout(() => {
        setDeals(freshDeals);
      }, 0);
    } catch (err) {
      console.error('Error refreshing deals:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Filter deals based on selected cuisine ID
  const filteredDeals = deals.filter(deal => {
    if (selectedCuisineId === 'All') return true;
    return deal.cuisineId === selectedCuisineId;
  });

  // Debug logging
  console.log('Feed Debug:', {
    totalDeals: deals.length,
    filteredDeals: filteredDeals.length,
    selectedCuisineId,
    cuisinesLoaded: cuisines.length,
    sampleDealCuisineId: deals[0]?.cuisineId
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

  const handleCuisineFilterSelect = (filter: string) => {
    setSelectedCuisineId(filter);
  };

  // ✅ FIX: Access deal state INSIDE setter to avoid stale closure
  const handleUpvote = (dealId: string) => {
    // Store original state for revert
    let originalDeal: Deal | undefined;
    
    setTimeout(() => {
      setDeals(prevDeals => {
        return prevDeals.map(d => {
          if (d.id === dealId) {
            // Capture original for revert
            originalDeal = d;
            
            // Use values from CURRENT state (d) not old state
            const wasUpvoted = d.isUpvoted;
            const wasDownvoted = d.isDownvoted;
            
            return {
              ...d,
              isUpvoted: !wasUpvoted,
              isDownvoted: false,
              votes: wasUpvoted 
                ? d.votes - 1
                : (wasDownvoted ? d.votes + 2 : d.votes + 1)
            };
          }
          return d;
        });
      });
    }, 0);

    // ❌ REMOVED: Cache service update (causing circular updates)
    // dealCacheService.updateDealInCache(...)

    // Background database save with revert on error
    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      if (originalDeal) {
        setTimeout(() => {
          setDeals(prevDeals => prevDeals.map(d => 
            d.id === dealId ? originalDeal! : d
          ));
        }, 0);
      }
    });
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      // Find the position of this deal in the filtered feed
      const positionInFeed = filteredDeals.findIndex(d => d.id === dealId);
      
      // Log the click interaction with source 'feed'
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
        console.error('Failed to log click:', err);
      });
      
      // Navigate to detail screen
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  };
  
  // Handle downvote
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
              votes: wasDownvoted 
                ? d.votes + 1
                : (wasUpvoted ? d.votes - 2 : d.votes - 1)
            };
          }
          return d;
        });
      });
    }, 0);

    // ❌ REMOVED: Cache service update
    
    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      if (originalDeal) {
        setTimeout(() => {
          setDeals(prevDeals => prevDeals.map(d => 
            d.id === dealId ? originalDeal! : d
          ));
        }, 0);
      }
    });
  };

  const handleFavorite = (dealId: string) => {
    // FIRST: Find and capture the original deal state
    const originalDeal = deals.find(d => d.id === dealId);
    if (!originalDeal) {
      console.error('Deal not found:', dealId);
      return;
    }

    const wasFavorited = originalDeal.isFavorited;
    console.log('🔄 Toggling favorite for deal:', dealId, 'was favorited:', wasFavorited, '-> will be:', !wasFavorited);
    
    // SECOND: Optimistically update the UI
    setDeals(prevDeals => {
      return prevDeals.map(d => {
        if (d.id === dealId) {
          return {
            ...d,
            isFavorited: !wasFavorited
          };
        }
        return d;
      });
    });

    // THIRD: Save to database with the original state
    console.log('💾 Calling toggleFavorite with wasFavorited:', wasFavorited);
    
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      // Revert to original state
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === dealId ? originalDeal : d
      ));
    });
  };

  const renderCommunityDeal = ({ item }: { item: Deal }) => (
    <DealCard
      deal={item}
      variant="horizontal"
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
      onFavorite={handleFavorite}
      onPress={handleDealPress}
    />
  );

  const renderDealForYou = ({ item }: { item: Deal }) => (
    <DealCard
      deal={item}
      variant="vertical"
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
      onFavorite={handleFavorite}
      onPress={handleDealPress}
    />
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {/* Community Uploaded Skeleton Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👥 Community Uploaded</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={[1, 2, 3]} // Show 3 skeleton cards
        renderItem={() => <DealCardSkeleton variant="horizontal" />}
        keyExtractor={(item) => item.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.communityList}
      />

      {/* Section Separator */}
      <View style={styles.sectionSeparator} />

      {/* Deals For You Skeleton Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>💰️ Deals For You</Text>
      </View>

      <View style={styles.dealsGrid}>
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <View key={item} style={[
            index % 2 === 0 ? styles.leftCard : styles.rightCard
          ]}>
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No deals available</Text>
      <Text style={styles.emptySubtext}>Check back later for new deals!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8C4C']} // Android spinner color
            tintColor="#FF8C4C" // iOS spinner color
            title="Pull to refresh" // iOS text
            titleColor="#666" // iOS text color
          />
        }
      >
        {/* Cuisine Filters - Only show when cuisines are loaded */}
        {!cuisinesLoading && cuisines.length > 0 && (
          <CuisineFilter
            filters={cuisines.map(c => c.name)}
            selectedFilter={
              selectedCuisineId === 'All' 
                ? 'All' 
                : cuisines.find(c => c.id === selectedCuisineId)?.name || 'All'
            }
            onFilterSelect={(filterName) => {
              if (filterName === 'All') {
                setSelectedCuisineId('All');
              } else {
                const cuisine = cuisines.find(c => c.name === filterName);
                if (cuisine) {
                  setSelectedCuisineId(cuisine.id);
                }
              }
            }}
          />
        )}
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : filteredDeals.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Community Uploaded Section - Show first 5 deals horizontally */}
            {communityDeals.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>👥 Community Uploaded</Text>
                  <TouchableOpacity 
                    style={styles.seeAllButton}
                    onPress={() => navigation.navigate('CommunityUploaded' as never)}
                  >
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={communityDeals}
                  renderItem={renderCommunityDeal}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.communityList}
                />
              </>
            )}

            {/* Section Separator */}
            {communityDeals.length > 0 && dealsForYou.length > 0 && (
              <View style={styles.sectionSeparator} />
            )}

            {/* Deals For You Section - Show ALL deals in grid */}
            {dealsForYou.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>💰️ Deals For You</Text>
                </View>

                <View style={styles.dealsGrid}>
                  {dealsForYou.map((deal, index) => (
                    <View key={deal.id} style={[
                      index % 2 === 0 ? styles.leftCard : styles.rightCard
                    ]}>
                      <DealCard
                        deal={deal}
                        variant="vertical"
                        onUpvote={handleUpvote}
                        onDownvote={handleDownvote}
                        onFavorite={handleFavorite}
                        onPress={handleDealPress}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  headerBottomFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 19,
  },
  logoImage: {
    width: 120,
    // Let height scale automatically based on aspect ratio
  },
  locationIconContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
  },
  seeAllButton: {
    backgroundColor: '#F1F1F1',
    borderWidth: 0.5,
    borderColor: '#AAAAAA',
    borderRadius: 50,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityList: {
    paddingBottom: 4,
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
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 0, // MainAppLayout handles bottom navigation spacing
  },
  leftCard: {
    width: '48%',
    marginBottom: 8,
  },
  rightCard: {
    width: '48%',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    paddingBottom: 0, // MainAppLayout handles bottom navigation spacing
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
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
  },
});

export default Feed;
