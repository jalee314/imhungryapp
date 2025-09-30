import { supabase } from '../../lib/supabase';

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

class ReportService {
  // Get all available reason codes from the database
  async getReasonCodes(): Promise<ReasonCode[]> {
    try {
      const { data, error } = await supabase
        .from('reason_code')
        .select('*')
        .order('reason_code');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Submit a user report
  async submitReport(report: ReportSubmission): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {

      // Validate required fields
      if (!report.dealId) {
        return { success: false, error: 'Deal ID is required' };
      }
      if (!report.reporterUserId) {
        return { success: false, error: 'Reporter user ID is required' };
      }
      if (!report.uploaderUserId) {
        return { success: false, error: 'Uploader user ID is required' };
      }
      if (!report.reasonCodeId) {
        return { success: false, error: 'Reason code ID is required' };
      }

      const { data, error } = await supabase
        .from('user_report')
        .insert([
          {
            deal_id: report.dealId, // This will be a real UUID from your database
            reporter_user_id: report.reporterUserId,
            uploader_user_id: report.uploaderUserId,
            reason_code_id: report.reasonCodeId,
            reason_text: report.reasonText || null,
            status: 'pending', // Default status
            created_at: new Date().toISOString(),
          }
        ])
        .select('report_id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, reportId: data.report_id };
    } catch (error) {
      return { success: false, error: 'Failed to submit report' };
    }
  }

  // Get reports for a specific user (for admin/moderator view)
  async getUserReports(userId: string, status?: string) {
    try {
      let query = supabase
        .from('user_report')
        .select(`
          *,
          reason_code:reason_code_id(reason_code, description),
          deal:deal_id(title, restaurant),
          reporter:reporter_user_id(username),
          uploader:uploader_user_id(username)
        `)
        .eq('uploader_user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Update report status (for admin/moderator use)
  async updateReportStatus(reportId: string, status: string, resolvedBy: string, resolutionAction?: string) {
    try {
      const { error } = await supabase
        .from('user_report')
        .update({
          status,
          resolved_by: resolvedBy,
          resolution_action: resolutionAction,
          updated_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export const reportService = new ReportService();
