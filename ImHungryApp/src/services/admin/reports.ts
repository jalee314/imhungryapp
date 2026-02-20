import { supabase } from '../../../lib/supabase';

import { logAction, mapResolutionAction } from './core';
import { deleteDeal } from './deals';
import type { Report, ReportCounts, ModerationAction, ServiceResult } from './types';
import { warnUser, banUser, suspendUser } from './users';

export async function getReports(status?: string): Promise<Report[]> {
  try {
    let query = supabase
      .from('user_report')
      .select(`
        *,
        deal:deal_instance!inner(
          deal_id,
          template_id,
          deal_template!inner(
            title,
            description,
            restaurant:restaurant_id(
              name,
              address
            ),
            image_metadata:image_metadata_id(
              variants
            )
          )
        ),
        reporter:user!user_report_reporter_user_id_fkey(display_name, profile_photo),
        uploader:user!user_report_uploader_user_id_fkey(display_name, profile_photo),
        reason_code(reason_code, description)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transformedData = (data || []).map((report: any) => {
      const template = report.deal?.deal_template || {};
      const restaurant = template?.restaurant || {};
      const variants = template?.image_metadata?.variants;

      let imageUrl = null;
      if (variants) {
        imageUrl = variants.medium || variants.large || variants.original || variants.small || null;
      }

      return {
        ...report,
        deal: {
          title: template?.title || 'Unknown',
          description: template?.description || '',
          image_url: imageUrl,
          restaurant_name: restaurant?.name || 'Unknown',
          restaurant_address: restaurant?.address || '',
        }
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function updateReportStatus(
  reportId: string,
  status: 'pending' | 'review'
): Promise<ServiceResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_report')
      .update({
        status,
        resolved_by: null,
        resolution_action: null,
      })
      .eq('report_id', reportId);

    if (error) throw error;

    await logAction('update_report_status', 'report', reportId, { status });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReportCounts(): Promise<ReportCounts> {
  try {
    const [
      { count: totalCount },
      { count: pendingCount },
      { count: reviewCount },
      { count: resolvedCount },
    ] = await Promise.all([
      supabase.from('user_report').select('*', { count: 'exact', head: true }),
      supabase.from('user_report').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('user_report').select('*', { count: 'exact', head: true }).eq('status', 'review'),
      supabase.from('user_report').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    ]);

    return {
      total: totalCount || 0,
      pending: pendingCount || 0,
      review: reviewCount || 0,
      resolved: resolvedCount || 0,
    };
  } catch (error) {
    console.error('Error fetching report counts:', error);
    return {
      total: 0,
      pending: 0,
      review: 0,
      resolved: 0,
    };
  }
}

export async function dismissReport(reportId: string): Promise<ServiceResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_report')
      .update({
        status: 'resolved',
        resolution_action: 'keep',
        resolved_by: user.id,
      })
      .eq('report_id', reportId);

    if (error) throw error;

    await logAction('resolve_report', 'report', reportId, { action: 'dismissed' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveReportWithAction(
  reportId: string,
  action: ModerationAction,
  dealId?: string,
  userId?: string,
  reason?: string,
  suspensionDays?: number
): Promise<ServiceResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const resolution_action = mapResolutionAction(action);

    const { error: reportError } = await supabase
      .from('user_report')
      .update({
        status: 'resolved',
        resolution_action,
        resolved_by: user.id,
      })
      .eq('report_id', reportId);

    if (reportError) throw reportError;

    if (action === 'delete_deal') {
      if (!dealId) throw new Error('Missing deal ID for delete action');
      const result = await deleteDeal(dealId);
      if (!result.success) throw new Error(result.error || 'Failed to delete deal');
    } else if (action === 'warn_user') {
      if (!userId) throw new Error('Missing user ID for warn action');
      const result = await warnUser(userId);
      if (!result.success) throw new Error(result.error || 'Failed to warn user');
    } else if (action === 'ban_user') {
      if (!userId) throw new Error('Missing user ID for ban action');
      const result = await banUser(userId, reason);
      if (!result.success) throw new Error(result.error || 'Failed to ban user');
    } else if (action === 'suspend_user') {
      if (!userId) throw new Error('Missing user ID for suspension');
      if (!suspensionDays || Number.isNaN(suspensionDays)) {
        throw new Error('Suspension days are required');
      }
      const result = await suspendUser(userId, suspensionDays, reason);
      if (!result.success) throw new Error(result.error || 'Failed to suspend user');
    }

    await logAction('resolve_report', 'report', reportId, { action, dealId, userId, reason });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
