/**
 * Domain types re-exported from src/types/admin;
 * service-specific types (ReportCounts, ResolutionActionEnum, etc.) defined here.
 */

export type {
  AdminUser,
  Report,
  AdminDeal as Deal,
  UserProfile,
  AppAnalytics,
} from '../../types/admin';

export interface ReportCounts {
  total: number;
  pending: number;
  review: number;
  resolved: number;
}

export type ResolutionActionEnum = 'keep' | 'remove' | 'warn_uploader' | 'ban_uploader';

export type ModerationAction = 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user';

export interface ServiceResult {
  success: boolean;
  error?: string;
}
