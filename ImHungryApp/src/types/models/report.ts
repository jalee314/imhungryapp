/**
 * Report-related type definitions
 */

export interface ReasonCode {
  reason_code_id: string;
  reason_code: string;
  description: string;
}

export interface ReportSubmission {
  dealId: string;
  reporterUserId: string;
  uploaderUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

export interface ReportSubmissionResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

