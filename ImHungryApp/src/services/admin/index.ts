/**
 * Admin Service Facade
 *
 * Re-exports all domain modules through the original singleton interface so
 * existing consumers (`adminService.someMethod()`) keep working unchanged.
 */

export type {
  AdminUser,
  Report,
  ReportCounts,
  Deal,
  UserProfile,
  AppAnalytics,
  ResolutionActionEnum,
  ModerationAction,
  ServiceResult,
} from './types';

export { isAdmin, logAction, mapResolutionAction } from './core';
export { getReports, updateReportStatus, getReportCounts, dismissReport, resolveReportWithAction } from './reports';
export { getDeals, updateDeal, deleteDeal, featureDeal, pinDeal } from './deals';
export { searchUsers, getUser, warnUser, banUser, unbanUser, suspendUser, unsuspendUser, deleteUser } from './users';
export { getAnalytics } from './analytics';

import { getAnalytics } from './analytics';
import { isAdmin, logAction } from './core';
import { getDeals, updateDeal, deleteDeal, featureDeal, pinDeal } from './deals';
import { getReports, updateReportStatus, getReportCounts, dismissReport, resolveReportWithAction } from './reports';
import { searchUsers, getUser, warnUser, banUser, unbanUser, suspendUser, unsuspendUser, deleteUser } from './users';

/**
 * Facade object that mirrors the original AdminService class singleton.
 * Every property delegates to the extracted domain module so behaviour is
 * identical to the monolith.
 */
export const adminService = {
  isAdmin,
  logAction,
  getReports,
  updateReportStatus,
  getReportCounts,
  dismissReport,
  resolveReportWithAction,
  getDeals,
  updateDeal,
  deleteDeal,
  featureDeal,
  pinDeal,
  searchUsers,
  getUser,
  warnUser,
  banUser,
  unbanUser,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAnalytics,
};
