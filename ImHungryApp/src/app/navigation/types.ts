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

import type { NavigatorScreenParams, CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

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
// Navigation Prop Types
// ============================================================================

/** Navigation prop for Onboarding stack screens */
export type OnboardingStackNavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

/** Navigation prop for Admin stack screens */
export type AdminStackNavigationProp = NativeStackNavigationProp<AdminStackParamList>;

/** Navigation prop for App stack screens (authenticated) */
export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>;

/** Navigation prop for Tab navigator screens */
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

/** Navigation prop for Feed stack screens */
export type FeedStackNavigationProp = NativeStackNavigationProp<FeedStackParamList>;

/** Navigation prop for Discover stack screens */
export type DiscoverStackNavigationProp = NativeStackNavigationProp<DiscoverStackParamList>;

/** Navigation prop for Contribute stack screens */
export type ContributeStackNavigationProp = NativeStackNavigationProp<ContributeStackParamList>;

/** Navigation prop for Favorites stack screens */
export type FavoritesStackNavigationProp = NativeStackNavigationProp<FavoritesStackParamList>;

/** Navigation prop for Profile stack screens */
export type ProfileStackNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

// ============================================================================
// Composite Navigation Props (for nested navigators)
// ============================================================================

/** Navigation prop with access to both Profile stack and App stack */
export type ProfileScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    NativeStackNavigationProp<AppStackParamList>
  >
>;

/** Navigation prop with access to both Feed stack and App stack */
export type FeedScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<FeedStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    NativeStackNavigationProp<AppStackParamList>
  >
>;

// ============================================================================
// Screen Props Types
// ============================================================================

/** Screen props for Onboarding stack screens */
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = 
  NativeStackScreenProps<OnboardingStackParamList, T>;

/** Screen props for Admin stack screens */
export type AdminScreenProps<T extends keyof AdminStackParamList> = 
  NativeStackScreenProps<AdminStackParamList, T>;

/** Screen props for App stack screens */
export type AppScreenProps<T extends keyof AppStackParamList> = 
  NativeStackScreenProps<AppStackParamList, T>;

/** Screen props for Tab screens */
export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>;

/** Screen props for Feed stack screens */
export type FeedScreenProps<T extends keyof FeedStackParamList> = 
  NativeStackScreenProps<FeedStackParamList, T>;

/** Screen props for Discover stack screens */
export type DiscoverScreenProps<T extends keyof DiscoverStackParamList> = 
  NativeStackScreenProps<DiscoverStackParamList, T>;

/** Screen props for Contribute stack screens */
export type ContributeScreenProps<T extends keyof ContributeStackParamList> = 
  NativeStackScreenProps<ContributeStackParamList, T>;

/** Screen props for Favorites stack screens */
export type FavoritesScreenProps<T extends keyof FavoritesStackParamList> = 
  NativeStackScreenProps<FavoritesStackParamList, T>;

/** Screen props for Profile stack screens */
export type ProfileScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;

// ============================================================================
// Route Params Interface (legacy compatibility)
// ============================================================================

/** 
 * Union of all route params for backward compatibility
 * @deprecated Use specific stack param lists instead
 */
export interface RouteParams {
  // Onboarding routes
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

  // Admin routes
  AdminDashboard: undefined;
  AdminReports: undefined;
  AdminDeals: undefined;
  AdminUsers: undefined;
  AdminMassUpload: undefined;

  // App stack routes
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  DealDetail: { dealId: string };
  DealEdit: { dealId?: string } | undefined;
  RestaurantDetail: { restaurantId: string };
  ReportContent: { contentId: string; contentType: string };
  BlockUser: { userId: string };
  UserProfile: { userId: string };

  // Tab routes
  Feed: NavigatorScreenParams<FeedStackParamList> | undefined;
  DiscoverFeed: NavigatorScreenParams<DiscoverStackParamList> | undefined;
  DealCreationScreen: NavigatorScreenParams<ContributeStackParamList> | undefined;
  FavoritesPage: NavigatorScreenParams<FavoritesStackParamList> | undefined;
  ProfilePage: NavigatorScreenParams<ProfileStackParamList> | undefined;

  // Feed stack routes
  'Feed Main': undefined;
  CommunityUploaded: undefined;

  // Discover stack routes
  DiscoverMain: undefined;

  // Contribute stack routes
  ContributeMain: undefined;

  // Favorites stack routes
  FavoritesMain: undefined;

  // Profile stack routes
  ProfileMain: { viewUser?: boolean; userId?: string } | undefined;
  ProfileEdit: undefined;
  BlockedUsersPage: undefined;
  ContactUsPage: undefined;
  FAQPage: undefined;
  TermsConditionsPage: undefined;
  PrivacyPolicyPage: undefined;
  CuisineEdit: undefined;
}

// ============================================================================
// Declaration Merging for React Navigation Global Types
// ============================================================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
