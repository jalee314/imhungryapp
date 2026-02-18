import { supabase } from '../../../lib/supabase';
import type { ResolutionActionEnum, ModerationAction } from './types';

export function mapResolutionAction(
  action: ModerationAction
): ResolutionActionEnum {
  switch (action) {
    case 'delete_deal':
      return 'remove';
    case 'warn_user':
      return 'warn_uploader';
    case 'ban_user':
      return 'ban_uploader';
    case 'suspend_user':
      return 'ban_uploader';
    default:
      return 'keep';
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data?.is_admin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function logAction(
  actionType: string,
  targetType: string,
  targetId: string,
  actionDetails: any = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('admin_action_log')
      .insert({
        admin_user_id: user.id,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        action_details: actionDetails,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}
