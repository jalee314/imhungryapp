import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';
import type { Deal } from '../types/deal';
import {
  estimatePayloadBytes,
  recordCacheAccess,
  recordCacheRefresh,
  startPerfSpan,
} from '../utils/perfMonitor';

import {
  addDistancesToDeals,
  addVotesToDeals,
  fetchRankedDeals,
  transformDealForUI,
} from './dealService';

type Coordinates = { lat: number; lng: number };
type RefreshReason = 'miss' | 'stale' | 'manual' | 'realtime';

const LEGACY_CACHE_KEY = 'cached_deals';
const LEGACY_CACHE_TIMESTAMP_KEY = 'cached_deals_timestamp';
const CACHE_KEY_PREFIX = 'cached_deals';
const CACHE_TIMESTAMP_KEY_PREFIX = 'cached_deals_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CONTEXT_KEY = 'default';
const CONTEXT_COORDINATE_PRECISION = 3;
const CACHE_METRIC_NAME = 'deal_cache';

const normalizeCoordinates = (coordinates?: Coordinates): Coordinates | undefined => {
  if (!coordinates) return undefined;
  if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
    return undefined;
  }

  const lat = Number(coordinates.lat.toFixed(CONTEXT_COORDINATE_PRECISION));
  const lng = Number(coordinates.lng.toFixed(CONTEXT_COORDINATE_PRECISION));
  return { lat, lng };
};

const contextKeyForCoordinates = (coordinates?: Coordinates): string => {
  if (!coordinates) {
    return DEFAULT_CONTEXT_KEY;
  }
  return `loc_${coordinates.lat.toFixed(CONTEXT_COORDINATE_PRECISION)}_${coordinates.lng.toFixed(
    CONTEXT_COORDINATE_PRECISION,
  )}`;
};

const storageKeysForContext = (contextKey: string): { deals: string; timestamp: string } => ({
  deals: `${CACHE_KEY_PREFIX}:${contextKey}`,
  timestamp: `${CACHE_TIMESTAMP_KEY_PREFIX}:${contextKey}`,
});

const parseTimestamp = (rawValue: string | null): number | undefined => {
  if (!rawValue) return undefined;

  try {
    const parsed = JSON.parse(rawValue) as string | number;
    const asDate = new Date(parsed).getTime();
    return Number.isFinite(asDate) ? asDate : undefined;
  } catch {
    return undefined;
  }
};

class DealCacheService {
  private realtimeChannel: RealtimeChannel | null = null;
  private subscribers: Set<(deals: Deal[]) => void> = new Set();
  private dealsByContext = new Map<string, Deal[]>();
  private timestampsByContext = new Map<string, number>();
  private contextCoordinates = new Map<string, Coordinates | undefined>([
    [DEFAULT_CONTEXT_KEY, undefined],
  ]);
  private knownContextKeys = new Set<string>([DEFAULT_CONTEXT_KEY]);
  private inflightFetches = new Map<string, Promise<Deal[]>>();
  private isInitialized = false;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private activeContextKey = DEFAULT_CONTEXT_KEY;

  private setActiveContext(customCoordinates?: Coordinates): {
    contextKey: string;
    coordinates?: Coordinates;
  } {
    const coordinates = normalizeCoordinates(customCoordinates);
    const contextKey = contextKeyForCoordinates(coordinates);
    this.activeContextKey = contextKey;
    this.knownContextKeys.add(contextKey);
    this.contextCoordinates.set(contextKey, coordinates);
    return { contextKey, coordinates };
  }

  private isTimestampStale(timestamp?: number): boolean {
    if (!timestamp) return true;
    return Date.now() - timestamp > CACHE_DURATION;
  }

  private async persistContextCache(contextKey: string, deals: Deal[], timestamp: number): Promise<void> {
    const keys = storageKeysForContext(contextKey);
    await Promise.all([
      AsyncStorage.setItem(keys.deals, JSON.stringify(deals)),
      AsyncStorage.setItem(keys.timestamp, JSON.stringify(new Date(timestamp).toISOString())),
    ]);
  }

  private async loadContextFromStorage(
    contextKey: string,
  ): Promise<{ deals: Deal[]; timestamp?: number; source: 'storage' | 'none' }> {
    const keys = storageKeysForContext(contextKey);
    let [dealsJson, timestampJson] = await Promise.all([
      AsyncStorage.getItem(keys.deals),
      AsyncStorage.getItem(keys.timestamp),
    ]);

    if (!dealsJson && contextKey === DEFAULT_CONTEXT_KEY) {
      [dealsJson, timestampJson] = await Promise.all([
        AsyncStorage.getItem(LEGACY_CACHE_KEY),
        AsyncStorage.getItem(LEGACY_CACHE_TIMESTAMP_KEY),
      ]);
    }

    if (!dealsJson) {
      return { deals: [], source: 'none' };
    }

    try {
      const parsedDeals = JSON.parse(dealsJson) as Deal[];
      const timestamp = parseTimestamp(timestampJson);
      this.dealsByContext.set(contextKey, parsedDeals);
      if (timestamp) {
        this.timestampsByContext.set(contextKey, timestamp);
      }
      return {
        deals: parsedDeals,
        timestamp,
        source: 'storage',
      };
    } catch (error) {
      console.error('Error parsing cached deals:', error);
      return { deals: [], source: 'none' };
    }
  }

  private async getContextCache(
    contextKey: string,
  ): Promise<{ deals: Deal[]; timestamp?: number; source: 'memory' | 'storage' | 'none' }> {
    const inMemoryDeals = this.dealsByContext.get(contextKey);
    if (inMemoryDeals) {
      return {
        deals: inMemoryDeals,
        timestamp: this.timestampsByContext.get(contextKey),
        source: 'memory',
      };
    }

    return this.loadContextFromStorage(contextKey);
  }

  private notifySubscribers(contextKey: string): void {
    if (contextKey !== this.activeContextKey) return;
    const deals = this.dealsByContext.get(contextKey) ?? [];
    this.subscribers.forEach((callback) => callback(deals));
  }

  private async refreshContext(
    contextKey: string,
    coordinates: Coordinates | undefined,
    reason: RefreshReason,
  ): Promise<Deal[]> {
    const inflight = this.inflightFetches.get(contextKey);
    if (inflight) {
      return inflight;
    }

    const refreshPromise = (async () => {
      const span = startPerfSpan('service.feed.fetch_ranked_deals', {
        contextKey,
        hasCustomCoordinates: Boolean(coordinates),
        refreshReason: reason,
      });
      const refreshStartedAt = Date.now();
      let spanClosed = false;
      let roundTrips = 0;
      let transformedDeals: Deal[] = [];

      const recordRoundTrip = (payload: unknown): void => {
        roundTrips += 1;
        span.recordRoundTrip(payload);
      };

      try {
        const dbDeals = await fetchRankedDeals();
        recordRoundTrip({
          source: 'dealService.fetchRankedDeals',
          count: dbDeals.length,
          contextKey,
        });

        const dealsWithDistance = coordinates
          ? await addDistancesToDeals(dbDeals, coordinates)
          : dbDeals;
        if (coordinates) {
          recordRoundTrip({
            source: 'dealService.addDistancesToDeals',
            count: dealsWithDistance.length,
            contextKey,
          });
        }

        const enrichedDeals = await addVotesToDeals(dealsWithDistance);
        recordRoundTrip({
          source: 'dealService.addVotesToDeals',
          count: enrichedDeals.length,
          contextKey,
        });

        transformedDeals = enrichedDeals.map(transformDealForUI);
        const refreshedAt = Date.now();

        this.dealsByContext.set(contextKey, transformedDeals);
        this.timestampsByContext.set(contextKey, refreshedAt);
        this.contextCoordinates.set(contextKey, coordinates);
        this.knownContextKeys.add(contextKey);

        await this.persistContextCache(contextKey, transformedDeals, refreshedAt);
        this.notifySubscribers(contextKey);

        span.addPayload(transformedDeals);
        recordCacheRefresh(CACHE_METRIC_NAME, {
          durationMs: refreshedAt - refreshStartedAt,
          roundTrips,
          payloadBytes: estimatePayloadBytes(transformedDeals),
          triggeredBy: reason,
        });

        span.end({
          metadata: {
            dealsReturned: transformedDeals.length,
            contextKey,
            refreshReason: reason,
          },
        });
        spanClosed = true;
        return transformedDeals;
      } catch (error) {
        console.error('Error fetching deals:', error);
        span.end({ success: false, error });
        spanClosed = true;
        throw error;
      } finally {
        if (!spanClosed) {
          span.end({
            metadata: {
              dealsReturned: transformedDeals.length,
              contextKey,
              refreshReason: reason,
            },
          });
        }
        this.inflightFetches.delete(contextKey);
      }
    })();

    this.inflightFetches.set(contextKey, refreshPromise);
    return refreshPromise;
  }

  private refreshInBackground(
    contextKey: string,
    coordinates: Coordinates | undefined,
    reason: RefreshReason,
  ): void {
    if (this.inflightFetches.has(contextKey)) {
      return;
    }

    void this.refreshContext(contextKey, coordinates, reason).catch((error) => {
      console.error('Background deal refresh failed:', error);
    });
  }

  async loadFromCache(customCoordinates?: Coordinates): Promise<Deal[]> {
    const { contextKey } = this.setActiveContext(customCoordinates);
    const cache = await this.getContextCache(contextKey);
    return cache.deals;
  }

  async isCacheStale(customCoordinates?: Coordinates): Promise<boolean> {
    const { contextKey } = this.setActiveContext(customCoordinates);
    const cache = await this.getContextCache(contextKey);
    return this.isTimestampStale(cache.timestamp);
  }

  async fetchAndCache(force = false, customCoordinates?: Coordinates): Promise<Deal[]> {
    const { contextKey, coordinates } = this.setActiveContext(customCoordinates);
    const reason: RefreshReason = force ? 'manual' : 'miss';
    return this.refreshContext(contextKey, coordinates, reason);
  }

  async getDeals(forceRefresh = false, customCoordinates?: Coordinates): Promise<Deal[]> {
    const { contextKey, coordinates } = this.setActiveContext(customCoordinates);

    if (forceRefresh) {
      recordCacheAccess(CACHE_METRIC_NAME, {
        hit: false,
        stale: false,
        source: 'force_refresh',
      });
      return this.refreshContext(contextKey, coordinates, 'manual');
    }

    const cache = await this.getContextCache(contextKey);
    if (cache.deals.length > 0) {
      const stale = this.isTimestampStale(cache.timestamp);
      recordCacheAccess(CACHE_METRIC_NAME, {
        hit: true,
        stale,
        source: cache.source,
      });

      if (stale) {
        this.refreshInBackground(contextKey, coordinates, 'stale');
      }
      return cache.deals;
    }

    recordCacheAccess(CACHE_METRIC_NAME, {
      hit: false,
      stale: false,
      source: 'none',
    });

    return this.refreshContext(contextKey, coordinates, 'miss');
  }

  getCachedDeals(customCoordinates?: Coordinates): Deal[] {
    const coordinates = normalizeCoordinates(customCoordinates);
    const contextKey = customCoordinates
      ? contextKeyForCoordinates(coordinates)
      : this.activeContextKey;
    return [...(this.dealsByContext.get(contextKey) ?? [])];
  }

  async initializeRealtime(customCoordinates?: Coordinates): Promise<void> {
    this.setActiveContext(customCoordinates);
    if (this.isInitialized) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    this.realtimeChannel = supabase
      .channel('deal-cache-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deal_instance' },
        () => this.scheduleRefresh('realtime'),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deal_instance' },
        () => this.scheduleRefresh('realtime'),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'deal_instance' },
        () => this.scheduleRefresh('realtime'),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deal_images' },
        () => this.scheduleRefresh('realtime'),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deal_images' },
        () => this.scheduleRefresh('realtime'),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'deal_images' },
        () => this.scheduleRefresh('realtime'),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isInitialized = true;
        }
      });
  }

  private scheduleRefresh(reason: RefreshReason = 'realtime'): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    const contextKey = this.activeContextKey;
    const coordinates = this.contextCoordinates.get(contextKey);

    this.refreshTimeout = setTimeout(() => {
      this.refreshInBackground(contextKey, coordinates, reason);
    }, 2000);
  }

  subscribe(callback: (deals: Deal[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  updateDealInCache(dealId: string, updates: Partial<Deal>): void {
    const contextKey = this.activeContextKey;
    const currentDeals = this.dealsByContext.get(contextKey) ?? [];
    const nextDeals = currentDeals.map((deal) => (deal.id === dealId ? { ...deal, ...updates } : deal));

    this.dealsByContext.set(contextKey, nextDeals);
    this.timestampsByContext.set(contextKey, Date.now());
    this.notifySubscribers(contextKey);

    const timestamp = this.timestampsByContext.get(contextKey) ?? Date.now();
    void this.persistContextCache(contextKey, nextDeals, timestamp).catch((error) => {
      console.error('Error updating cache:', error);
    });
  }

  async invalidateAndRefresh(): Promise<Deal[]> {
    const contextKey = this.activeContextKey;
    const coordinates = this.contextCoordinates.get(contextKey);
    await this.clearCacheDataOnly();
    return this.refreshContext(contextKey, coordinates, 'manual');
  }

  removeDealFromCache(dealId: string): void {
    const contextKey = this.activeContextKey;
    const currentDeals = this.dealsByContext.get(contextKey) ?? [];
    const nextDeals = currentDeals.filter((deal) => deal.id !== dealId);

    this.dealsByContext.set(contextKey, nextDeals);
    this.timestampsByContext.set(contextKey, Date.now());
    this.notifySubscribers(contextKey);

    const timestamp = this.timestampsByContext.get(contextKey) ?? Date.now();
    void this.persistContextCache(contextKey, nextDeals, timestamp).catch((error) => {
      console.error('Error updating cache:', error);
    });
  }

  private async clearCacheDataOnly(): Promise<void> {
    const keysToRemove = new Set<string>([LEGACY_CACHE_KEY, LEGACY_CACHE_TIMESTAMP_KEY]);
    this.knownContextKeys.forEach((contextKey) => {
      const keys = storageKeysForContext(contextKey);
      keysToRemove.add(keys.deals);
      keysToRemove.add(keys.timestamp);
    });

    this.dealsByContext.clear();
    this.timestampsByContext.clear();
    this.inflightFetches.clear();
    this.contextCoordinates.clear();
    this.contextCoordinates.set(DEFAULT_CONTEXT_KEY, undefined);
    this.knownContextKeys.clear();
    this.knownContextKeys.add(DEFAULT_CONTEXT_KEY);
    this.activeContextKey = DEFAULT_CONTEXT_KEY;

    await AsyncStorage.multiRemove(Array.from(keysToRemove));
  }

  cleanup(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    this.subscribers.clear();
    this.isInitialized = false;
  }

  async clearCache(): Promise<void> {
    this.cleanup();
    await this.clearCacheDataOnly();
  }
}

export const dealCacheService = new DealCacheService();
