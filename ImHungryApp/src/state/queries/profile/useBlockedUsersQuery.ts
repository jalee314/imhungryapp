/**
 * state/queries/profile/useBlockedUsersQuery.ts
 *
 * React Query hook for blocked users management.
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBlockedUsers, unblockUser } from '../../../services/blockService'

// ==========================================
// Query Keys
// ==========================================

export const blockedUsersKeys = {
  all: ['blockedUsers'] as const,
  list: () => [...blockedUsersKeys.all, 'list'] as const,
}

// ==========================================
// Types
// ==========================================

export interface BlockedUser {
  block_id: string
  blocked_user_id: string
  reason_code_id: string
  reason_text: string | null
  created_at: string
  blocked_user: {
    user_id: string
    display_name: string | null
    profile_photo: string | null
  }
}

// ==========================================
// Hook
// ==========================================

export function useBlockedUsersQuery() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: blockedUsersKeys.list(),
    queryFn: getBlockedUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: (_, unblockedUserId) => {
      // Optimistically remove from list
      queryClient.setQueryData<BlockedUser[]>(blockedUsersKeys.list(), (old) =>
        old?.filter((u) => u.blocked_user_id !== unblockedUserId) ?? []
      )
    },
  })

  const unblockMultiple = useCallback(
    async (userIds: string[]) => {
      const results = await Promise.all(
        userIds.map((id) => unblockMutation.mutateAsync(id).catch(() => ({ success: false })))
      )
      const successCount = results.filter((r) => r && (r as any).success !== false).length
      return { successCount, total: userIds.length }
    },
    [unblockMutation]
  )

  return {
    blockedUsers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    unblockUser: unblockMutation.mutate,
    unblockMultiple,
    isUnblocking: unblockMutation.isPending,
  }
}
