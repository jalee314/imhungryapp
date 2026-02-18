/**
 * Navigation Types (PR-020)
 * 
 * Centralized TypeScript types for React Navigation.
 * Provides compile-time route safety throughout the application.
 * 
 * Usage:
 * ```tsx
 * import { useNavigation } from '@react-navigation/native';
 * import { AppStackNavigationProp } from '@/app/navigation/types';
 * 
 * const navigation = useNavigation<AppStackNavigationProp>();
 * navigation.navigate('DealDetail', { dealId: '123' }); // Type-safe!
 * ```
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

// ============================================================================
// Onboarding Stack Param List
// ============================================================================
export type OnboardingStackParamList = {
  Landing: undefined;
  SignUp: { fromLogin?: boolean } | undefined;
  LogIn: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Username: undefined;
  ProfilePhoto: undefined;
  LocationPermissions: undefined;
  InstantNotifications: undefined;
  CuisinePreferences: undefined;
  AdminLogin: undefined;
};

// ============================================================================
// Admin Stack Param List
// ============================================================================
export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminReports: undefined;
  AdminDeals: undefined;
  AdminUsers: undefined;
  AdminMassUpload: undefined;
};

// ============================================================================
// Feed Stack Param List (nested in Feed tab)
// ============================================================================
export type FeedStackParamList = {
  'Feed Main': undefined;
  CommunityUploaded: undefined;
};

// ============================================================================
// Discover Stack Param List (nested in DiscoverFeed tab)
// ============================================================================
export type DiscoverStackParamList = {
  DiscoverMain: undefined;
};

// ============================================================================
// Contribute Stack Param List (nested in DealCreationScreen tab)
// ============================================================================
export type ContributeStackParamList = {
  ContributeMain: undefined;
};

// ============================================================================
// Favorites Stack Param List (nested in FavoritesPage tab)
// ============================================================================
export type FavoritesStackParamList = {
  FavoritesMain: undefined;
};

// ============================================================================
// Profile Stack Param List (nested in ProfilePage tab)
// ============================================================================
export type ProfileStackParamList = {
  ProfileMain: { viewUser?: boolean; userId?: string } | undefined;
  ProfileEdit: undefined;
  BlockedUsersPage: undefined;
  ContactUsPage: undefined;
  FAQPage: undefined;
  TermsConditionsPage: undefined;
  PrivacyPolicyPage: undefined;
  CuisineEdit: undefined;
};

// ============================================================================
// Tab Navigator Param List (Main authenticated tabs)
// ============================================================================
export type TabParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList> | undefined;
  DiscoverFeed: NavigatorScreenParams<DiscoverStackParamList> | undefined;
  DealCreationScreen: NavigatorScreenParams<ContributeStackParamList> | undefined;
  FavoritesPage: NavigatorScreenParams<FavoritesStackParamList> | undefined;
  ProfilePage: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

// ============================================================================
// App Stack Param List (Authenticated - includes tabs and shared screens)
// ============================================================================
export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  DealDetail: { dealId: string };
  DealEdit: { dealId?: string } | undefined;
  RestaurantDetail: { restaurantId: string };
  ReportContent: { contentId: string; contentType: string };
  BlockUser: { userId: string };
  UserProfile: { userId: string };
};

// ============================================================================
// Root Stack Param List (Top-level - determines which stack is shown)
// ============================================================================
export type RootStackParamList = {
  OnboardingStack: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  AdminStack: NavigatorScreenParams<AdminStackParamList> | undefined;
  AppStack: NavigatorScreenParams<AppStackParamList> | undefined;
};

// ============================================================================
// Declaration Merging for React Navigation Global Types
// ============================================================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
