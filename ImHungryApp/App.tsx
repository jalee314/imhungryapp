import React from 'react';
import { View, Image, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as Linking from 'expo-linking';

// App shell modules (PR-019)
import { AppRoot } from './src/app';

// Auth hooks
import { useAuth } from './src/hooks/useAuth';
import { useInitializeAuth } from './src/stores/AuthStore';
import { useAdmin } from './src/hooks/useAdmin';

// Store initialization
import { useInitializeDataCache } from './src/stores/DataCacheStore';
import { useInitializeLocation } from './src/stores/LocationStore';
import { useInitializeAdmin } from './src/stores/AdminStore';

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
 */
const AppContent = () => {
  const { isAuthenticated, isLoading, isPasswordResetMode } = useAuth();
  const { isAdminMode } = useAdmin();

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [isSplashVisible, setSplashVisible] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }
  }, [isLoading]);

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
    <View style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        {currentStack}
      </NavigationContainer>

      {isSplashVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FFE5B4',
            opacity: fadeAnim,
            zIndex: 999
          }}
        >
          <Image
            source={require('./assets/images/icon_splash.png')}
            style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
        </Animated.View>
      )}
    </View>
  );
};

// Feature flag for app shell transition (PR-019)
// Set to true to use new app shell, false to use legacy bootstrap
// Keep old code path reachable during transition
const USE_APP_SHELL = true;

/**
 * Legacy App component - preserves original bootstrap behavior
 * Kept for rollback capability during app shell transition
 */
function AppLegacy() {
  // Initialize Zustand auth store once at app start
  useInitializeAuth();
  // Initialize admin store once at app start
  useInitializeAdmin();
  // Initialize data cache store once at app start
  useInitializeDataCache();
  // Initialize location store once at app start
  useInitializeLocation();
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Map aliases for easier use
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

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

  if (!fontsLoaded && !fontError && !timeoutReached) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <Image
          source={require('./assets/images/icon_splash.png')}
          style={{ width: 200, height: 200, resizeMode: 'contain' }}
        />
      </View>
    );
  }

  return (
    <AppContent />
  );
}

/**
 * New App component using app shell (PR-019)
 * Delegates to AppRoot for provider composition and bootstrap
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

