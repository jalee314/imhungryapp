import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import BottomNavigation from '../../components/BottomNavigation';
import DealCard, { Deal } from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import { fetchRankedDeals, transformDealForUI } from '../../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite, getUserVoteStates, calculateVoteCounts } from '../../services/voteService';
import { supabase } from '../../../lib/supabase';
import { logClick } from '../../services/interactionService';

const CommunityUploadedScreen: React.FC = () => {
  const navigation = useNavigation();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());

  // Fetch deals from database
  const loadDeals = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      
      console.log(`📥 ${isRefreshing ? 'Refreshing' : 'Loading'} community deals...`);
      
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
        .channel('all-interactions-community')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interaction',
          },
          async (payload) => {
            const interaction = payload.new || payload.old;
            
            if (!dealIds.includes(interaction.deal_id)) return;
            if (interaction.interaction_type === 'click') return;
            
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) {
              return;
            }
            
            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);
            
            console.log('⚡ Realtime interaction:', payload.eventType, interaction.interaction_type);
            
            const [voteStates, voteCounts] = await Promise.all([
              getUserVoteStates(dealIds),
              calculateVoteCounts(dealIds)
            ]);
            
            setDeals(prevDeals => prevDeals.map(deal => ({
              ...deal,
              isUpvoted: voteStates[deal.id]?.isUpvoted || false,
              isDownvoted: voteStates[deal.id]?.isDownvoted || false,
              votes: voteCounts[deal.id] || 0,
            })));
          }
        )
        .subscribe();

      // Subscribe to favorite changes
      favoriteChannel.current = supabase
        .channel('user-favorites-community')
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
            
            setDeals(prevDeals => prevDeals.map(deal => 
              deal.id === dealId ? { ...deal, isFavorited } : deal
            ));
          }
        )
        .subscribe();
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

  const handleUpvote = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const wasUpvoted = deal.isUpvoted;
    const wasDownvoted = deal.isDownvoted;

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

    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === dealId ? deal : d
      ));
    });
  };

  const handleDownvote = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const wasDownvoted = deal.isDownvoted;
    const wasUpvoted = deal.isUpvoted;

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

    setDeals(prevDeals => prevDeals.map(d => 
      d.id === dealId ? { ...d, isFavorited: !wasFavorited } : d
    ));

    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      setDeals(prevDeals => prevDeals.map(d => 
        d.id === dealId ? deal : d
      ));
    });
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = deals.findIndex(d => d.id === dealId);
      
      logClick(dealId, positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
        console.error('Failed to log click:', err);
      });
      
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.dealsGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item, index) => (
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
      <TouchableOpacity style={styles.retryButton} onPress={() => loadDeals()}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No community deals available</Text>
      <Text style={styles.emptySubtext}>Check back later for new deals!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with back button and title */}
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <View style={styles.timeBattery}>
            <Text style={styles.time}>9:41</Text>
          </View>
          
          <View style={styles.trackTitle}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#000000" />
            </TouchableOpacity>
            
            <View style={styles.bestValueDeals}>
              <Text style={styles.titleText}>
                <Text style={styles.titleEmoji}>👥 </Text>
                <Text style={styles.titleBold}>Community Uploaded</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8C4C']}
            tintColor="#FF8C4C"
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : deals.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.dealsGrid}>
            {deals.map((deal, index) => (
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
  headerBackground: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    paddingTop: 15,
    position: 'relative',
    zIndex: 2,
  },
  header: {
    alignItems: 'flex-start',
    gap: 16,
    paddingBottom: 4,
  },
  timeBattery: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 21,
    width: '100%',
  },
  time: {
    fontFamily: 'SF Pro',
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
  },
  trackTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 60,
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: '100%',
  },
  backButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestValueDeals: {
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  titleText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#000000',
  },
  titleEmoji: {
    fontWeight: '700',
  },
  titleBold: {
    fontFamily: 'Inter',
    fontWeight: '900',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 100,
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  leftCard: {
    width: '48%',
    marginBottom: 4,
  },
  rightCard: {
    width: '48%',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
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

export default CommunityUploadedScreen;
