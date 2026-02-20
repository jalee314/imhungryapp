/**
 * AppStack (PR-021)
 * 
 * Main authenticated app navigation stack.
 * Wraps MainTabNavigator and includes shared screens accessible from any tab.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AuthGuard from '../../../components/AuthGuard';

// Main tab navigator

// Shared screens accessible from any tab
import DealEditScreen from '../../../screens/contribution/DealEditScreen';
import BlockUserScreen from '../../../screens/deal_feed/BlockUserScreen';
import DealDetailScreen from '../../../screens/deal_feed/DealDetailScreen';
import ReportContentScreen from '../../../screens/deal_feed/ReportContentScreen';
import RestaurantDetailScreen from '../../../screens/discover_feed/RestaurantDetailScreen';
import ProfilePage from '../../../screens/profile/ProfilePage';
import type { AppStackParamList } from '../types';

import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * AppStack - Main authenticated app navigation
 * 
 * Protected by AuthGuard. Contains:
 * - MainTabs (tab navigator)
 * - Shared detail screens (DealDetail, RestaurantDetail, etc.)
 * - UserProfile for viewing other users
 */
export const AppStack = () => (
  <AuthGuard>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tab navigator with persistent bottom navigation */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Shared screens accessible from any tab */}
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="DealEdit" component={DealEditScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="ReportContent" component={ReportContentScreen} />
      <Stack.Screen name="BlockUser" component={BlockUserScreen} />
      {/* UserProfile screen for viewing other users (separate from Profile tab) */}
      <Stack.Screen name="UserProfile" component={ProfilePage} />
    </Stack.Navigator>
  </AuthGuard>
);

export default AppStack;
