/**
 * @file DiscoverContainer — Composed container that wires useDiscover
 * to all feature-scoped section components.
 *
 * This component is the single composition root for the discover feature.
 * The legacy DiscoverFeed re-exports it for navigation compatibility.
 */

import React from 'react';
import { StatusBar } from 'react-native';

import { STATIC } from '../../ui/alf';
import { Box } from '../../ui/primitives';

import {
  DiscoverSearchBar,
  DiscoverSearchBarSkeleton,
  DiscoverRestaurantList,
  DiscoverLoadingState,
  DiscoverErrorState,
} from './sections';
import { useDiscover } from './useDiscover';

const DiscoverContainer: React.FC = () => {
  const ctx = useDiscover();

  if (ctx.state.loading) {
    return (
      <Box flex={1} bg={STATIC.white}>
        <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />
        <DiscoverSearchBarSkeleton />
        <DiscoverLoadingState />
      </Box>
    );
  }

  if (ctx.state.error) {
    return (
      <Box flex={1} bg={STATIC.white}>
        <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />
        <DiscoverSearchBarSkeleton />
        <DiscoverErrorState
          message={ctx.state.error}
          onRetry={ctx.interactions.handleRetry}
        />
      </Box>
    );
  }

  return (
    <Box flex={1} bg={STATIC.white}>
      <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />

      <DiscoverSearchBar
        value={ctx.state.searchQuery}
        onChangeText={ctx.interactions.handleSearchChange}
        onClear={ctx.interactions.handleClearSearch}
      />

      <Box flex={1}>
        <DiscoverRestaurantList
          restaurants={ctx.state.filteredRestaurants}
          searchQuery={ctx.state.searchQuery}
          onPress={ctx.interactions.handleRowCardPress}
        />
      </Box>
    </Box>
  );
};

export default DiscoverContainer;
