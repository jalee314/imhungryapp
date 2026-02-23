/**
 * @file Admin feature types
 *
 * Re-exports domain types used by admin feature sections.
 * Admin sections import from here instead of from the service layer.
 */

export type {
  AdminUser,
  Report,
  AdminDeal,
  UserProfile,
  AppAnalytics,
} from '../../types/admin';

export type { ReportCounts, ResolutionActionEnum, ModerationAction, ServiceResult } from '../../services/admin/types';
