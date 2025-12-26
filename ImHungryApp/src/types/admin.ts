// ==========================================
// Admin Domain Types
// ==========================================

/**
 * Admin user
 */
export interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  is_admin: boolean;
}

/**
 * Content report
 */
export interface Report {
  report_id: string;
  deal_id: string;
  reporter_user_id: string;
  uploader_user_id: string;
  reason_code_id: string;
  reason_text: string | null;
  status: 'pending' | 'review' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_by: string | null;
  resolution_action: string | null;
  deal?: {
    title: string;
    description: string;
    image_url?: string;
    restaurant_name?: string;
  };
  reporter?: {
    display_name: string;
  };
  uploader?: {
    display_name: string;
  };
  reason_code?: {
    reason_code: string;
    description: string;
  };
}

/**
 * Deal in admin panel
 */
export interface AdminDeal {
  deal_instance_id: string;
  deal_template_id: string;
  title: string;
  description: string;
  image_url: string | null;
  expiration_date: string | null;
  restaurant_name: string;
  restaurant_address: string;
  uploader_user_id: string;
  category_name: string | null;
  cuisine_name: string | null;
  created_at: string;
}

/**
 * App-wide analytics
 */
export interface AppAnalytics {
  totalUsers: number;
  totalDeals: number;
  totalReports: number;
  pendingReports: number;
  mostActiveUsers: Array<{
    user_id: string;
    display_name: string;
    deal_count: number;
  }>;
  mostPopularDeals: Array<{
    deal_instance_id: string;
    title: string;
    interaction_count: number;
  }>;
  recentSignups: number;
  dealsThisWeek: number;
}

/**
 * Report submission data
 */
export interface ReportSubmission {
  dealId: string;
  reporterUserId: string;
  uploaderUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

/**
 * Reason code for reports
 */
export interface ReasonCode {
  reason_code_id: string;
  reason_code: string;
  description: string;
}

/**
 * Reason code for blocks
 */
export interface BlockReasonCode {
  reason_code_id: string;
  reason_code: string | number;
  description: string | null;
}

/**
 * Data for creating a block
 */
export interface CreateBlockData {
  blockerUserId: string;
  blockedUserId: string;
  reasonCodeId: string;
  reasonText?: string;
}

/**
 * Result from block submission
 */
export interface BlockSubmissionResult {
  success: boolean;
  error?: string;
  blockId?: string;
}
