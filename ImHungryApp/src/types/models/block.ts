/**
 * Block-related type definitions
 */

export interface BlockReasonCode {
  reason_code_id: string;
  reason_name: string;
  description: string;
}

export interface CreateBlockData {
  blockerUserId: string;
  blockedUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

export interface BlockSubmissionResult {
  success: boolean;
  error?: string;
  blockId?: string;
}

export interface BlockedUser {
  block_id: string;
  blocked_user_id: string;
  reason_code_id: string;
  reason_text?: string;
  created_at: string;
  blocked_user: {
    user_id: string;
    display_name: string;
    profile_photo?: string;
  };
}

