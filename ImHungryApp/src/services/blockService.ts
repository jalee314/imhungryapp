import { supabase } from '../../lib/supabase';
import { getCurrentUserId } from '../utils/authUtils';
import type { BlockReasonCode, CreateBlockData, BlockSubmissionResult, BlockedUser } from '../types';

// Submit a block request
export const submitBlock = async (
  blockedUserId: string,
  reasonCodeId: string,
  reasonText?: string
): Promise<BlockSubmissionResult> => {
  try {
    // Get current user
    const currentUser = await getCurrentUserId();
    if (!currentUser) {
      return { success: false, error: 'No authenticated user found' };
    }

    // Check if user is trying to block themselves
    if (currentUser === blockedUserId) {
      return { success: false, error: 'You cannot block yourself' };
    }

    // Check if user is already blocked
    const { data: existingBlock, error: checkError } = await supabase
      .from('user_block')
      .select('block_id')
      .eq('blocker_user_id', currentUser)
      .eq('blocked_user_id', blockedUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return { success: false, error: 'Failed to check existing blocks' };
    }

    if (existingBlock) {
      return { success: false, error: 'This user is already blocked' };
    }

    // Create the block record
    const blockData = {
      blocker_user_id: currentUser,
      blocked_user_id: blockedUserId,
      reason_code_id: reasonCodeId,
      reason_text: reasonText || null,
    };

    const { data, error } = await supabase
      .from('user_block')
      .insert(blockData)
      .select('block_id')
      .single();

    if (error) {
      return { success: false, error: 'Failed to block user' };
    }
    
    return { success: true, blockId: data.block_id };

  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Get block reason codes (you'll need to create this table)
export const getBlockReasonCodes = async (): Promise<BlockReasonCode[]> => {
  try {
    const { data, error } = await supabase
      .from('block_reason_codes')
      .select('*')
      .order('reason_name');

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
};

// Check if a user is blocked by current user
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUserId();
    if (!currentUser) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_block')
      .select('block_id')
      .eq('blocker_user_id', currentUser)
      .eq('blocked_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
};

// Unblock a user
export const unblockUser = async (blockedUserId: string): Promise<BlockSubmissionResult> => {
  try {
    const currentUser = await getCurrentUserId();
    if (!currentUser) {
      return { success: false, error: 'No authenticated user found' };
    }

    const { error } = await supabase
      .from('user_block')
      .delete()
      .eq('blocker_user_id', currentUser)
      .eq('blocked_user_id', blockedUserId);

    if (error) {
      return { success: false, error: `Failed to unblock user: ${error.message}` };
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Get blocked users for current user
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  try {
    const currentUser = await getCurrentUserId();
    if (!currentUser) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_block')
      .select(`
        block_id,
        blocked_user_id,
        reason_code_id,
        reason_text,
        created_at,
        blocked_user:blocked_user_id(
          user_id,
          display_name,
          profile_photo
        )
      `)
      .eq('blocker_user_id', currentUser)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
};
