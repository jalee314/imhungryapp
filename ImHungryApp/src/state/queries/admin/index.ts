/**
 * state/queries/admin/index.ts
 *
 * Admin query hooks exports
 */

export {
  adminKeys,
  useAdminDealsQuery,
  useAdminUsersQuery,
  useAdminReportsQuery,
  useAdminDealMutations,
  useAdminUserMutations,
  useAdminReportMutations,
} from './useAdminQueries'

export type {
  UseAdminDealsQueryParams,
  UseAdminUsersQueryParams,
  UseAdminReportsQueryParams,
} from './useAdminQueries'
