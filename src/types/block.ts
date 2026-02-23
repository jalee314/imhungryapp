export interface ReportSubmission {
  dealId: string;
  reporterUserId: string;
  uploaderUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

export interface ReasonCode {
  reason_code_id: string;
  reason_code: string;
  description: string;
}

export interface BlockReasonCode {
  reason_code_id: string;
  reason_code: string | number;
  description: string | null;
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
