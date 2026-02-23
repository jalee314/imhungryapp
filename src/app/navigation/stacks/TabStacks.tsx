/**
 * Tab Stacks (PR-021)
 * 
 * Individual stack navigators for each tab in the main app.
 * Each tab has its own stack to support nested navigation.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Screen components
import FeedTabNavigator from '../../../components/FeedTabNavigator';
import CommunityUploadedScreen from '../../../screens/deal_feed/CommunityUploadedScreen';
import FavoritesPage from '../../../screens/favorites/FavoritesPage';
import BlockedUsersPage from '../../../screens/profile/BlockedUsersPage';
import ContactUsPage from '../../../screens/profile/ContactUsPage';
import CuisineEdit from '../../../screens/profile/CuisineEdit';
import FAQPage from '../../../screens/profile/FAQPage';
import PrivacyPolicyPage from '../../../screens/profile/PrivacyPolicyPage';
import ProfileEdit from '../../../screens/profile/ProfileEdit';
import ProfilePage from '../../../screens/profile/ProfilePage';
import TermsConditionsPage from '../../../screens/profile/TermsConditionsPage';
import type {
  FeedStackParamList,
  DiscoverStackParamList,
  ContributeStackParamList,
  FavoritesStackParamList,
  ProfileStackParamList,
} from '../types';

// ============================================================================
// Feed Stack
// ============================================================================
const FeedStackNavigator = createNativeStackNavigator<FeedStackParamList>();

/**
 * FeedStack - Main feed tab navigation
 */
export const FeedStack = () => (
  <FeedStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <FeedStackNavigator.Screen name="Feed Main" component={FeedTabNavigator} />
    <FeedStackNavigator.Screen name="CommunityUploaded" component={CommunityUploadedScreen} />
  </FeedStackNavigator.Navigator>
);

// ============================================================================
// Discover Stack
// ============================================================================
const DiscoverStackNavigator = createNativeStackNavigator<DiscoverStackParamList>();

// Component function to avoid inline function warnings
const DiscoverMainScreen = () => <FeedTabNavigator currentTab="discover" />;

/**
 * DiscoverStack - Discover/search tab navigation
 */
export const DiscoverStack = () => (
  <DiscoverStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <DiscoverStackNavigator.Screen
      name="DiscoverMain"
      component={DiscoverMainScreen}
    />
  </DiscoverStackNavigator.Navigator>
);

// ============================================================================
// Contribute Stack
// ============================================================================
const ContributeStackNavigator = createNativeStackNavigator<ContributeStackParamList>();

/**
 * ContributeStack - Contribute/create tab navigation
 * Shows feed as fallback when contribute tab is "active" (modal handles actual creation)
 */
export const ContributeStack = () => (
  <ContributeStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <ContributeStackNavigator.Screen
      name="ContributeMain"
      component={FeedTabNavigator}
    />
  </ContributeStackNavigator.Navigator>
);

// ============================================================================
// Favorites Stack
// ============================================================================
const FavoritesStackNavigator = createNativeStackNavigator<FavoritesStackParamList>();

/**
 * FavoritesStack - Favorites/saved tab navigation
 */
export const FavoritesStack = () => (
  <FavoritesStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <FavoritesStackNavigator.Screen name="FavoritesMain" component={FavoritesPage} />
  </FavoritesStackNavigator.Navigator>
);

// ============================================================================
// Profile Stack
// ============================================================================
const ProfileStackNavigator = createNativeStackNavigator<ProfileStackParamList>();

/**
 * ProfileStack - Profile and settings tab navigation
 */
export const ProfileStack = () => (
  <ProfileStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStackNavigator.Screen name="ProfileMain" component={ProfilePage} />
    <ProfileStackNavigator.Screen name="ProfileEdit" component={ProfileEdit} />
    <ProfileStackNavigator.Screen name="BlockedUsersPage" component={BlockedUsersPage} />
    <ProfileStackNavigator.Screen name="ContactUsPage" component={ContactUsPage} />
    <ProfileStackNavigator.Screen name="FAQPage" component={FAQPage} />
    <ProfileStackNavigator.Screen name="TermsConditionsPage" component={TermsConditionsPage} />
    <ProfileStackNavigator.Screen name="PrivacyPolicyPage" component={PrivacyPolicyPage} />
    <ProfileStackNavigator.Screen name="CuisineEdit" component={CuisineEdit} />
  </ProfileStackNavigator.Navigator>
);
