/**
 * AppProviders.tsx
 * 
 * Central provider composition for the application.
 * Wraps children with all necessary store initialization hooks.
 * 
 * This module extracts the provider/store initialization logic from App.tsx
 * to enable cleaner separation of concerns and better testability.
 */

import React, { ReactNode } from 'react';
import { useInitializeAuth } from '@stores/AuthStore';
import { useInitializeAdmin } from '@stores/AdminStore';
import { useInitializeDataCache } from '@stores/DataCacheStore';
import { useInitializeLocation } from '@stores/LocationStore';

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Internal component that handles store initialization.
 * The initialization hooks must be called within a component body.
 */
const StoreInitializer: React.FC<AppProvidersProps> = ({ children }) => {
  // Initialize Zustand stores once at app start
  // These hooks must be called in the same order every render
  useInitializeAuth();
  useInitializeAdmin();
  useInitializeDataCache();
  useInitializeLocation();

  return <>{children}</>;
};

/**
 * AppProviders - Provider composition wrapper
 * 
 * Wraps the application with all necessary providers and store initializers.
 * This component should be placed near the root of the component tree.
 * 
 * @example
 * ```tsx
 * <AppProviders>
 *   <AppContent />
 * </AppProviders>
 * ```
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <StoreInitializer>
      {children}
    </StoreInitializer>
  );
};

export default AppProviders;
