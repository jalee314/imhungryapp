import { supabase } from '../../../lib/supabase';
import { startPerfSpan } from '../../utils/perfMonitor';

import type { AppAnalytics } from './types';

const EMPTY_ANALYTICS: AppAnalytics = {
  totalUsers: 0,
  totalDeals: 0,
  totalReports: 0,
  pendingReports: 0,
  mostActiveUsers: [],
  mostPopularDeals: [],
  recentSignups: 0,
  dealsThisWeek: 0,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringValue = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

const parseRpcPayload = (value: unknown): Record<string, unknown> | null => {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

const parseMostActiveUsers = (value: unknown): AppAnalytics['mostActiveUsers'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const userId = toStringValue(item.user_id, '');
      if (!userId) return null;

      return {
        user_id: userId,
        display_name: toStringValue(item.display_name, 'Unknown'),
        deal_count: toNumber(item.deal_count),
      };
    })
    .filter((item): item is AppAnalytics['mostActiveUsers'][number] => Boolean(item));
};

const parseMostPopularDeals = (value: unknown): AppAnalytics['mostPopularDeals'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const dealId = toStringValue(item.deal_instance_id, '');
      if (!dealId) return null;

      return {
        deal_instance_id: dealId,
        title: toStringValue(item.title, 'Unknown'),
        interaction_count: toNumber(item.interaction_count),
      };
    })
    .filter((item): item is AppAnalytics['mostPopularDeals'][number] => Boolean(item));
};

export async function getAnalytics(): Promise<AppAnalytics> {
  const span = startPerfSpan('service.admin.analytics.fetch', {
    windowDays: 7,
    topUsers: 3,
    topDeals: 10,
  });

  try {
    const rpcArgs = {
      p_days: 7,
      p_top_users: 3,
      p_top_deals: 10,
    };

    const { data, error } = await supabase.rpc('get_admin_dashboard_analytics', rpcArgs);
    span.recordRoundTrip({
      request: rpcArgs,
      error: error?.message ?? null,
    });

    if (error) {
      span.end({ success: false, error });
      console.error('Error fetching analytics via RPC:', error);
      return EMPTY_ANALYTICS;
    }

    span.addPayload(data);
    const payload = parseRpcPayload(data);
    if (!payload) {
      span.end({
        metadata: {
          payloadType: typeof data,
          parseFailed: true,
        },
      });
      return EMPTY_ANALYTICS;
    }

    const analytics: AppAnalytics = {
      totalUsers: toNumber(payload.totalUsers),
      totalDeals: toNumber(payload.totalDeals),
      totalReports: toNumber(payload.totalReports),
      pendingReports: toNumber(payload.pendingReports),
      mostActiveUsers: parseMostActiveUsers(payload.mostActiveUsers),
      mostPopularDeals: parseMostPopularDeals(payload.mostPopularDeals),
      recentSignups: toNumber(payload.recentSignups),
      dealsThisWeek: toNumber(payload.dealsThisWeek),
    };

    span.end({
      metadata: {
        mostActiveUsers: analytics.mostActiveUsers.length,
        mostPopularDeals: analytics.mostPopularDeals.length,
      },
    });

    return analytics;
  } catch (error) {
    span.end({ success: false, error });
    console.error('Error fetching analytics:', error);
    return EMPTY_ANALYTICS;
  }
}
