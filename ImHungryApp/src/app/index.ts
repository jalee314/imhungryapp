/**
 * App Module
 * 
 * Central export for app-layer modules including:
 * - AppRoot: Main application shell component
 * - AppProviders: Provider composition
 * - hooks: Bootstrap and lifecycle hooks
 * - navigation: Route constants and utilities
 */

// App root component
export { AppRoot, default } from './AppRoot';
export type { AppRootProps } from './AppRoot';

// Providers
export { AppProviders } from './providers';
export type { AppProvidersProps } from './providers';

// Hooks
export { useBootstrap } from './hooks';
export type { BootstrapState, UseBootstrapOptions } from './hooks';

// Navigation (re-export from existing module)
export * from './navigation';
