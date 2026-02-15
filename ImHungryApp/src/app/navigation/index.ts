/**
 * Navigation Module (PR-020)
 * 
 * Central export for navigation-related constants, types, and utilities.
 * 
 * This module provides:
 * - Route name constants (routes.ts)
 * - TypeScript navigation types (types.ts)
 * - Deep linking configuration (linking.ts)
 * - Legacy exports for backward compatibility (routeConstants.ts)
 */

// Route name constants
export * from './routes';

// Navigation types for React Navigation
export * from './types';

// Deep linking configuration
export * from './linking';

// Legacy exports (backward compatibility)
// Note: routeConstants.ts now re-exports from routes.ts
export * from './routeConstants';
