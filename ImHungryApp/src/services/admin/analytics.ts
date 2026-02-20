import { supabase } from '../../../lib/supabase';

import type { AppAnalytics } from './types';

export async function getAnalytics(): Promise<AppAnalytics> {
  try {
    const { count: totalUsers } = await supabase
      .from('user')
      .select('*', { count: 'exact', head: true });

    const { count: totalDeals } = await supabase
      .from('deal_instance')
      .select('*', { count: 'exact', head: true });

    const { count: totalReports } = await supabase
      .from('user_report')
      .select('*', { count: 'exact', head: true });

    const { count: pendingReports } = await supabase
      .from('user_report')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentSignups } = await supabase
      .from('user')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: dealsThisWeek } = await supabase
      .from('deal_instance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: sessionData } = await supabase
      .from('session')
      .select('user_id, user:user_id(display_name)')
      .not('user_id', 'is', null);

    const userSessionCounts = (sessionData || []).reduce((acc, session) => {
      const userId = session.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          display_name: session.user?.display_name || 'Unknown',
          deal_count: 0,
        };
      }
      acc[userId].deal_count++;
      return acc;
    }, {});

    const mostActiveUsersList = Object.values(userSessionCounts)
      .sort((a, b) => b.deal_count - a.deal_count)
      .slice(0, 3);

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

    const dealInteractionCounts = (interactionData || []).reduce((acc, interaction) => {
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
      .sort((a, b) => b.interaction_count - a.interaction_count)
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
      mostActiveUsers: mostActiveUsersList,
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
