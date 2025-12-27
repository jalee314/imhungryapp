/**
 * CommunityUploadedScreen.tsx
 *
 * Featured deals screen using React Query for data management.
 * Shows all community uploaded deals in a grid layout.
 */

import React, { useCallback } from 'react';
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
import DealCard, { Deal } from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../services/voteService';
import { logClick } from '../../services/interactionService';
import { useFeedQuery } from '../../state/queries';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useFavorites } from '../../hooks/useFavorites';

const CommunityUploadedScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal } = useDealUpdate();
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  // Use React Query hook for deals - shares cache with Feed.tsx
  const {
    deals,
    isLoading: loading,
    isRefreshing: refreshing,
    error,
    onRefresh,
    updateDealOptimistic,
    revertDealOptimistic,
  } = useFeedQuery({ enabled: true });

  // Sync updated deals from context when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      deals.forEach((deal) => {
        const updatedDeal = getUpdatedDeal(deal.id);
        if (updatedDeal) {
          updateDealOptimistic(deal.id, updatedDeal);
          clearUpdatedDeal(deal.id);
        }
      });
    }, [deals, getUpdatedDeal, clearUpdatedDeal, updateDealOptimistic])
  );

  // Handlers with optimistic updates
  const handleUpvote = useCallback((dealId: string) => {
    const originalDeal = deals.find((d) => d.id === dealId);
    if (!originalDeal) return;

    const wasUpvoted = originalDeal.isUpvoted;
    const wasDownvoted = originalDeal.isDownvoted;

    updateDealOptimistic(dealId, {
      isUpvoted: !wasUpvoted,
      isDownvoted: false,
      votes: wasUpvoted
        ? originalDeal.votes - 1
        : wasDownvoted
        ? originalDeal.votes + 2
        : originalDeal.votes + 1,
    });

    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      revertDealOptimistic(dealId, originalDeal);
    });
  }, [deals, updateDealOptimistic, revertDealOptimistic]);

  const handleDownvote = useCallback((dealId: string) => {
    const originalDeal = deals.find((d) => d.id === dealId);
    if (!originalDeal) return;

    const wasDownvoted = originalDeal.isDownvoted;
    const wasUpvoted = originalDeal.isUpvoted;

    updateDealOptimistic(dealId, {
      isDownvoted: !wasDownvoted,
      isUpvoted: false,
      votes: wasDownvoted
        ? originalDeal.votes + 1
        : wasUpvoted
        ? originalDeal.votes - 2
        : originalDeal.votes - 1,
    });

    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      revertDealOptimistic(dealId, originalDeal);
    });
  }, [deals, updateDealOptimistic, revertDealOptimistic]);

  const handleFavorite = useCallback((dealId: string) => {
    const originalDeal = deals.find((d) => d.id === dealId);
    if (!originalDeal) return;

    const wasFavorited = originalDeal.isFavorited;

    // Optimistic UI update
    updateDealOptimistic(dealId, { isFavorited: !wasFavorited });

    // Notify global store for instant favorites page update
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
      revertDealOptimistic(dealId, originalDeal);
    });
  }, [deals, updateDealOptimistic, revertDealOptimistic, markAsUnfavorited, markAsFavorited]);

  const handleDealPress = useCallback((dealId: string) => {
    const selectedDeal = deals.find((deal) => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = deals.findIndex((d) => d.id === dealId);
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch((err) => {
        console.error('Failed to log click:', err);
      });
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  }, [deals, navigation]);

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.dealsGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item, index) => (
          <View key={item} style={[index % 2 === 0 ? styles.leftCard : styles.rightCard]}>
            <DealCardSkeleton variant="vertical" />
          </View>
        ))}
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error?.message || 'Failed to load deals'}</Text>
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

      {/* Header */}
      <View style={styles.headerBackground}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <Text style={styles.headerTitleBold}>Featured Deals</Text>
          </Text>
          <View style={styles.headerSpacer} />
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
        {loading && deals.length === 0 ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : deals.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.dealsGrid}>
            {deals.map((deal, index) => (
              <View key={deal.id} style={[index % 2 === 0 ? styles.leftCard : styles.rightCard]}>
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
    height: 100,
    justifyContent: 'flex-end',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
  },
  headerTitleBold: {
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 0,
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: 100,
  },
  leftCard: {
    marginBottom: 4,
    marginRight: 2,
  },
  rightCard: {
    marginBottom: 4,
    marginLeft: 2,
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
