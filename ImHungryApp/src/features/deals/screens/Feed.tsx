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
import { tokens } from '#/ui';

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
import DealCard, { Deal } from '#/components/DealCard';
import DealCardSkeleton from '#/components/DealCardSkeleton';
import CuisineFilter from '#/components/CuisineFilter';
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
    flex: 1,
    backgroundColor: tokens.color.white,
  },
  content: {
    flex: 1,
    backgroundColor: tokens.color.white,
    paddingTop: tokens.space.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.space.xs,
    paddingBottom: tokens.space.xs,
    paddingLeft: tokens.space.lg,
    paddingRight: tokens.space.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.bold,
    fontSize: 17,
    color: tokens.color.black,
  },
  seeAllButton: {
    backgroundColor: tokens.color.gray_100,
    borderRadius: tokens.radius.full,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityList: {
    paddingLeft: 10.5,
    paddingRight: tokens.space.sm,
  },
  communityListWrapper: {
    height: HORIZONTAL_CARD_HEIGHT, // Match actual card height for FlashList
  },
  skeletonListWrapper: {
    height: HORIZONTAL_CARD_HEIGHT, // Match the community list height
  },
  sectionSeparator: {
    height: 0.5,
    backgroundColor: tokens.color.gray_200,
    marginHorizontal: -tokens.space.xl,
    width: '110%',
    marginBottom: tokens.space.xs,
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingLeft: tokens.space.sm,
    paddingRight: tokens.space.sm,
    paddingBottom: 100,
  },
  leftCard: {
    marginBottom: 0,
    marginRight: tokens.space._2xs,
  },
  rightCard: {
    marginTop: 0,
    marginLeft: tokens.space._2xs,
  },
  loadingContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  filterSkeletonContainer: {
    marginTop: tokens.space.xs,
    marginBottom: tokens.space.sm,
  },
  filterSkeletonList: {
    paddingLeft: 18.5,
    gap: tokens.space.xs,
  },
  filterSkeletonItem: {
    marginRight: tokens.space.xs,
  },
  skeletonSeparator: {
    height: 0.5,
    marginVertical: tokens.space.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.space._5xl,
  },
  errorText: {
    fontSize: tokens.fontSize.md,
    color: tokens.color.gray_600,
    textAlign: 'center',
    marginBottom: tokens.space.lg,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: tokens.color.primary_500,
    paddingHorizontal: tokens.space._2xl,
    paddingVertical: tokens.space.md,
    borderRadius: tokens.radius.sm,
  },
  retryButtonText: {
    color: tokens.color.white,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.semibold,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.space._5xl,
    minHeight: 300,
  },
  emptyIcon: {
    marginBottom: tokens.space.lg,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    color: tokens.color.gray_600,
    textAlign: 'center',
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.semibold,
  },
  emptySubtext: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.gray_400,
    textAlign: 'center',
    fontFamily: 'Inter',
    paddingHorizontal: tokens.space.xl,
  },
});

export default Feed;
