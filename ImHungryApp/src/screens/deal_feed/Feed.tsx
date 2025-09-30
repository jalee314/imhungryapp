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
  RefreshControl, // Add this import
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import DealCard, { Deal } from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import CuisineFilter from '../../components/CuisineFilter';
import { fetchRankedDeals, transformDealForUI } from '../../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite, getUserVoteStates, calculateVoteCounts } from '../../services/voteService';
import { supabase } from '../../../lib/supabase';
import { logClick } from '../../services/interactionService';

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
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [error, setError] = useState<string | null>(null);
  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set()); // Track recent actions to avoid double-updates
  
  const cuisineFilters = [
    '🍕 Pizza',
    '🍔 Burgers', 
    '🌮 Mexican',
    '🍣 Japanese',
    '🍝 Italian',
    '🥗 Asian',
    '🍖 BBQ',
    '🥪 Sandwiches',
    '🍜 Vietnamese',
    '🥙 Mediterranean'
  ];

  // Fetch deals from database
  const loadDeals = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      
      console.log(`📥 ${isRefreshing ? 'Refreshing' : 'Loading'} deals...`);
      
      const dbDeals = await fetchRankedDeals();
      const transformedDeals = dbDeals.map(transformDealForUI);
      
      console.log(`✅ Loaded ${transformedDeals.length} deals`);
      setDeals(transformedDeals);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeals(true);
  }, []);

  useEffect(() => {
    loadDeals();
  }, []);

  // Setup Realtime subscriptions
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
            
            // Recalculate vote counts and states
            const [voteStates, voteCounts] = await Promise.all([
              getUserVoteStates(dealIds),
              calculateVoteCounts(dealIds)
            ]);
            
            // Update deals with new data
            setDeals(prevDeals => prevDeals.map(deal => ({
              ...deal,
              isUpvoted: voteStates[deal.id]?.isUpvoted || false,
              isDownvoted: voteStates[deal.id]?.isDownvoted || false,
              votes: voteCounts[deal.id] || 0,
            })));
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
            
            setDeals(prevDeals => prevDeals.map(deal => 
              deal.id === dealId ? { ...deal, isFavorited } : deal
            ));
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

  // Filter deals based on selected cuisine
  const filteredDeals = deals.filter(deal => {
    if (selectedCuisine === 'All') return true;
    return deal.cuisine?.toLowerCase().includes(selectedCuisine.toLowerCase()) || false;
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

  const handleCuisineFilterSelect = (filter: string) => {
    setSelectedCuisine(filter);
  };

  const handleUpvote = (dealId: string) => {

    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const wasUpvoted = deal.isUpvoted;
    const wasDownvoted = deal.isDownvoted;

    // 1. INSTANT UI update (synchronous, no await)
    setDeals(prevDeals => prevDeals.map(d => {
      if (d.id === dealId) {
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
    }));

    // 2. Background database save (async, happens later)
    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      // Revert UI on failure
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === dealId ? deal : d
      ));
    });
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      // Find the position of this deal in the filtered feed
      const positionInFeed = filteredDeals.findIndex(d => d.id === dealId);
      
      // Log the click interaction
      logClick(dealId, positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
        console.error('Failed to log click:', err);
      });
      
      // Navigate to detail screen
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  };
  
  // Handle downvote
  const handleDownvote = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const wasDownvoted = deal.isDownvoted;
    const wasUpvoted = deal.isUpvoted;

    // 1. INSTANT UI update
    setDeals(prevDeals => prevDeals.map(d => {
      if (d.id === dealId) {
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
    }));

    // 2. Background database save
    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === dealId ? deal : d
      ));
    });
  };

  const handleFavorite = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const wasFavorited = deal.isFavorited;

    // 1. INSTANT UI update
    setDeals(prevDeals => prevDeals.map(d => 
      d.id === dealId ? { ...d, isFavorited: !wasFavorited } : d
    ));

    // 2. Background database save
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === dealId ? deal : d
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
      
      {/* Custom Header matching Figma design */}
      <View style={styles.header}>
        <View style={styles.logoLocation}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ImHungri</Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#000000" />
            <Text style={styles.locationText}>Fullerton, CA</Text>
            <Ionicons name="chevron-down" size={12} color="#000000" />
          </View>
        </View>
      </View>

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
        {/* Cuisine Filters */}
        <CuisineFilter
          filters={cuisineFilters}
          selectedFilter={selectedCuisine}
          onFilterSelect={handleCuisineFilterSelect}
        />
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : deals.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Community Uploaded Section - Show first 5 deals horizontally */}
            {communityDeals.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>👥 Community Uploaded</Text>
                  <TouchableOpacity style={styles.seeAllButton}>
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

      <BottomNavigation activeTab="feed" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 44, // Status bar height
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#BCBCBC',
  },
  logoLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  logoContainer: {
    height: 31,
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'MuseoModerno-Bold',
    fontWeight: '700',
    fontSize: 24,
    color: '#FF8C4C',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
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
    paddingVertical: 8,
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
    width: '100%',
  },

  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 100, // Space for bottom navigation
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
    paddingBottom: 100, // Space for bottom navigation
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
