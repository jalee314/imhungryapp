/**
 * MainTabNavigator (PR-021)
 * 
 * Main tab navigator with persistent bottom navigation.
 * Contains all tab stacks and custom tab bar.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAdmin } from '../../../hooks/useAdmin';

// Tab stacks
import {
  FeedStack,
  DiscoverStack,
  ContributeStack,
  FavoritesStack,
  ProfileStack,
} from './TabStacks';

// Custom tab bar
import { CustomTabBar } from './CustomTabBar';

import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * MainTabNavigator - Main authenticated tab navigation
 * 
 * Contains:
 * - Feed tab
 * - Discover tab
 * - Contribute tab (modal trigger)
 * - Favorites tab
 * - Profile tab
 */
export const MainTabNavigator = () => {
  const { navigateToProfileSettings } = useAdmin();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={navigateToProfileSettings ? "ProfilePage" : "Feed"}
    >
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="DiscoverFeed" component={DiscoverStack} />
      <Tab.Screen name="DealCreationScreen" component={ContributeStack} />
      <Tab.Screen name="FavoritesPage" component={FavoritesStack} />
      <Tab.Screen name="ProfilePage" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
