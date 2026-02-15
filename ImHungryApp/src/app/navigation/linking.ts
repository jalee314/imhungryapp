/**
 * Deep Linking Configuration (PR-020)
 * 
 * Centralized deep linking configuration for React Navigation.
 * Defines URL schemes, prefixes, and path mappings.
 * 
 * Usage:
 * ```tsx
 * import { linking } from '@/app/navigation/linking';
 * 
 * <NavigationContainer linking={linking}>
 *   {children}
 * </NavigationContainer>
 * ```
 */

import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import { OnboardingRoutes } from './routes';

// ============================================================================
// URL Scheme Configuration
// ============================================================================

/** App URL scheme */
export const URL_SCHEME = 'imhungri';

/** Create dynamic prefix using Expo Linking */
export const createDynamicPrefix = () => Linking.createURL('/', { scheme: URL_SCHEME });

/** Static prefixes for the app */
export const STATIC_PREFIXES = [
  'com.imhungri://',
  'imhungri://',
] as const;

// ============================================================================
// Screen Path Mappings
// ============================================================================

/**
 * Deep link screen configuration
 * Maps route names to URL paths
 */
export const DEEP_LINK_SCREENS = {
  [OnboardingRoutes.ResetPassword]: 'reset-password',
  // Add additional deep link paths here:
  // [OnboardingRoutes.SignUp]: 'signup',
  // [AppRoutes.DealDetail]: 'deal/:dealId',
} as const;

/** Type for deep link paths */
export type DeepLinkPath = typeof DEEP_LINK_SCREENS[keyof typeof DEEP_LINK_SCREENS];

// ============================================================================
// Linking Configuration Object
// ============================================================================

/**
 * Deep link configuration for use with NavigationContainer
 * 
 * The config structure matches the navigation hierarchy:
 * - Top level screens (ResetPassword) for onboarding deep links
 * - Nested configs can be added for authenticated screens
 */
export const DEEP_LINK_CONFIG = {
  prefixes: STATIC_PREFIXES as unknown as string[],
  screens: DEEP_LINK_SCREENS,
} as const;

/**
 * Create full linking configuration with dynamic prefix
 * Call this in the component to get runtime prefix
 */
export const createLinkingConfig = () => {
  const prefix = createDynamicPrefix();
  
  return {
    prefixes: [prefix, ...STATIC_PREFIXES],
    config: {
      screens: {
        // Define screen paths that work across the navigation hierarchy
        // Note: ResetPassword is accessible from OnboardingStack
        ResetPassword: 'reset-password',
      },
    },
  };
};

/**
 * Simple linking object for direct use
 * Uses static prefixes + dynamic prefix at runtime
 */
export const linking = {
  prefixes: [createDynamicPrefix(), ...STATIC_PREFIXES],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // Add other screens you want to deep link to here
      // 'ScreenName': 'path-in-url'
    },
  },
};

// ============================================================================
// Deep Link Utilities
// ============================================================================

/**
 * Parse a deep link URL to extract the path
 */
export const parseDeepLinkUrl = (url: string): string | null => {
  try {
    const parsed = Linking.parse(url);
    return parsed.path;
  } catch {
    return null;
  }
};

/**
 * Create a deep link URL for a given path
 */
export const createDeepLinkUrl = (path: string): string => {
  return Linking.createURL(path, { scheme: URL_SCHEME });
};

/**
 * Check if a URL is a valid app deep link
 */
export const isAppDeepLink = (url: string): boolean => {
  return STATIC_PREFIXES.some(prefix => url.startsWith(prefix)) ||
    url.startsWith(`${URL_SCHEME}://`);
};
