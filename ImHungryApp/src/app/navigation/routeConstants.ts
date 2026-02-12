/**
 * Route Constants for Navigation
 * 
 * This module defines all route names and their expected parameters
 * for the application's navigation structure. These constants are used
 * by the navigation contract tests to detect route drift.
 * 
 * IMPORTANT: Any changes to route names in App.tsx must be reflected here.
 * The contract tests will fail if there's a mismatch.
 */

// ============================================================================
// Onboarding Stack Routes
// ============================================================================
export const ONBOARDING_ROUTES = {
  Landing: 'Landing',
  SignUp: 'SignUp',
  LogIn: 'LogIn',
  ForgotPassword: 'ForgotPassword',
  ResetPassword: 'ResetPassword',
  Username: 'Username',
  ProfilePhoto: 'ProfilePhoto',
  LocationPermissions: 'LocationPermissions',
  InstantNotifications: 'InstantNotifications',
  CuisinePreferences: 'CuisinePreferences',
  AdminLogin: 'AdminLogin',
} as const;

// ============================================================================
// Admin Stack Routes
// ============================================================================
export const ADMIN_ROUTES = {
  AdminDashboard: 'AdminDashboard',
  AdminReports: 'AdminReports',
  AdminDeals: 'AdminDeals',
  AdminUsers: 'AdminUsers',
  AdminMassUpload: 'AdminMassUpload',
} as const;

// ============================================================================
// Main App Stack Routes (Authenticated)
// ============================================================================
export const APP_STACK_ROUTES = {
  MainTabs: 'MainTabs',
  DealDetail: 'DealDetail',
  DealEdit: 'DealEdit',
  RestaurantDetail: 'RestaurantDetail',
  ReportContent: 'ReportContent',
  BlockUser: 'BlockUser',
  UserProfile: 'UserProfile',
} as const;

// ============================================================================
// Tab Navigator Routes
// ============================================================================
export const TAB_ROUTES = {
  Feed: 'Feed',
  DiscoverFeed: 'DiscoverFeed',
  DealCreationScreen: 'DealCreationScreen',
  FavoritesPage: 'FavoritesPage',
  ProfilePage: 'ProfilePage',
} as const;

// ============================================================================
// Feed Stack Routes
// ============================================================================
export const FEED_STACK_ROUTES = {
  FeedMain: 'Feed Main',
  CommunityUploaded: 'CommunityUploaded',
} as const;

// ============================================================================
// Discover Stack Routes
// ============================================================================
export const DISCOVER_STACK_ROUTES = {
  DiscoverMain: 'DiscoverMain',
} as const;

// ============================================================================
// Contribute Stack Routes
// ============================================================================
export const CONTRIBUTE_STACK_ROUTES = {
  ContributeMain: 'ContributeMain',
} as const;

// ============================================================================
// Favorites Stack Routes
// ============================================================================
export const FAVORITES_STACK_ROUTES = {
  FavoritesMain: 'FavoritesMain',
} as const;

// ============================================================================
// Profile Stack Routes
// ============================================================================
export const PROFILE_STACK_ROUTES = {
  ProfileMain: 'ProfileMain',
  ProfileEdit: 'ProfileEdit',
  BlockedUsersPage: 'BlockedUsersPage',
  ContactUsPage: 'ContactUsPage',
  FAQPage: 'FAQPage',
  TermsConditionsPage: 'TermsConditionsPage',
  PrivacyPolicyPage: 'PrivacyPolicyPage',
  CuisineEdit: 'CuisineEdit',
} as const;

// ============================================================================
// All Routes Combined (for validation)
// ============================================================================
export const ALL_ROUTES = {
  ...ONBOARDING_ROUTES,
  ...ADMIN_ROUTES,
  ...APP_STACK_ROUTES,
  ...TAB_ROUTES,
  ...FEED_STACK_ROUTES,
  ...DISCOVER_STACK_ROUTES,
  ...CONTRIBUTE_STACK_ROUTES,
  ...FAVORITES_STACK_ROUTES,
  ...PROFILE_STACK_ROUTES,
} as const;

// ============================================================================
// Route Parameter Definitions
// ============================================================================
export interface RouteParams {
  // Onboarding routes
  [ONBOARDING_ROUTES.Landing]: undefined;
  [ONBOARDING_ROUTES.SignUp]: { fromLogin?: boolean } | undefined;
  [ONBOARDING_ROUTES.LogIn]: undefined;
  [ONBOARDING_ROUTES.ForgotPassword]: undefined;
  [ONBOARDING_ROUTES.ResetPassword]: undefined;
  [ONBOARDING_ROUTES.Username]: undefined;
  [ONBOARDING_ROUTES.ProfilePhoto]: undefined;
  [ONBOARDING_ROUTES.LocationPermissions]: undefined;
  [ONBOARDING_ROUTES.InstantNotifications]: undefined;
  [ONBOARDING_ROUTES.CuisinePreferences]: undefined;
  [ONBOARDING_ROUTES.AdminLogin]: undefined;

  // Admin routes
  [ADMIN_ROUTES.AdminDashboard]: undefined;
  [ADMIN_ROUTES.AdminReports]: undefined;
  [ADMIN_ROUTES.AdminDeals]: undefined;
  [ADMIN_ROUTES.AdminUsers]: undefined;
  [ADMIN_ROUTES.AdminMassUpload]: undefined;

  // App stack routes
  [APP_STACK_ROUTES.MainTabs]: undefined;
  [APP_STACK_ROUTES.DealDetail]: { dealId: string };
  [APP_STACK_ROUTES.DealEdit]: { dealId?: string };
  [APP_STACK_ROUTES.RestaurantDetail]: { restaurantId: string };
  [APP_STACK_ROUTES.ReportContent]: { contentId: string; contentType: string };
  [APP_STACK_ROUTES.BlockUser]: { userId: string };
  [APP_STACK_ROUTES.UserProfile]: { userId: string };

  // Tab routes
  [TAB_ROUTES.Feed]: undefined;
  [TAB_ROUTES.DiscoverFeed]: undefined;
  [TAB_ROUTES.DealCreationScreen]: undefined;
  [TAB_ROUTES.FavoritesPage]: undefined;
  [TAB_ROUTES.ProfilePage]: { screen?: string; params?: object };

  // Feed stack routes
  [FEED_STACK_ROUTES.FeedMain]: undefined;
  [FEED_STACK_ROUTES.CommunityUploaded]: undefined;

  // Discover stack routes
  [DISCOVER_STACK_ROUTES.DiscoverMain]: undefined;

  // Contribute stack routes
  [CONTRIBUTE_STACK_ROUTES.ContributeMain]: undefined;

  // Favorites stack routes
  [FAVORITES_STACK_ROUTES.FavoritesMain]: undefined;

  // Profile stack routes
  [PROFILE_STACK_ROUTES.ProfileMain]: { viewUser?: boolean; userId?: string };
  [PROFILE_STACK_ROUTES.ProfileEdit]: undefined;
  [PROFILE_STACK_ROUTES.BlockedUsersPage]: undefined;
  [PROFILE_STACK_ROUTES.ContactUsPage]: undefined;
  [PROFILE_STACK_ROUTES.FAQPage]: undefined;
  [PROFILE_STACK_ROUTES.TermsConditionsPage]: undefined;
  [PROFILE_STACK_ROUTES.PrivacyPolicyPage]: undefined;
  [PROFILE_STACK_ROUTES.CuisineEdit]: undefined;
}

// ============================================================================
// Deep-Link Configuration
// ============================================================================
export const DEEP_LINK_CONFIG = {
  prefixes: ['imhungri://', 'com.imhungri://'],
  screens: {
    [ONBOARDING_ROUTES.ResetPassword]: 'reset-password',
  },
} as const;

// Type for deep-link screen paths
export type DeepLinkPath = typeof DEEP_LINK_CONFIG.screens[keyof typeof DEEP_LINK_CONFIG.screens];

// ============================================================================
// Route Validation Helpers
// ============================================================================
export const isValidRoute = (routeName: string): routeName is keyof typeof ALL_ROUTES => {
  return Object.values(ALL_ROUTES).includes(routeName as any);
};

export const getRoutesByStack = (stackName: string) => {
  switch (stackName) {
    case 'onboarding':
      return ONBOARDING_ROUTES;
    case 'admin':
      return ADMIN_ROUTES;
    case 'app':
      return APP_STACK_ROUTES;
    case 'tab':
      return TAB_ROUTES;
    case 'feed':
      return FEED_STACK_ROUTES;
    case 'discover':
      return DISCOVER_STACK_ROUTES;
    case 'contribute':
      return CONTRIBUTE_STACK_ROUTES;
    case 'favorites':
      return FAVORITES_STACK_ROUTES;
    case 'profile':
      return PROFILE_STACK_ROUTES;
    default:
      return null;
  }
};
