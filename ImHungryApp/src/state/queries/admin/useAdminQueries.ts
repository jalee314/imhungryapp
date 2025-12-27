/**
 * state/queries/admin/useAdminQueries.ts
 *
 * React Query hooks for admin screens.
 * Handles deals, users, and reports with search/filter support.
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService, Deal, UserProfile, Report, ReportCounts } from '../../../services/adminService'
import { supabase } from '../../../../lib/supabase'

// ==========================================
// Query Keys
// ==========================================

export const adminKeys = {
  all: ['admin'] as const,
  deals: (search?: string) => [...adminKeys.all, 'deals', { search }] as const,
  users: (search?: string) => [...adminKeys.all, 'users', { search }] as const,
  reports: (status?: string) => [...adminKeys.all, 'reports', { status }] as const,
  reportCounts: () => [...adminKeys.all, 'reportCounts'] as const,
}

// ==========================================
// Admin Deals Query
// ==========================================

export interface UseAdminDealsQueryParams {
  searchQuery?: string
  enabled?: boolean
}

export function useAdminDealsQuery(params?: UseAdminDealsQueryParams) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: adminKeys.deals(params?.searchQuery),
    queryFn: () => adminService.getDeals(params?.searchQuery),
    staleTime: 2 * 60 * 1000,
    enabled: params?.enabled ?? true,
  })

  const refetch = useCallback(
    async (newSearch?: string) => {
      if (newSearch !== undefined) {
        await queryClient.fetchQuery({
          queryKey: adminKeys.deals(newSearch),
          queryFn: () => adminService.getDeals(newSearch),
        })
      } else {
        await query.refetch()
      }
    },
    [queryClient, query]
  )

  return {
    deals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch,
  }
}

// ==========================================
// Admin Users Query
// ==========================================

export interface UseAdminUsersQueryParams {
  searchQuery?: string
  enabled?: boolean
}

export function useAdminUsersQuery(params?: UseAdminUsersQueryParams) {
  const queryClient = useQueryClient()

  // Default query fetches recent users
  const fetchUsers = async (search?: string) => {
    if (search && search.trim()) {
      return adminService.searchUsers(search)
    }
    // Get recent users
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  }

  const query = useQuery({
    queryKey: adminKeys.users(params?.searchQuery),
    queryFn: () => fetchUsers(params?.searchQuery),
    staleTime: 2 * 60 * 1000,
    enabled: params?.enabled ?? true,
  })

  const search = useCallback(
    async (searchQuery: string) => {
      return queryClient.fetchQuery({
        queryKey: adminKeys.users(searchQuery),
        queryFn: () => fetchUsers(searchQuery),
      })
    },
    [queryClient]
  )

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    search,
  }
}

// ==========================================
// Admin Reports Query
// ==========================================

export interface UseAdminReportsQueryParams {
  statusFilter?: 'pending' | 'review' | 'resolved' | 'all'
  enabled?: boolean
}

export function useAdminReportsQuery(params?: UseAdminReportsQueryParams) {
  const queryClient = useQueryClient()

  const statusFilter = params?.statusFilter ?? 'pending'
  const normalizedStatus = statusFilter === 'all' ? undefined : statusFilter

  const query = useQuery({
    queryKey: adminKeys.reports(statusFilter),
    queryFn: () => adminService.getReports(normalizedStatus),
    staleTime: 1 * 60 * 1000, // 1 minute for reports
    enabled: params?.enabled ?? true,
  })

  const countsQuery = useQuery({
    queryKey: adminKeys.reportCounts(),
    queryFn: () => adminService.getReportCounts(),
    staleTime: 1 * 60 * 1000,
  })

  const refetch = useCallback(async () => {
    await Promise.all([
      query.refetch(),
      countsQuery.refetch(),
    ])
  }, [query, countsQuery])

  return {
    reports: query.data ?? [],
    counts: countsQuery.data ?? { total: 0, pending: 0, review: 0, resolved: 0 },
    isLoading: query.isLoading,
    isCountsLoading: countsQuery.isLoading,
    error: query.error as Error | null,
    refetch,
  }
}

// ==========================================
// Admin Mutations
// ==========================================

export function useAdminDealMutations() {
  const queryClient = useQueryClient()

  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const result = await adminService.deleteDeal(dealId)
      if (!result.success) throw new Error(result.error || 'Failed to delete deal')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.deals() })
    },
  })

  const updateDeal = useMutation({
    mutationFn: async (params: {
      dealId: string
      title?: string
      description?: string
      imageMetadataId?: string | null
    }) => {
      const result = await adminService.updateDeal(params.dealId, {
        title: params.title,
        description: params.description,
        image_metadata_id: params.imageMetadataId,
      })
      if (!result.success) throw new Error(result.error || 'Failed to update deal')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.deals() })
    },
  })

  return { deleteDeal, updateDeal }
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient()

  const warnUser = useMutation({
    mutationFn: async (userId: string) => {
      const result = await adminService.warnUser(userId)
      if (!result.success) throw new Error(result.error || 'Failed to warn user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  const suspendUser = useMutation({
    mutationFn: async (params: { userId: string; days: number; reason?: string }) => {
      const result = await adminService.suspendUser(params.userId, params.days, params.reason)
      if (!result.success) throw new Error(result.error || 'Failed to suspend user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  const unsuspendUser = useMutation({
    mutationFn: async (userId: string) => {
      const result = await adminService.unsuspendUser(userId)
      if (!result.success) throw new Error(result.error || 'Failed to unsuspend user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  const banUser = useMutation({
    mutationFn: async (params: { userId: string; reason?: string }) => {
      const result = await adminService.banUser(params.userId, params.reason)
      if (!result.success) throw new Error(result.error || 'Failed to ban user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      const result = await adminService.unbanUser(userId)
      if (!result.success) throw new Error(result.error || 'Failed to unban user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const result = await adminService.deleteUser(userId)
      if (!result.success) throw new Error(result.error || 'Failed to delete user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  return { warnUser, suspendUser, unsuspendUser, banUser, unbanUser, deleteUser }
}

export function useAdminReportMutations() {
  const queryClient = useQueryClient()

  const updateReportStatus = useMutation({
    mutationFn: async (params: { reportId: string; status: 'pending' | 'review' }) => {
      const result = await adminService.updateReportStatus(params.reportId, params.status)
      if (!result.success) throw new Error(result.error || 'Failed to update status')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports() })
      queryClient.invalidateQueries({ queryKey: adminKeys.reportCounts() })
    },
  })

  const dismissReport = useMutation({
    mutationFn: async (reportId: string) => {
      const result = await adminService.dismissReport(reportId)
      if (!result.success) throw new Error(result.error || 'Failed to dismiss report')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports() })
      queryClient.invalidateQueries({ queryKey: adminKeys.reportCounts() })
    },
  })

  const resolveReportWithAction = useMutation({
    mutationFn: async (params: {
      reportId: string
      action: 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user'
      dealId?: string
      userId?: string
      reason?: string
      suspensionDays?: number
    }) => {
      const result = await adminService.resolveReportWithAction(
        params.reportId,
        params.action,
        params.dealId,
        params.userId,
        params.reason,
        params.suspensionDays
      )
      if (!result.success) throw new Error(result.error || 'Failed to resolve report')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports() })
      queryClient.invalidateQueries({ queryKey: adminKeys.reportCounts() })
      queryClient.invalidateQueries({ queryKey: adminKeys.deals() })
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })

  return { updateReportStatus, dismissReport, resolveReportWithAction }
}
