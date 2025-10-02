import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import BottomNavigation from '../../components/BottomNavigation';
import DealCard, { Deal } from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import { toggleUpvote, toggleDownvote, toggleFavorite, getUserVoteStates, calculateVoteCounts } from '../../services/voteService';
import { logClick } from '../../services/interactionService';
import { dealCacheService } from '../../services/dealCacheService';
import { supabase } from '../../../lib/supabase';
import { useDealUpdate } from '../../context/DealUpdateContext';

const CommunityUploadedScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal } = useDealUpdate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        const cachedDeals = await dealCacheService.getDeals();
        setDeals(cachedDeals);
        setError(null);
      } catch (err) {
        console.error('Error loading deals:', err);
        setError('Failed to load deals. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDeals();

    // Subscribe to cache updates
    const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
      setDeals(updatedDeals);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ✨ NEW: Sync updated deals from context when screen comes into focus (same as Feed)
  useFocusEffect(
    React.useCallback(() => {
      const dealsToClean: string[] = [];
      
      setDeals(prevDeals => {
        let hasChanges = false;
        const updatedDeals = prevDeals.map(deal => {
          const updatedDeal = getUpdatedDeal(deal.id);
          if (updatedDeal) {
            hasChanges = true;
            dealsToClean.push(deal.id); // Mark for cleanup, don't clear yet
            return updatedDeal;
          }
          return deal;
        });
        
        return hasChanges ? updatedDeals : prevDeals;
      });
      
      // Clear after render completes
      if (dealsToClean.length > 0) {
        setTimeout(() => {
          dealsToClean.forEach(id => clearUpdatedDeal(id));
        }, 0);
      }
    }, [getUpdatedDeal, clearUpdatedDeal])
  );

  // Setup Realtime subscriptions for interactions and favorites
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || deals.length === 0) return;

      const userId = user.id;
      currentUserId.current = userId;
      const dealIds = deals.map(d => d.id);

      // Subscribe to interaction changes (for OTHER users' votes)
      interactionChannel.current = supabase
        .channel('community-interactions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'interaction',
          },
          async (payload) => {
            const interaction = payload.new;
            
            // Only update if it affects our visible deals
            if (!dealIds.includes(interaction.deal_id)) return;
            
            // Skip click events (too noisy)
            if (interaction.interaction_type === 'click') return;
            
            // IMPORTANT: Skip if this is OUR OWN action (optimistic updates handle this)
            if (interaction.user_id === userId) {
              console.log('⏭️ Skipping own action - optimistic update already handled it');
              return;
            }
            
            // Debounce
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;
            
            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);
            
            console.log('⚡ Realtime interaction from another user:', interaction.interaction_type);
            
            // Only recalculate for THIS SPECIFIC deal, not all deals
            const [voteStates, voteCounts] = await Promise.all([
              getUserVoteStates([interaction.deal_id]),
              calculateVoteCounts([interaction.deal_id])
            ]);
            
            // Update only the affected deal
            setDeals(prevDeals => prevDeals.map(deal => {
              if (deal.id === interaction.deal_id) {
                return {
                  ...deal,
                  votes: voteCounts[deal.id] || deal.votes,
                  // Keep current user's vote state (don't override optimistic updates)
                  isUpvoted: deal.isUpvoted,
                  isDownvoted: deal.isDownvoted,
                };
              }
              return deal;
            }));
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Community Interaction channel: SUBSCRIBED');
          }
        });

      // Subscribe to favorite changes (only for current user)
      favoriteChannel.current = supabase
        .channel('community-favorites')
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
            
            // Skip if we're already processing this action
            const actionKey = `favorite-${dealId}`;
            if (recentActions.current.has(actionKey)) {
              console.log('⏭️ Skipping duplicate favorite event');
              return;
            }
            
            const isFavorited = payload.eventType === 'INSERT';
            console.log('⚡ Realtime favorite:', payload.eventType, dealId);
            
            setDeals(prevDeals => prevDeals.map(deal => 
              deal.id === dealId ? { ...deal, isFavorited } : deal
            ));
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Community Favorite channel: SUBSCRIBED');
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

  // Refresh vote states when returning to screen
  // REMOVED useFocusEffect - optimistic updates work without it!

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshDeals = await dealCacheService.getDeals(true);
      setDeals(freshDeals);
    } catch (err) {
      console.error('Error refreshing deals:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleUpvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
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
            votes: wasUpvoted 
              ? d.votes - 1
              : (wasDownvoted ? d.votes + 2 : d.votes + 1)
          };
        }
        return d;
      });
    });

    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      if (originalDeal) {
        setDeals(prevDeals => prevDeals.map(d => 
          d.id === dealId ? originalDeal! : d
        ));
      }
    });
  };

  const handleDownvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
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

    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      if (originalDeal) {
        setDeals(prevDeals => prevDeals.map(d => 
          d.id === dealId ? originalDeal! : d
        ));
      }
    });
  };

  const handleFavorite = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
    setDeals(prevDeals => {
      return prevDeals.map(d => {
        if (d.id === dealId) {
          originalDeal = d;
          return {
            ...d,
            isFavorited: !d.isFavorited
          };
        }
        return d;
      });
    });

    const wasFavorited = originalDeal?.isFavorited || false;
    
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      if (originalDeal) {
        setDeals(prevDeals => prevDeals.map(d => 
          d.id === dealId ? originalDeal! : d
        ));
      }
    });
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = deals.findIndex(d => d.id === dealId);
      
      // Log the click interaction with source 'feed'
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
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
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
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
