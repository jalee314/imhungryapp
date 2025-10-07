import React from 'react';
import MainAppLayout from './MainAppLayout';
import Feed from '../screens/deal_feed/Feed';
import DiscoverFeed from '../screens/discover_feed/DiscoverFeed';
import DealCreationScreen from '../screens/contribution/DealCreationScreen';
import FavoritesPage from '../screens/favorites/FavoritesPage';
import ProfilePage from '../screens/profile/ProfilePage';

// Wrapper components for main screens that need bottom navigation
export const FeedWithNav = () => (
  <MainAppLayout>
    <Feed />
  </MainAppLayout>
);

export const DiscoverFeedWithNav = () => (
  <MainAppLayout>
    <DiscoverFeed />
  </MainAppLayout>
);

export const DealCreationWithNav = () => (
  <MainAppLayout>
    <DealCreationScreen />
  </MainAppLayout>
);

export const FavoritesWithNav = () => (
  <MainAppLayout>
    <FavoritesPage />
  </MainAppLayout>
);

export const ProfileWithNav = () => (
  <MainAppLayout>
    <ProfilePage />
  </MainAppLayout>
);
