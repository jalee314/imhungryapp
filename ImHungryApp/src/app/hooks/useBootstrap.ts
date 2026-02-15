/**
 * useBootstrap.ts
 * 
 * Bootstrap hook for application initialization.
 * Handles font loading, initial asset loading, and startup state.
 * 
 * This hook extracts the bootstrap logic from App.tsx to enable
 * cleaner separation of concerns and better testability.
 */

import { useState, useEffect } from 'react';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

export interface BootstrapState {
  /** Whether fonts are loaded */
  fontsLoaded: boolean;
  /** Font loading error, if any */
  fontError: Error | null;
  /** Whether the bootstrap timeout has been reached */
  timeoutReached: boolean;
  /** Whether the app is ready to render main content */
  isReady: boolean;
}

export interface UseBootstrapOptions {
  /** Timeout in milliseconds before forcing app to render (default: 3000) */
  timeout?: number;
}

/**
 * useBootstrap - Application bootstrap hook
 * 
 * Handles the initial loading phase of the application including:
 * - Font loading
 * - Timeout fallback for slow loading
 * 
 * @param options - Bootstrap configuration options
 * @returns Bootstrap state object
 * 
 * @example
 * ```tsx
 * const { isReady, fontsLoaded, fontError } = useBootstrap();
 * 
 * if (!isReady) {
 *   return <SplashScreen />;
 * }
 * 
 * return <AppContent />;
 * ```
 */
export const useBootstrap = (options: UseBootstrapOptions = {}): BootstrapState => {
  const { timeout = 3000 } = options;

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

  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, timeout);

    if (fontsLoaded) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded, timeout]);

  // App is ready when fonts are loaded OR there's an error OR timeout is reached
  const isReady = fontsLoaded || fontError !== null || timeoutReached;

  return {
    fontsLoaded,
    fontError: fontError ?? null,
    timeoutReached,
    isReady,
  };
};

export default useBootstrap;
