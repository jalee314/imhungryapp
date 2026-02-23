/**
 * Legacy entry-point – delegates entirely to the split admin modules.
 *
 * Existing `import { adminService } from '../../services/adminService'`
 * statements continue to work without changes.
 */
export {
  adminService,
  type AdminUser,
  type Report,
  type ReportCounts,
  type Deal,
  type UserProfile,
  type AppAnalytics,
  type ResolutionActionEnum,
  type ModerationAction,
  type ServiceResult,
} from './admin';
