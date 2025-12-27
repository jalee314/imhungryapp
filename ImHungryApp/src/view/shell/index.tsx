/**
 * Shell/index.tsx
 * 
 * Main shell component following Bluesky's pattern.
 * This wraps the navigation and provides the main app structure.
 * 
 * The Shell is wrapped with QueryProvider to enable React Query
 * throughout the app. All data fetching can now use query hooks.
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { atoms as a, useTheme } from '#/ui';
import * as tokens from '#/ui/tokens';
import { QueryProvider } from '#/state/queries';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import {
  RoutesContainer,
  OnboardingNavigator,
  AppNavigator,
  AdminNavigator,
} from '../../Navigation';

/**
 * Loading screen displayed during auth state resolution
 */
function LoadingScreen() {
  const t = useTheme();

  return (
    <View style={[a.flex_1, a.justify_center, a.align_center, { backgroundColor: tokens.color.primary_100 }]}>
      <ActivityIndicator size="large" color={tokens.color.primary_500} />
    </View>
  );
}

/**
 * Shell component - the main app wrapper
 * 
 * Responsibilities:
 * - Determines which navigator to show based on auth/admin state
 * - Wraps content in RoutesContainer for deep linking support
 * - Shows loading state during auth resolution
 */
export function Shell() {
  const { isAuthenticated, isLoading, isPasswordResetMode } = useAuth();
  const { isAdminMode } = useAdmin();

  // Show loading during auth state resolution
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Determine which navigator to render
  const renderNavigator = () => {
    if (isAdminMode) {
      // Admin mode - show admin stack regardless of auth status
      return <AdminNavigator />;
    }
    
    if (isAuthenticated && !isPasswordResetMode) {
      // Regular authenticated user - show app stack
      return <AppNavigator />;
    }
    
    // Not authenticated or in password reset - show onboarding
    return <OnboardingNavigator />;
  };

  // Debug logging
  if (__DEV__) {
    console.log('Shell navigation decision:', {
      isAuthenticated,
      isPasswordResetMode,
      isAdminMode,
      showing: isAdminMode 
        ? 'AdminNavigator' 
        : (isAuthenticated && !isPasswordResetMode ? 'AppNavigator' : 'OnboardingNavigator'),
    });
  }

  return (
    <QueryProvider>
      <RoutesContainer>
        {renderNavigator()}
      </RoutesContainer>
    </QueryProvider>
  );
}

export default Shell;
