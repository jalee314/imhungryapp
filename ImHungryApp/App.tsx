import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';

// App shell modules (PR-019, PR-022)
import { AppRoot, SplashGate } from './src/app';

// Auth hooks
import { useAuth } from './src/hooks/useAuth';
import { useAdmin } from './src/hooks/useAdmin';

// Navigation stacks (PR-021) - extracted from App.tsx
import {
  OnboardingStack,
  AdminStack,
  AppStack,
} from './src/app/navigation/stacks';

// Navigation constants - exported for testability
import {
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  APP_STACK_ROUTES,
  TAB_ROUTES,
  FEED_STACK_ROUTES,
  DISCOVER_STACK_ROUTES,
  CONTRIBUTE_STACK_ROUTES,
  FAVORITES_STACK_ROUTES,
  PROFILE_STACK_ROUTES,
  DEEP_LINK_CONFIG,
} from './src/app/navigation';

// Re-export route constants for external consumers
export {
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  APP_STACK_ROUTES,
  TAB_ROUTES,
  FEED_STACK_ROUTES,
  DISCOVER_STACK_ROUTES,
  CONTRIBUTE_STACK_ROUTES,
  FAVORITES_STACK_ROUTES,
  PROFILE_STACK_ROUTES,
  DEEP_LINK_CONFIG,
} from './src/app/navigation';

// Deep linking configuration
const prefix = Linking.createURL('/', { scheme: 'imhungri' });

const linking = {
  prefixes: [prefix, 'com.imhungri://', 'imhungri://'],
  config: {
    screens: {
      ResetPassword: 'reset-password'
      // Add other screens you want to deep link to here
      // 'ScreenName': 'path-in-url'
    },
  },
};

/**
 * AppContent - Main navigation container with stack selection
 * Uses SplashGate (PR-022) for animated splash screen overlay
 */
const AppContent = () => {
  const { isAuthenticated, isLoading, isPasswordResetMode } = useAuth();
  const { isAdminMode } = useAdmin();

  // Determine which stack to show
  let currentStack;

  if (isAdminMode) {
    // Admin mode - show admin stack regardless of auth status
    currentStack = <AdminStack />;
  } else if (isAuthenticated && !isPasswordResetMode) {
    // Regular authenticated user - show app stack
    currentStack = <AppStack />;
  } else {
    // Not authenticated or in password reset - show onboarding
    currentStack = <OnboardingStack />;
  }

  // Debug logging
  console.log('App navigation decision:', {
    isAuthenticated,
    isPasswordResetMode,
    isAdminMode,
    showing: isAdminMode ? 'AdminStack' : (isAuthenticated && !isPasswordResetMode ? 'AppStack' : 'OnboardingStack')
  });

  return (
    <SplashGate isLoading={isLoading}>
      <NavigationContainer linking={linking}>
        {currentStack}
      </NavigationContainer>
    </SplashGate>
  );
};

// Feature flag for app shell transition (PR-019)
// Set to true to use new app shell, false to use legacy bootstrap
// Keep old code path reachable during transition
const USE_APP_SHELL = true;

/**
 * Legacy App component - preserves original bootstrap behavior
 * Updated (PR-022) to use FontGate for font loading
 * Kept for rollback capability during app shell transition
 */
function AppLegacy() {
  // Note: Legacy mode initializes stores via AppProviders through AppRoot
  // This function preserved for structural compatibility only
  return (
    <AppRoot>
      <AppContent />
    </AppRoot>
  );
}

/**
 * New App component using app shell (PR-019, PR-022)
 * Delegates to AppRoot for provider composition, FontGate, and bootstrap
 */
function AppWithShell() {
  return (
    <AppRoot>
      <AppContent />
    </AppRoot>
  );
}

/**
 * Main App entry point
 * Routes to app shell or legacy bootstrap based on feature flag
 */
export default function App() {
  return USE_APP_SHELL ? <AppWithShell /> : <AppLegacy />;
}

// Export legacy component for testing/rollback
export { AppLegacy, AppWithShell };

