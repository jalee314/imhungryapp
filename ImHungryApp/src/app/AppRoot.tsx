/**
 * AppRoot.tsx
 * 
 * Main application root component that composes:
 * - AppProviders for store initialization
 * - Bootstrap hook for font loading
 * - AppContent for main navigation
 * 
 * This module extracts the app shell structure from App.tsx to enable
 * cleaner separation of concerns and better testability.
 */

import React from 'react';
import { View, Image } from 'react-native';
import { AppProviders } from './providers';
import { useBootstrap } from './hooks';

export interface AppRootProps {
  /** Content to render after bootstrap (AppContent component) */
  children: React.ReactNode;
}

/**
 * LoadingScreen - Displayed during app bootstrap
 */
const LoadingScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
    <Image
      source={require('../../assets/images/icon_splash.png')}
      style={{ width: 200, height: 200, resizeMode: 'contain' }}
    />
  </View>
);

/**
 * Internal component that handles bootstrap state and renders content
 */
const BootstrapGate: React.FC<AppRootProps> = ({ children }) => {
  const { isReady } = useBootstrap();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

/**
 * AppRoot - Main application root component
 * 
 * Composes providers and bootstrap logic to create the app shell.
 * 
 * @example
 * ```tsx
 * // In App.tsx
 * export default function App() {
 *   return (
 *     <AppRoot>
 *       <AppContent />
 *     </AppRoot>
 *   );
 * }
 * ```
 */
export const AppRoot: React.FC<AppRootProps> = ({ children }) => {
  return (
    <AppProviders>
      <BootstrapGate>
        {children}
      </BootstrapGate>
    </AppProviders>
  );
};

export default AppRoot;

// Re-export providers and hooks for convenience
export { AppProviders } from './providers';
export { useBootstrap } from './hooks';
export type { BootstrapState, UseBootstrapOptions } from './hooks';
export type { AppProvidersProps } from './providers';
