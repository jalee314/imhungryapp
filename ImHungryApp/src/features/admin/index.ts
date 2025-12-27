/**
 * Admin Feature Module
 *
 * Handles admin functionality including:
 * - Admin authentication
 * - Dashboard overview
 * - Reports management
 * - Deals moderation
 * - Users management
 * - Mass upload tools
 *
 * @module features/admin
 */

// Screens
export { default as AdminLoginScreen } from './screens/AdminLoginScreen';
export { default as AdminDashboardScreen } from './screens/AdminDashboardScreen';
export { default as AdminReportsScreen } from './screens/AdminReportsScreen';
export { default as AdminDealsScreen } from './screens/AdminDealsScreen';
export { default as AdminUsersScreen } from './screens/AdminUsersScreen';
export { default as AdminMassUploadScreen } from './screens/AdminMassUploadScreen';

// Hooks
export { useAdmin } from './hooks/useAdmin';

// Store
export { useAdminStore, useInitializeAdmin } from './stores/AdminStore';
