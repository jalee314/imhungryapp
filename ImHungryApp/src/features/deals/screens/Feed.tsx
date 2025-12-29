/**
 * Feed.tsx
 *
 * Main deals feed screen using React Query (Bluesky pattern).
 * Uses FlashList for performant horizontal scrolling.
 * 
 * Key changes from previous implementation:
 * - Uses useFeedQuery hook for data fetching + realtime
 * - FlashList for better scroll performance
 * - No more manual useState for deals array
 * - No more dealCacheService subscription
 * - Optimistic updates via queryClient.setQueryData
 * - Cleaner separation of concerns
 * - Uses design tokens for consistent styling
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { tokens, atoms as a } from '#/ui';

// Calculate horizontal card dimensions to match DealCard.tsx
const { width: screenWidth } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;
const HORIZONTAL_CARD_PADDING = scale(10);
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - scale(20)) / 1.32;
const HORIZONTAL_IMAGE_WIDTH = HORIZONTAL_CARD_WIDTH - scale(16);
const HORIZONTAL_IMAGE_HEIGHT = HORIZONTAL_IMAGE_WIDTH * 0.64;
const HORIZONTAL_CARD_HEIGHT = HORIZONTAL_IMAGE_HEIGHT + scale(113);
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DealCard from '#/components/cards/DealCard';
import { Deal } from '#/types';
import { DealCardSkeleton } from '#/components/cards';
import { CuisineFilter } from '#/features/deals';
import SkeletonLoader from '#/components/SkeletonLoader';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '#/services/voteService';
import { logClick } from '#/services/interactionService';
import { useFeedQuery } from '#/state/queries';
import { useDealUpdate } from '#/features/deals/hooks/useDealUpdate';
import { useDataCache } from '#/hooks/useDataCache';
import { useLocation } from '#/features/discover';
import { useFavorites } from '#/features/profile/hooks/useFavorites';

const Feed: React.FC = () => {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal } = useDealUpdate();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
  const { selectedCoordinates, hasLocationSet, isInitialLoad } = useLocation();
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  const [selectedCuisineId, setSelectedCuisineId] = useState<string>('All');

  // Use React Query hook for deals - handles fetching, caching, and realtime
  const {
    deals,
    isLoading: loading,
    isRefreshing: refreshing,
    error,
    onRefresh,
    updateDealOptimistic,
    revertDealOptimistic,
  } = useFeedQuery({
    coordinates: selectedCoordinates,
    enabled: !isInitialLoad && hasLocationSet,
  });

  // Apply updates from DealUpdateStore when returning to this screen
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

  // Handlers - optimistic updates happen synchronously to prevent flickering
  const handleUpvote = useCallback((dealId: string) => {
    const originalDeal = deals.find((d) => d.id === dealId);
    if (!originalDeal) return;

    const wasUpvoted = originalDeal.isUpvoted;
    const wasDownvoted = originalDeal.isDownvoted;

    // Optimistic update
    updateDealOptimistic(dealId, {
      isUpvoted: !wasUpvoted,
      isDownvoted: false,
      votes: wasUpvoted
        ? originalDeal.votes - 1
        : wasDownvoted
        ? originalDeal.votes + 2
        : originalDeal.votes + 1,
    });

    // Background database save
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

    // Optimistic update
    updateDealOptimistic(dealId, {
      isDownvoted: !wasDownvoted,
      isUpvoted: false,
      votes: wasDownvoted
        ? originalDeal.votes + 1
        : wasUpvoted
        ? originalDeal.votes - 2
        : originalDeal.votes - 1,
    });

    // Background database save
    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      revertDealOptimistic(dealId, originalDeal);
    });
  }, [deals, updateDealOptimistic, revertDealOptimistic]);

  const handleFavorite = useCallback((dealId: string) => {
    const originalDeal = deals.find((d) => d.id === dealId);
    if (!originalDeal) return;

    const wasFavorited = originalDeal.isFavorited;

    // 1. Optimistic UI update
    updateDealOptimistic(dealId, { isFavorited: !wasFavorited });

    // 2. Notify global store for instant favorites page update
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

    // 3. Background database save
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      revertDealOptimistic(dealId, originalDeal);
    });
  }, [deals, updateDealOptimistic, revertDealOptimistic, markAsUnfavorited, markAsFavorited]);

  const handleDealPress = useCallback((dealId: string) => {
    const selectedDeal = deals.find((deal) => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = filteredDeals.findIndex((d) => d.id === dealId);
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch((err) => {
        console.error('Failed to log click:', err);
      });
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  }, [deals, navigation]);

  // Filter deals by cuisine
  const filteredDeals = deals.filter((deal) => {
    if (selectedCuisineId === 'All') return true;
    return deal.cuisineId === selectedCuisineId;
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

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

  const renderItemSeparator = () => <View style={{ width: 0 }} />;

  const renderFilterSkeleton = () => (
    <View style={styles.filterSkeletonContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterSkeletonList}
      >
        {[60, 75, 55, 80, 65, 70].map((width, index) => (
          <SkeletonLoader
            key={index}
            width={width}
            height={34}
            borderRadius={20}
            style={styles.filterSkeletonItem}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {renderFilterSkeleton()}

      <View style={styles.sectionHeader}>
        <SkeletonLoader width={140} height={20} borderRadius={4} />
        <SkeletonLoader width={30} height={30} borderRadius={15} />
      </View>
      <View style={styles.skeletonListWrapper}>
        <FlashList
          data={[1, 2, 3]}
          renderItem={() => <DealCardSkeleton variant="horizontal" />}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.communityList}
          ItemSeparatorComponent={renderItemSeparator}
        />
      </View>
      <View style={styles.skeletonSeparator} />

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
      <Text style={styles.errorText}>{error?.message || 'Failed to load deals. Please try again.'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
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
          <Text style={styles.emptySubtext}>
            Click the location icon above to get personalized deals in your area!
          </Text>
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
    // Priority 1: While location context is doing its initial load, show skeleton
    if (isInitialLoad) {
      return renderLoadingState();
    }

    // Priority 2: Handle errors
    if (error) {
      return renderErrorState();
    }

    // Priority 3: After initial load, if location is not set AND no deals, show prompt
    if (!hasLocationSet && deals.length === 0) {
      return renderEmptyState('needs_location');
    }

    // Priority 4: Show skeleton if loading for the first time
    if (loading && deals.length === 0) {
      return renderLoadingState();
    }

    // Priority 5: If filters result in no deals
    if (filteredDeals.length === 0) {
      return renderEmptyState('no_deals');
    }

    // Priority 6: Render the deals with cuisine filter
    const cuisinesWithDeals = cuisines.filter((cuisine) =>
      deals.some((deal) => deal.cuisineId === cuisine.id)
    );

    return (
      <>
        {/* Cuisine Filter */}
        {!cuisinesLoading && cuisinesWithDeals.length > 0 && (
          <CuisineFilter
            filters={cuisinesWithDeals.map((c) => c.name)}
            selectedFilter={
              selectedCuisineId === 'All'
                ? 'All'
                : cuisinesWithDeals.find((c) => c.id === selectedCuisineId)?.name || 'All'
            }
            onFilterSelect={(filterName) => {
              const cuisine = cuisinesWithDeals.find((c) => c.name === filterName);
              setSelectedCuisineId(cuisine ? cuisine.id : 'All');
            }}
          />
        )}

        {communityDeals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ Featured Deals</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('CommunityUploaded' as never)}
              >
                <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
              </TouchableOpacity>
            </View>
            <View style={styles.communityListWrapper}>
              <FlashList
                data={communityDeals}
                renderItem={renderCommunityDeal}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.communityList}
                ItemSeparatorComponent={renderItemSeparator}
              />
            </View>
          </>
        )}

        {communityDeals.length > 0 && dealsForYou.length > 0 && (
          <View style={styles.sectionSeparator} />
        )}

        {dealsForYou.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💰️ Deals For You</Text>
            </View>
            <View style={styles.dealsGrid}>
              {dealsForYou.map((deal, index) => (
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tokens.color.primary_600]}
            tintColor={tokens.color.primary_600}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  content: {
    ...a.flex_1,
    ...a.bg_white,
    ...a.pt_xs,
  },
  sectionHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.py_xs,
    ...a.pl_lg,
    ...a.pr_sm,
  },
  sectionTitle: {
    ...a.font_bold,
    fontFamily: 'Inter',
    fontSize: 17,
    color: tokens.color.black,
  },
  sectionSeparator: {
    height: 0.5,
    backgroundColor: tokens.color.gray_200,
    marginHorizontal: -tokens.space.xl,
    width: '110%',
    ...a.mb_xs,
  },
  seeAllButton: {
    ...a.justify_center,
    ...a.align_center,
    ...a.bg_gray_100,
    ...a.rounded_full,
    width: 30,
    height: 30,
  },
  communityList: {
    paddingLeft: 10.5,
    ...a.pr_sm,
  },
  communityListWrapper: {
    height: HORIZONTAL_CARD_HEIGHT,
  },
  skeletonListWrapper: {
    height: HORIZONTAL_CARD_HEIGHT,
  },
  dealsGrid: {
    ...a.flex_row,
    ...a.flex_wrap,
    ...a.justify_start,
    ...a.px_sm,
    paddingBottom: 100,
  },
  leftCard: {
    ...a.mb_0,
    marginRight: tokens.space._2xs,
  },
  rightCard: {
    ...a.mt_0,
    marginLeft: tokens.space._2xs,
  },
  loadingContainer: {
    ...a.flex_1,
    ...a.pb_0,
  },
  filterSkeletonContainer: {
    ...a.mt_xs,
    ...a.mb_sm,
  },
  filterSkeletonList: {
    ...a.gap_xs,
    paddingLeft: 18.5,
  },
  filterSkeletonItem: {
    ...a.mr_xs,
  },
  skeletonSeparator: {
    ...a.my_sm,
    height: 0.5,
  },
  errorContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
    paddingVertical: tokens.space._5xl,
  },
  errorText: {
    ...a.text_md,
    ...a.text_center,
    ...a.mb_lg,
    ...a.text_gray_600,
    fontFamily: 'Inter',
  },
  retryButton: {
    ...a.bg_primary_500,
    ...a.px_2xl,
    ...a.py_md,
    ...a.rounded_sm,
  },
  retryButtonText: {
    ...a.text_white,
    ...a.text_md,
    ...a.font_semibold,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
    paddingVertical: tokens.space._5xl,
    minHeight: 300,
  },
  emptyIcon: {
    ...a.mb_lg,
  },
  emptyText: {
    ...a.text_lg,
    ...a.text_gray_600,
    ...a.text_center,
    ...a.mb_sm,
    ...a.font_semibold,
    fontFamily: 'Inter',
  },
  emptySubtext: {
    ...a.text_sm,
    ...a.text_gray_400,
    ...a.text_center,
    ...a.px_xl,
    fontFamily: 'Inter',
  },
});

export default Feed;
