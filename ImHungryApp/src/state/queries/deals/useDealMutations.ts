/**
 * state/queries/deals/useDealMutations.ts
 *
 * React Query mutations for deal operations (create, delete, vote).
 * Handles optimistic updates and cache invalidation.
 *
 * @example
 * function CreateDealScreen() {
 *   const { mutate: createDeal, isPending } = useCreateDeal()
 *
 *   const handleSubmit = () => {
 *     createDeal(dealData, {
 *       onSuccess: () => navigation.goBack(),
 *       onError: (error) => showError(error.message)
 *     })
 *   }
 * }
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDeal, deleteDeal, checkDealContentForProfanity } from '#/services/dealService'
import type { CreateDealData } from '#/types'
import { dealsKeys } from './useDealsQuery'

// ==========================================
// Create Deal
// ==========================================

interface CreateDealResult {
  success: boolean
  error?: string
}

/**
 * Hook for creating a new deal.
 *
 * Automatically invalidates the deals feed on success.
 *
 * @example
 * const { mutate, isPending, error } = useCreateDeal()
 *
 * mutate(dealData, {
 *   onSuccess: () => {
 *     showToast('Deal created!')
 *     navigation.goBack()
 *   },
 *   onError: (err) => {
 *     showToast(err.message)
 *   }
 * })
 */
export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateDealData): Promise<CreateDealResult> => {
      // Check for profanity first
      const profanityCheck = await checkDealContentForProfanity(data.title, data.description)
      if (!profanityCheck.success) {
        return { success: false, error: profanityCheck.error }
      }

      // Create the deal
      return createDeal(data)
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate deals cache to show the new deal
        queryClient.invalidateQueries({ queryKey: dealsKeys.all })
      }
    },
  })
}

// ==========================================
// Delete Deal
// ==========================================

interface DeleteDealParams {
  dealId: string
}

/**
 * Hook for deleting a deal.
 *
 * Automatically invalidates the deals feed on success.
 *
 * @example
 * const { mutate: deleteDeal, isPending } = useDeleteDeal()
 *
 * const handleDelete = () => {
 *   deleteDeal({ dealId }, {
 *     onSuccess: () => showToast('Deal deleted'),
 *   })
 * }
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealId }: DeleteDealParams) => {
      return deleteDeal(dealId)
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate deals cache
        queryClient.invalidateQueries({ queryKey: dealsKeys.all })
      }
    },
  })
}

// ==========================================
// Check Profanity
// ==========================================

/**
 * Hook for checking deal content for profanity.
 * Useful for real-time validation before submission.
 *
 * @example
 * const { mutate: checkProfanity, isPending } = useCheckProfanity()
 *
 * checkProfanity({ title, description }, {
 *   onSuccess: (result) => {
 *     if (!result.success) {
 *       showError(result.error)
 *     }
 *   }
 * })
 */
export function useCheckProfanity() {
  return useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      return checkDealContentForProfanity(title, description)
    },
  })
}
