import { supabase } from '../../../lib/supabase';

import { getErrorMessage, logAction } from './core';
import type { UserProfile, ServiceResult } from './types';

export async function searchUsers(query: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function warnUser(userId: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase.rpc('increment_warning_count', { user_id: userId });

    if (error) {
      const { data: user } = await supabase
        .from('user')
        .select('warning_count')
        .eq('user_id', userId)
        .single();

      const { error: updateError } = await supabase
        .from('user')
        .update({ warning_count: (user?.warning_count || 0) + 1 })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    await logAction('warn_user', 'user', userId, {});
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function banUser(userId: string, reason?: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('user')
      .update({
        is_banned: true,
        ban_reason: reason || null,
      })
      .eq('user_id', userId);

    if (error) throw error;

    await logAction('ban_user', 'user', userId, { reason });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function unbanUser(userId: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('user')
      .update({
        is_banned: false,
        ban_reason: null,
      })
      .eq('user_id', userId);

    if (error) throw error;

    await logAction('unban_user', 'user', userId, {});
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function suspendUser(userId: string, days: number, reason?: string): Promise<ServiceResult> {
  try {
    const suspensionUntil = new Date();
    suspensionUntil.setDate(suspensionUntil.getDate() + days);

    const { error } = await supabase
      .from('user')
      .update({
        is_suspended: true,
        suspension_until: suspensionUntil.toISOString(),
        suspended_reason: reason || null,
      })
      .eq('user_id', userId);

    if (error) throw error;

    await logAction('suspend_user', 'user', userId, { days, reason });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function unsuspendUser(userId: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('user')
      .update({
        is_suspended: false,
        suspension_until: null,
        suspended_reason: null,
      })
      .eq('user_id', userId);

    if (error) throw error;

    await logAction('unsuspend_user', 'user', userId, {});
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteUser(userId: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase.functions.invoke('delete-auth-user', {
      body: { userId },
    });

    if (error) throw error;

    await logAction('delete_user', 'user', userId, {});
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}
