/**
 * @file CommunityContainer — Composed container that wires useCommunity
 * to all feature-scoped section components.
 *
 * This component is the single composition root for the community feature.
 * The legacy CommunityUploadedScreen re-exports it for navigation compatibility.
 */

import React from 'react';
import { ScrollView, StatusBar, RefreshControl } from 'react-native';

import { STATIC, BRAND, SPACING } from '../../ui/alf';
import { Box } from '../../ui/primitives';

import {
  CommunityHeader,
  CommunityDealsGrid,
  CommunityLoadingState,
  CommunityEmptyState,
  CommunityErrorState,
} from './sections';
import { useCommunity } from './useCommunity';

const communityScrollStyle = { flex: 1, backgroundColor: STATIC.white };
const communityScrollContentStyle = {
  paddingHorizontal: SPACING.md,
  paddingTop: SPACING.sm,
  paddingBottom: 0,
};

const CommunityContainer: React.FC = () => {
  const ctx = useCommunity();

  const renderContent = () => {
    if (ctx.state.loading) {
      return <CommunityLoadingState />;
    }
    if (ctx.state.error) {
      return <CommunityErrorState message={ctx.state.error} onRetry={ctx.onRefresh} />;
    }
    if (ctx.state.deals.length === 0) {
      return <CommunityEmptyState />;
    }
    return <CommunityDealsGrid deals={ctx.state.deals} interactions={ctx.interactions} />;
  };

  return (
    <Box flex={1} bg={STATIC.white}>
      <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />

      <CommunityHeader onGoBack={ctx.goBack} />

      <ScrollView
        style={communityScrollStyle}
        contentContainerStyle={communityScrollContentStyle}
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

export default CommunityContainer;
