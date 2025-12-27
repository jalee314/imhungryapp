/**
 * Features Index
 *
 * Central export point for all feature modules.
 * Import features from here for cleaner imports across the app.
 *
 * @example
 * ```tsx
 * import { useAuth, AuthGuard } from '#/features'
 * import { Feed, useDealUpdate } from '#/features'
 * ```
 *
 * @module features
 */

// Auth Feature
export * from './auth';

// Deals Feature
export * from './deals';

// Discover Feature
export * from './discover';

// Profile Feature
export * from './profile';

// Admin Feature
export * from './admin';

// Contribution Feature
export * from './contribution';
