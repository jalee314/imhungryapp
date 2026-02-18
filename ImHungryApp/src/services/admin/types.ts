export interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  is_admin: boolean;
}

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
    restaurant_address?: string;
  };
  reporter?: {
    display_name: string;
    profile_photo?: string | null;
  };
  uploader?: {
    display_name: string;
    profile_photo?: string | null;
  };
  reason_code?: {
    reason_code: string;
    description: string;
  };
}

export interface ReportCounts {
  total: number;
  pending: number;
  review: number;
  resolved: number;
}

export interface Deal {
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

export interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
  profile_photo: string | null;
  location_city: string | null;
  is_admin: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspension_until: string | null;
  ban_reason: string | null;
  suspended_reason: string | null;
  warning_count: number;
  created_at: string;
}

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

export type ResolutionActionEnum = 'keep' | 'remove' | 'warn_uploader' | 'ban_uploader';

export type ModerationAction = 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user';

export interface ServiceResult {
  success: boolean;
  error?: string;
}
