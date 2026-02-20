/**
 * @file FavoritesContainer — Composed container that wires useFavoritesScreen
 * to all feature-scoped section components.
 *
 * This component is the single composition root for the favorites feature.
 * The legacy FavoritesPage re-exports it for navigation compatibility.
 */

import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';

import { STATIC, SPACING } from '../../ui/alf';
import { Box } from '../../ui/primitives';

import {
  FavoritesHeader,
  FavoritesTabSelector,
  FavoritesFullSkeleton,
  FavoritesTabSkeleton,
  FavoritesEmptyState,
  FavoritesDealsList,
  FavoritesRestaurantsList,
} from './sections';
import { useFavoritesScreen } from './useFavoritesScreen';

const favoritesScrollStyle = { flex: 1, paddingTop: SPACING.sm };
const favoritesScrollContentStyle = { paddingBottom: 100 };

const FavoritesContainer: React.FC = () => {
  const ctx = useFavoritesScreen();

  // Full-screen skeleton on first load
  if (ctx.state.loading) {
    return <FavoritesFullSkeleton />;
  }

  const isTabLoading =
    (ctx.state.activeTab === 'restaurants' &&
      ctx.state.restaurantsLoading &&
      !ctx.state.hasLoadedRestaurants) ||
    (ctx.state.activeTab === 'deals' &&
      ctx.state.dealsLoading &&
      !ctx.state.hasLoadedDeals);

  const renderContent = () => {
    if (isTabLoading) {
      return <FavoritesTabSkeleton />;
    }

    if (ctx.state.activeTab === 'restaurants') {
      return ctx.state.restaurants.length > 0 ? (
        <FavoritesRestaurantsList
          restaurants={ctx.state.restaurants}
          onRestaurantPress={ctx.interactions.handleRestaurantPress}
        />
      ) : (
        <FavoritesEmptyState activeTab="restaurants" />
      );
    }

    return ctx.state.deals.length > 0 ? (
      <FavoritesDealsList
        deals={ctx.state.deals}
        onDealPress={ctx.interactions.handleDealPress}
        onUserPress={ctx.interactions.handleUserPress}
      />
    ) : (
      <FavoritesEmptyState activeTab="deals" />
    );
  };

  return (
    <Box flex={1} bg={STATIC.white}>
      <FavoritesHeader />

      <FavoritesTabSelector
        activeTab={ctx.state.activeTab}
        onTabChange={ctx.interactions.setActiveTab}
      />

      <ScrollView
        style={favoritesScrollStyle}
        contentContainerStyle={favoritesScrollContentStyle}
        refreshControl={
          <RefreshControl
            refreshing={ctx.state.refreshing}
            onRefresh={ctx.interactions.handleRefresh}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </Box>
  );
};

export default FavoritesContainer;
