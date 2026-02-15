/**
 * AppRoot.tsx
 * 
 * Main application root component that composes:
 * - AppProviders for store initialization
 * - FontGate for font loading gate
 * - AppContent for main navigation
 * 
 * This module extracts the app shell structure from App.tsx to enable
 * cleaner separation of concerns and better testability.
 */

import React from 'react';
import { AppProviders } from './providers';
import { FontGate } from './gates';

export interface AppRootProps {
  /** Content to render after bootstrap (AppContent component) */
  children: React.ReactNode;
}

/**
 * AppRoot - Main application root component
 * 
 * Composes providers and bootstrap logic to create the app shell.
 * Uses FontGate to block rendering until fonts are loaded.
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
      <FontGate>
        {children}
      </FontGate>
    </AppProviders>
  );
};

export default AppRoot;

// Re-export providers, hooks, and gates for convenience
export { AppProviders } from './providers';
export { useBootstrap } from './hooks';
export { FontGate, SplashGate } from './gates';
export type { BootstrapState, UseBootstrapOptions } from './hooks';
export type { AppProvidersProps } from './providers';
export type { FontGateProps, SplashGateProps } from './gates';
