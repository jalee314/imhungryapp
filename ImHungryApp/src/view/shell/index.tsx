/**
 * Shell/index.tsx
 * 
 * Main shell component following Bluesky's pattern.
 * This wraps the navigation and provides the main app structure.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFA05C" />
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
    <RoutesContainer>
      {renderNavigator()}
    </RoutesContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5B4',
  },
});

export default Shell;
