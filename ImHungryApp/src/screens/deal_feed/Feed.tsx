/**
 * Feed Screen - Main deal feed with featured deals and deals for you
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Box, Divider } from '../../components/atoms';
import CuisineFilter from '../../components/CuisineFilter';
import { 
  FeedLoadingState, 
  FeedEmptyState, 
  FeedErrorState,
  FeaturedDealsSection,
  DealsForYouSection,
} from '../../features/feed/components';
import { toggleUpvote, toggleDownvote, toggleFavorite, calculateVoteCounts } from '../../services/voteService';
import { supabase } from '../../../lib/supabase';
import { logClick } from '../../services/interactionService';
import { dealCacheService } from '../../services/dealCacheService';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useDataCache } from '../../hooks/useDataCache';
import { useLocation } from '../../context/LocationContext';
import { useFavorites } from '../../hooks/useFavorites';
import { colors } from '../../lib/theme';
import type { Deal } from '../../features/feed/types';

const Feed: React.FC = () => {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal, postAdded, setPostAdded } = useDealUpdate();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
  const { selectedCoordinates, hasLocationSet, isInitialLoad, isLoading: isLocationLoading } = useLocation();
  const { markAsUnfavorited, markAsFavorited } = useFavorites();
  
  const [selectedCuisineId, setSelectedCuisineId] = useState<string>('All');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());

  // Load deals from cache
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

  // Initialize deals on mount
  useEffect(() => {
    if (isInitialLoad) return;

    if (hasLocationSet) {
      loadDeals();
      dealCacheService.initializeRealtime();
      const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
        setTimeout(() => setDeals(updatedDeals), 0);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [selectedCoordinates, hasLocationSet, isInitialLoad]);

  // Setup realtime subscriptions
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;

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
            if (interaction.interaction_type === 'click') return;
            if (interaction.user_id === userId) return;
            
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;
            
            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);
            
            const changedDealId = interaction.deal_id;
            const voteCounts = await calculateVoteCounts([changedDealId]);
            
            setDeals(prevDeals => prevDeals.map(deal => {
              if (deal.id === changedDealId) {
                return { ...deal, votes: voteCounts[changedDealId] ?? deal.votes };
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
  }, []);

  // Sync with cache on focus
  useFocusEffect(
    React.useCallback(() => {
      const syncWithCache = async () => {
        if (postAdded) {
          const cachedDeals = dealCacheService.getCachedDeals();
          if (cachedDeals.length > 0) {
            setDeals(cachedDeals);
          }
          setPostAdded(false);
          return;
        }
        
        const cachedDeals = dealCacheService.getCachedDeals();
        if (cachedDeals.length > 0) {
          setDeals(prevDeals => {
            const hasChanges = cachedDeals.some((cachedDeal) => {
              const currentDeal = prevDeals.find(d => d.id === cachedDeal.id);
              if (!currentDeal) return true;
              if (cachedDeal.isAnonymous !== currentDeal.isAnonymous) return true;
              if (cachedDeal.author !== currentDeal.author) return true;
              if (cachedDeal.title !== currentDeal.title) return true;
              if (cachedDeal.details !== currentDeal.details) return true;
              
              const cachedVariants = cachedDeal.imageVariants;
              const currentVariants = currentDeal.imageVariants;
              if (!cachedVariants && !currentVariants) return false;
              if (!cachedVariants || !currentVariants) return true;
              return cachedVariants.medium !== currentVariants.medium ||
                     cachedVariants.small !== currentVariants.small ||
                     cachedVariants.thumbnail !== currentVariants.thumbnail;
            });
            
            if (hasChanges || cachedDeals.length !== prevDeals.length) {
              return cachedDeals;
            }
            return prevDeals;
          });
        }
      };
      syncWithCache();

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
    }, [getUpdatedDeal, clearUpdatedDeal, postAdded, setPostAdded])
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

  // Vote handlers with optimistic updates
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
            votes: wasUpvoted ? d.votes - 1 : (wasDownvoted ? d.votes + 2 : d.votes + 1)
          };
        }
        return d;
      });
    });
    
    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      if (originalDeal) {
        setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? originalDeal! : d));
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
            votes: wasDownvoted ? d.votes + 1 : (wasUpvoted ? d.votes - 2 : d.votes - 1)
          };
        }
        return d;
      });
    });
    
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
    
    setDeals(prevDeals => prevDeals.map(d => d.id === dealId ? { ...d, isFavorited: !wasFavorited } : d));
    
    if (wasFavorited) {
      markAsUnfavorited(dealId, 'deal');
    } else {
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

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    if (selectedCuisineId === 'All') return true;
    return deal.cuisineId === selectedCuisineId;
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

  // Render content based on state
  const renderContent = () => {
    if (isInitialLoad || isLocationLoading) {
      return <FeedLoadingState />;
    }
    
    if (error) {
      return <FeedErrorState error={error} onRetry={loadDeals} />;
    }

    if (loading && deals.length === 0) {
      return <FeedLoadingState />;
    }

    if (!hasLocationSet && deals.length === 0) {
      return <FeedEmptyState reason="needs_location" />;
    }

    if (filteredDeals.length === 0) {
      return <FeedEmptyState reason="no_deals" />;
    }

    const cuisinesWithDeals = cuisines.filter(cuisine => 
      deals.some(deal => deal.cuisineId === cuisine.id)
    );

    return (
      <>
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
        
        <FeaturedDealsSection
          deals={communityDeals}
          onDealPress={handleDealPress}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
          onFavorite={handleFavorite}
          onSeeAll={() => navigation.navigate('CommunityUploaded' as never)}
        />
        
        {communityDeals.length > 0 && dealsForYou.length > 0 && (
          <Divider marginVertical="s1" />
        )}
        
        <DealsForYouSection
          deals={dealsForYou}
          onDealPress={handleDealPress}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
          onFavorite={handleFavorite}
        />
      </>
    );
  };

  return (
    <Box flex={1} backgroundColor="background">
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView 
        style={{ flex: 1, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary} 
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </Box>
  );
};

export default Feed;
