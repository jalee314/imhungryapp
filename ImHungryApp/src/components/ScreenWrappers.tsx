import React from 'react';
import MainAppLayout from './MainAppLayout';
import FeedTabNavigator from './FeedTabNavigator';
import DealCreationScreen from '../screens/contribution/DealCreationScreen';
import FavoritesPage from '../screens/favorites/FavoritesPage';
import ProfilePage from '../screens/profile/ProfilePage';

// Wrapper components for main screens that need bottom navigation
export const FeedWithNav = () => (
  <MainAppLayout>
    <FeedTabNavigator currentTab="feed" />
  </MainAppLayout>
);

export const DiscoverFeedWithNav = () => (
  <MainAppLayout>
    <FeedTabNavigator currentTab="discover" />
  </MainAppLayout>
);

export const DealCreationWithNav = () => (
  <MainAppLayout>
    <DealCreationScreen visible={true} onClose={() => {}} />
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
