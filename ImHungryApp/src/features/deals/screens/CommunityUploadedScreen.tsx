/**
 * CommunityUploadedScreen.tsx
 *
 * Featured deals screen using React Query and FlashList for performant scrolling.
 * Shows all community uploaded deals in a 2-column grid layout.
 * Follows Bluesky's performance patterns.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DealCard from '#/components/cards/DealCard';
import { DealCardSkeleton } from '#/components/cards';
import { Deal } from '#/types';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '#/services/voteService';
import { logClick } from '#/services/interactionService';
import { useFeedQuery } from '#/state/queries';
import { useDealUpdate } from '../hooks/useDealUpdate';
import { useFavorites } from '#/features/profile/hooks/useFavorites';
import { tokens, atoms as a } from '#/ui';

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

  const renderDealCard = useCallback(({ item: deal, index }: { item: Deal; index: number }) => (
    <View style={[styles.gridItem, index % 2 === 0 ? styles.leftCard : styles.rightCard]}>
      <DealCard
        deal={deal}
        variant="vertical"
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        onFavorite={handleFavorite}
        onPress={handleDealPress}
      />
    </View>
  ), [handleUpvote, handleDownvote, handleFavorite, handleDealPress]);

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.dealsGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item, index) => (
          <View key={item} style={[styles.gridItem, index % 2 === 0 ? styles.leftCard : styles.rightCard]}>
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

      {/* Main Content - FlashList for performant scrolling */}
      {loading && deals.length === 0 ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : deals.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlashList
          data={deals}
          renderItem={renderDealCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[tokens.color.primary_600]}
              tintColor={tokens.color.primary_600}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  headerBackground: {
    ...a.bg_white,
    height: 100,
    ...a.justify_end,
    borderBottomWidth: 0.5,
    ...a.border_gray_200,
  },
  headerContent: {
    ...a.flex_row,
    ...a.items_center,
    ...a.justify_between,
    paddingHorizontal: tokens.space.sm,
    paddingBottom: tokens.space.sm,
  },
  backButton: {
    width: 40,
    height: 24,
    ...a.justify_center,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: tokens.fontSize.xl,
    ...a.text_black,
    ...a.text_center,
  },
  headerTitleBold: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.bold,
  },
  headerSpacer: {
    width: 40,
  },
  contentContainer: {
    paddingHorizontal: tokens.space.sm,
    paddingTop: tokens.space.sm,
    paddingBottom: 100,
  },
  gridItem: {
    ...a.flex_1,
    maxWidth: '50%',
  },
  dealsGrid: {
    ...a.flex_row,
    ...a.flex_wrap,
    justifyContent: 'flex-start',
    paddingBottom: 100,
  },
  leftCard: {
    marginBottom: tokens.space.xs,
    marginRight: tokens.space._2xs,
  },
  rightCard: {
    marginBottom: tokens.space.xs,
    marginLeft: tokens.space._2xs,
  },
  loadingContainer: {
    ...a.flex_1,
    paddingHorizontal: tokens.space.sm,
    paddingTop: tokens.space.sm,
  },
  errorContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: tokens.space._5xl,
  },
  errorText: {
    fontSize: tokens.fontSize.md,
    ...a.text_gray_600,
    ...a.text_center,
    marginBottom: tokens.space.lg,
    fontFamily: 'Inter',
  },
  retryButton: {
    ...a.bg_primary_500,
    paddingHorizontal: tokens.space._2xl,
    paddingVertical: tokens.space.md,
    ...a.rounded_sm,
  },
  retryButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.semibold,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: tokens.space._5xl,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    ...a.text_gray_600,
    ...a.text_center,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.semibold,
  },
  emptySubtext: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_400,
    ...a.text_center,
    fontFamily: 'Inter',
  },
});

export default CommunityUploadedScreen;
