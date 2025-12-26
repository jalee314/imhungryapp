/**
 * App.tsx
 * 
 * Root application component.
 * Following Bluesky's pattern, this file is now focused solely on:
 * - Provider setup
 * - Store initialization
 * - Font loading
 * 
 * All navigation logic has been moved to src/Navigation.tsx
 * Shell rendering is handled by src/view/shell/index.tsx
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Store initialization hooks
import { useInitializeAuth } from './src/stores/AuthStore';
import { useInitializeDataCache } from './src/stores/DataCacheStore';
import { useInitializeLocation } from './src/stores/LocationStore';
import { useInitializeAdmin } from './src/stores/AdminStore';

// Shell component (contains all navigation logic)
import { Shell } from './src/view/shell';

/**
 * Splash/Loading screen shown during font loading
 */
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#FFA05C" />
    </View>
  );
}

/**
 * Main App Component
 * 
 * Responsibilities:
 * 1. Initialize all Zustand stores
 * 2. Load fonts
 * 3. Render Shell once ready
 */
export default function App() {
  // Initialize stores at app start
  useInitializeAuth();
  useInitializeAdmin();
  useInitializeDataCache();
  useInitializeLocation();

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Aliases for easier use
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Timeout for font loading (fallback after 3s)
  const [timeoutReached, setTimeoutReached] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 3000);

    if (fontsLoaded) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  // Show splash while fonts load (with timeout fallback)
  if (!fontsLoaded && !fontError && !timeoutReached) {
    return <SplashScreen />;
  }

  // Render the shell (which handles all navigation)
  return <Shell />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5B4',
  },
});
