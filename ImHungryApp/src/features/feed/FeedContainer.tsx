/**
 * @file FeedContainer — Composed container that wires useFeed
 * to all feature-scoped section components.
 *
 * This component is the single composition root for the feed feature.
 * The legacy Feed screen re-exports it for navigation compatibility.
 */

import React from 'react';
import { View, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { Box } from '../../ui/primitives';
import { STATIC, BRAND } from '../../ui/alf';

import { useFeed } from './useFeed';
import {
  CuisineFilterBar,
  FeaturedDealsSection,
  DealsForYouSection,
  FeedLoadingState,
  FeedEmptyState,
  FeedErrorState,
  FeedSectionDivider,
} from './sections';

const FeedContainer: React.FC = () => {
  const ctx = useFeed();

  const renderContent = () => {
    // Priority 1: While location context is doing its initial load OR still loading location
    if (ctx.location.isInitialLoad || ctx.location.isLocationLoading) {
      return <FeedLoadingState />;
    }

    // Priority 2: Handle errors
    if (ctx.state.error) {
      return <FeedErrorState message={ctx.state.error} onRetry={ctx.loadDeals} />;
    }

    // Priority 3: Show skeleton if we are fetching deals for the first time
    if (ctx.state.loading && ctx.state.deals.length === 0) {
      return <FeedLoadingState />;
    }

    // Priority 4: No location set and no deals loaded
    if (!ctx.location.hasLocationSet && ctx.state.deals.length === 0) {
      return <FeedEmptyState reason="needs_location" />;
    }

    // Priority 5: Filters result in no deals
    if (ctx.state.filteredDeals.length === 0) {
      return <FeedEmptyState reason="no_deals" />;
    }

    // Priority 6: Render the deals with cuisine filter
    return (
      <>
        <CuisineFilterBar cuisineFilter={ctx.cuisineFilter} />

        <FeaturedDealsSection
          deals={ctx.communityDeals}
          interactions={ctx.interactions}
        />

        {ctx.communityDeals.length > 0 && ctx.dealsForYou.length > 0 && (
          <FeedSectionDivider />
        )}

        <DealsForYouSection
          deals={ctx.dealsForYou}
          interactions={ctx.interactions}
        />
      </>
    );
  };

  return (
    <Box flex={1} bg={STATIC.white}>
      <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />
      <ScrollView
        style={{ flex: 1, backgroundColor: STATIC.white, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ctx.state.refreshing}
            onRefresh={ctx.onRefresh}
            colors={[BRAND.primary]}
            tintColor={BRAND.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </Box>
  );
};

export default FeedContainer;
