import { supabase } from '../../lib/supabase';

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
  recentSignups: number; // Last 7 days
  dealsThisWeek: number;
}

class AdminService {
  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
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

  // Log admin action
  async logAction(actionType: string, targetType: string, targetId: string, actionDetails: any = {}) {
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

  // === REPORT MANAGEMENT ===
  
  async getReports(status?: string): Promise<Report[]> {
    try {
      let query = supabase
        .from('user_report')
        .select(`
          *,
          deal:deal_instance!inner(
            deal_template!inner(
              title,
              description
            )
          ),
          reporter:user!user_report_reporter_user_id_fkey(display_name),
          uploader:user!user_report_uploader_user_id_fkey(display_name),
          reason_code(reason_code, description)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform the data to flatten the nested structure
      const transformedData = (data || []).map((report: any) => ({
        ...report,
        deal: {
          title: report.deal?.deal_template?.title || 'Unknown',
          description: report.deal?.deal_template?.description || '',
        }
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  async dismissReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_report')
        .update({
          status: 'resolved',
          resolution_action: 'dismissed',
          updated_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      if (error) throw error;
      
      await this.logAction('resolve_report', 'report', reportId, { action: 'dismissed' });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async resolveReportWithAction(
    reportId: string, 
    action: 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user',
    dealId?: string,
    userId?: string,
    reason?: string,
    suspensionDays?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update report status
      const { error: reportError } = await supabase
        .from('user_report')
        .update({
          status: 'resolved',
          resolution_action: action,
          updated_at: new Date().toISOString(),
        })
        .eq('report_id', reportId);

      if (reportError) throw reportError;

      // Execute action
      if (action === 'delete_deal' && dealId) {
        await this.deleteDeal(dealId);
      } else if (action === 'warn_user' && userId) {
        await this.warnUser(userId);
      } else if (action === 'ban_user' && userId) {
        await this.banUser(userId, reason);
      } else if (action === 'suspend_user' && userId && suspensionDays) {
        await this.suspendUser(userId, suspensionDays, reason);
      }

      await this.logAction('resolve_report', 'report', reportId, { action, dealId, userId, reason });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // === DEAL MANAGEMENT ===

  async getDeals(searchQuery?: string, limit: number = 100): Promise<Deal[]> {
    try {
      let query = supabase
        .from('deal_instance')
        .select(`
          deal_id,
          template_id,
          created_at,
          start_date,
          end_date,
          deal_template:template_id(
            title,
            description,
            image_metadata_id,
            user_id,
            restaurant!inner(
              name,
              address
            ),
            category(
              category_name
            ),
            cuisine(
              cuisine_name
            ),
            image_metadata:image_metadata_id(
              variants
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search query after fetching (since we can't query nested fields directly)
      let results = data || [];
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        results = results.filter((deal: any) => 
          deal.deal_template?.title?.toLowerCase().includes(lowerQuery) ||
          deal.deal_template?.description?.toLowerCase().includes(lowerQuery)
        );
      }

      return results.map((deal: any) => {
        // Get image URL from metadata variants
        let imageUrl = null;
        if (deal.deal_template?.image_metadata?.variants) {
          const variants = deal.deal_template.image_metadata.variants;
          // Try to get medium size, fallback to original or any available variant
          imageUrl = variants.medium || variants.large || variants.original || variants.small || null;
        }

        return {
          deal_instance_id: deal.deal_id,
          deal_template_id: deal.template_id,
          title: deal.deal_template?.title || 'Unknown',
          description: deal.deal_template?.description || '',
          image_url: imageUrl,
          expiration_date: deal.end_date || null,
          restaurant_name: deal.deal_template?.restaurant?.name || 'Unknown',
          restaurant_address: deal.deal_template?.restaurant?.address || '',
          uploader_user_id: deal.deal_template?.user_id || '',
          category_name: deal.deal_template?.category?.category_name || null,
          cuisine_name: deal.deal_template?.cuisine?.cuisine_name || null,
          created_at: deal.created_at,
        };
      });
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  async updateDeal(
    dealInstanceId: string,
    updates: {
      title?: string;
      description?: string;
      expiration_date?: string;
      image_metadata_id?: string | null;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the deal template ID first
      const { data: dealInstance, error: fetchError } = await supabase
        .from('deal_instance')
        .select('template_id')
        .eq('deal_id', dealInstanceId)
        .single();

      if (fetchError) throw fetchError;

      // Prepare template updates (title, description, image)
      const templateUpdates: any = {};
      if (updates.title) templateUpdates.title = updates.title;
      if (updates.description) templateUpdates.description = updates.description;
      if (updates.image_metadata_id !== undefined) templateUpdates.image_metadata_id = updates.image_metadata_id;

      // Update the deal template if there are template updates
      if (Object.keys(templateUpdates).length > 0) {
        const { error } = await supabase
          .from('deal_template')
          .update(templateUpdates)
          .eq('template_id', dealInstance.template_id);

        if (error) throw error;
      }

      // Update deal instance if expiration date is provided
      if (updates.expiration_date) {
        const { error: instanceError } = await supabase
          .from('deal_instance')
          .update({ end_date: updates.expiration_date })
          .eq('deal_id', dealInstanceId);

        if (instanceError) throw instanceError;
      }

      await this.logAction('edit_deal', 'deal', dealInstanceId, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteDeal(dealInstanceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('deal_instance')
        .delete()
        .eq('deal_id', dealInstanceId);

      if (error) throw error;

      await this.logAction('delete_deal', 'deal', dealInstanceId, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async featureDeal(dealInstanceId: string, featured: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: any = {
        is_featured: featured,
        featured_at: featured ? new Date().toISOString() : null,
        featured_by: featured ? user.id : null,
      };

      const { error } = await supabase
        .from('deal_instance')
        .update(updates)
        .eq('deal_id', dealInstanceId);

      if (error) throw error;

      await this.logAction('feature_deal', 'deal', dealInstanceId, { featured });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async pinDeal(dealInstanceId: string, pinOrder: number | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('deal_instance')
        .update({ pin_order: pinOrder })
        .eq('deal_id', dealInstanceId);

      if (error) throw error;

      await this.logAction('pin_deal', 'deal', dealInstanceId, { pinOrder });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // === USER MANAGEMENT ===

  async searchUsers(query: string): Promise<UserProfile[]> {
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

  async getUser(userId: string): Promise<UserProfile | null> {
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

  async warnUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('increment_warning_count', { user_id: userId });

      if (error) {
        // If function doesn't exist, do it manually
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

      await this.logAction('warn_user', 'user', userId, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async banUser(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user')
        .update({
          is_banned: true,
          ban_reason: reason || null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      await this.logAction('ban_user', 'user', userId, { reason });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user')
        .update({
          is_banned: false,
          ban_reason: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      await this.logAction('unban_user', 'user', userId, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async suspendUser(userId: string, days: number, reason?: string): Promise<{ success: boolean; error?: string }> {
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

      await this.logAction('suspend_user', 'user', userId, { days, reason });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unsuspendUser(userId: string): Promise<{ success: boolean; error?: string }> {
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

      await this.logAction('unsuspend_user', 'user', userId, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Call Supabase edge function to delete user
      const { error } = await supabase.functions.invoke('delete-auth-user', {
        body: { userId },
      });

      if (error) throw error;

      await this.logAction('delete_user', 'user', userId, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // === ANALYTICS ===

  async getAnalytics(): Promise<AppAnalytics> {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true });

      // Total deals
      const { count: totalDeals } = await supabase
        .from('deal_instance')
        .select('*', { count: 'exact', head: true });

      // Total reports
      const { count: totalReports } = await supabase
        .from('user_report')
        .select('*', { count: 'exact', head: true });

      // Pending reports
      const { count: pendingReports } = await supabase
        .from('user_report')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentSignups } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Deals this week
      const { count: dealsThisWeek } = await supabase
        .from('deal_instance')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Most active users (based on session count)
      const { data: sessionData } = await supabase
        .from('session')
        .select('user_id, user:user_id(display_name)')
        .not('user_id', 'is', null);

      const userSessionCounts = (sessionData || []).reduce((acc: any, session: any) => {
        const userId = session.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            display_name: session.user?.display_name || 'Unknown',
            deal_count: 0, // Keeping the same interface, but represents session count
          };
        }
        acc[userId].deal_count++;
        return acc;
      }, {});

      const mostActiveUsersList = Object.values(userSessionCounts)
        .sort((a: any, b: any) => b.deal_count - a.deal_count)
        .slice(0, 3);

      // Most popular deals (based on interaction count)
      const { data: interactionData } = await supabase
        .from('interaction')
        .select(`
          deal_id,
          deal_instance:deal_id(
            deal_id,
            deal_template:template_id(
              title,
              image_metadata:image_metadata_id(
                variants
              )
            )
          )
        `);

      const dealInteractionCounts = (interactionData || []).reduce((acc: any, interaction: any) => {
        const dealId = interaction.deal_id;
        if (!acc[dealId] && interaction.deal_instance) {
          acc[dealId] = {
            deal_instance_id: dealId,
            title: interaction.deal_instance?.deal_template?.title || 'Unknown',
            interaction_count: 0,
          };
        }
        if (acc[dealId]) {
          acc[dealId].interaction_count++;
        }
        return acc;
      }, {});

      const mostPopularDeals = (Object.values(dealInteractionCounts)
        .sort((a: any, b: any) => b.interaction_count - a.interaction_count)
        .slice(0, 10)) as Array<{
          deal_instance_id: string;
          title: string;
          interaction_count: number;
        }>;

      return {
        totalUsers: totalUsers || 0,
        totalDeals: totalDeals || 0,
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        mostActiveUsers: mostActiveUsersList as any,
        mostPopularDeals: mostPopularDeals || [],
        recentSignups: recentSignups || 0,
        dealsThisWeek: dealsThisWeek || 0,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        totalUsers: 0,
        totalDeals: 0,
        totalReports: 0,
        pendingReports: 0,
        mostActiveUsers: [],
        mostPopularDeals: [],
        recentSignups: 0,
        dealsThisWeek: 0,
      };
    }
  }
}

export const adminService = new AdminService();

