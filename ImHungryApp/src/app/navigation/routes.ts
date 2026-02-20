/**
 * Route Names (PR-020)
 * 
 * Centralized route name constants for the navigation hierarchy.
 * These provide compile-time safety and single source of truth for route names.
 * 
 * Route names MUST match exactly with screen name strings in App.tsx navigators.
 * The contract tests will fail if there's any mismatch.
 */

// ============================================================================
// Root Stack Routes (Top-level navigation stacks)
// ============================================================================
export const RootRoutes = {
  Onboarding: 'OnboardingStack',
  Admin: 'AdminStack',
  App: 'AppStack',
} as const;

// ============================================================================
// Onboarding Stack Routes
// ============================================================================
export const OnboardingRoutes = {
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
export const AdminRoutes = {
  AdminDashboard: 'AdminDashboard',
  AdminReports: 'AdminReports',
  AdminDeals: 'AdminDeals',
  AdminUsers: 'AdminUsers',
  AdminMassUpload: 'AdminMassUpload',
} as const;

// ============================================================================
// App Stack Routes (Authenticated - non-tab screens)
// ============================================================================
export const AppRoutes = {
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
export const TabRoutes = {
  Feed: 'Feed',
  DiscoverFeed: 'DiscoverFeed',
  DealCreationScreen: 'DealCreationScreen',
  FavoritesPage: 'FavoritesPage',
  ProfilePage: 'ProfilePage',
} as const;

// ============================================================================
// Feed Stack Routes (nested in Feed tab)
// ============================================================================
export const FeedStackRoutes = {
  FeedMain: 'Feed Main',
  CommunityUploaded: 'CommunityUploaded',
} as const;

// ============================================================================
// Discover Stack Routes (nested in DiscoverFeed tab)
// ============================================================================
export const DiscoverStackRoutes = {
  DiscoverMain: 'DiscoverMain',
} as const;

// ============================================================================
// Contribute Stack Routes (nested in DealCreationScreen tab)
// ============================================================================
export const ContributeStackRoutes = {
  ContributeMain: 'ContributeMain',
} as const;

// ============================================================================
// Favorites Stack Routes (nested in FavoritesPage tab)
// ============================================================================
export const FavoritesStackRoutes = {
  FavoritesMain: 'FavoritesMain',
} as const;

// ============================================================================
// Profile Stack Routes (nested in ProfilePage tab)
// ============================================================================
export const ProfileStackRoutes = {
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
// All Routes Combined (for validation and iteration)
// ============================================================================
export const AllRoutes = {
  ...OnboardingRoutes,
  ...AdminRoutes,
  ...AppRoutes,
  ...TabRoutes,
  ...FeedStackRoutes,
  ...DiscoverStackRoutes,
  ...ContributeStackRoutes,
  ...FavoritesStackRoutes,
  ...ProfileStackRoutes,
} as const;

// ============================================================================
// Type Utilities
// ============================================================================

/** All possible route names */
export type RouteName = typeof AllRoutes[keyof typeof AllRoutes];

/** Check if a string is a valid route name */
export const isValidRoute = (routeName: string): routeName is RouteName => {
  return Object.values(AllRoutes).includes(routeName as RouteName);
};

/** Get routes by stack name */
export const getRoutesByStack = (stackName: string) => {
  switch (stackName) {
    case 'onboarding':
      return OnboardingRoutes;
    case 'admin':
      return AdminRoutes;
    case 'app':
      return AppRoutes;
    case 'tab':
      return TabRoutes;
    case 'feed':
      return FeedStackRoutes;
    case 'discover':
      return DiscoverStackRoutes;
    case 'contribute':
      return ContributeStackRoutes;
    case 'favorites':
      return FavoritesStackRoutes;
    case 'profile':
      return ProfileStackRoutes;
    default:
      return null;
  }
};

// ============================================================================
// Legacy Aliases (backward compatibility with existing code)
// ============================================================================
export const ONBOARDING_ROUTES = OnboardingRoutes;
export const ADMIN_ROUTES = AdminRoutes;
export const APP_STACK_ROUTES = AppRoutes;
export const TAB_ROUTES = TabRoutes;
export const FEED_STACK_ROUTES = FeedStackRoutes;
export const DISCOVER_STACK_ROUTES = DiscoverStackRoutes;
export const CONTRIBUTE_STACK_ROUTES = ContributeStackRoutes;
export const FAVORITES_STACK_ROUTES = FavoritesStackRoutes;
export const PROFILE_STACK_ROUTES = ProfileStackRoutes;
export const ALL_ROUTES = AllRoutes;
