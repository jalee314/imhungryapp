/**
 * Route Constants for Navigation (Legacy Module)
 * 
 * @deprecated This module is maintained for backward compatibility.
 * New code should import from:
 * - './routes' for route name constants
 * - './types' for TypeScript navigation types
 * - './linking' for deep linking configuration
 * 
 * This module defines all route names and their expected parameters
 * for the application's navigation structure. These constants are used
 * by the navigation contract tests to detect route drift.
 * 
 * IMPORTANT: Any changes to route names in App.tsx must be reflected here.
 * The contract tests will fail if there's a mismatch.
 */

// Re-export from new modules (PR-020)
export {
  OnboardingRoutes,
  AdminRoutes,
  AppRoutes,
  TabRoutes,
  FeedStackRoutes,
  DiscoverStackRoutes,
  ContributeStackRoutes,
  FavoritesStackRoutes,
  ProfileStackRoutes,
  AllRoutes,
  isValidRoute,
  getRoutesByStack,
  // Legacy aliases
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  APP_STACK_ROUTES,
  TAB_ROUTES,
  FEED_STACK_ROUTES,
  DISCOVER_STACK_ROUTES,
  CONTRIBUTE_STACK_ROUTES,
  FAVORITES_STACK_ROUTES,
  PROFILE_STACK_ROUTES,
  ALL_ROUTES,
} from './routes';

export { DEEP_LINK_CONFIG } from './linking';
