/**
 * Admin Feature - Public API
 */

// Hooks
export { useAdmin } from './hooks/useAdmin';

// Stores
export { useAdminStore, useInitializeAdmin } from './stores/AdminStore';

// Types
export type {
  AdminReport,
  AdminDeal,
  AdminUser,
} from './types';
