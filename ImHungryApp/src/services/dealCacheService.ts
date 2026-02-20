import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';
import type { Deal } from '../types/deal';
import { logger } from '../utils/logger';

import { fetchRankedDeals, transformDealForUI, addDistancesToDeals, addVotesToDeals } from './dealService';


const CACHE_KEY = 'cached_deals';
const CACHE_TIMESTAMP_KEY = 'cached_deals_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class DealCacheService {
  private realtimeChannel: RealtimeChannel | null = null;
  private subscribers: Set<(deals: Deal[]) => void> = new Set();
  private cachedDeals: Deal[] = [];
  private isInitialized = false;
  private isFetching = false;
  private refreshTimeout: NodeJS.Timeout | null = null;

  // Load deals from AsyncStorage cache
  async loadFromCache(): Promise<Deal[]> {
    try {
      const dealsJson = await AsyncStorage.getItem(CACHE_KEY);
      if (dealsJson) {
        const deals = JSON.parse(dealsJson) as Deal[];
        this.cachedDeals = deals;
        logger.info(`📦 Loaded ${deals.length} deals from cache`);
        return deals;
      }
    } catch (error) {
      logger.error('Error loading deals from cache:', error);
    }
    return [];
  }

  // Check if cache is stale
  async isCacheStale(): Promise<boolean> {
    try {
      const timestampJson = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestampJson) return true;
      
      const timestamp = new Date(JSON.parse(timestampJson));
      const cacheAge = Date.now() - timestamp.getTime();
      return cacheAge > CACHE_DURATION;
    } catch (error) {
      return true;
    }
  }

  // Fetch fresh deals and cache them
  async fetchAndCache(force = false, customCoordinates?: { lat: number; lng: number }): Promise<Deal[]> {
    // Prevent multiple simultaneous fetches
    if (this.isFetching && !force) {
      return this.cachedDeals;
    }

    // Check if we need to fetch (unless forced)
    if (!force && !await this.isCacheStale()) {
      logger.info('✅ Cache is fresh, using cached deals');
      return this.cachedDeals;
    }

    this.isFetching = true;
    
    try {
      logger.info('🔄 Fetching fresh deals...');
      const fetchStart = Date.now();
      const dbDeals = await fetchRankedDeals();
      const fetchTime = Date.now() - fetchStart;
      logger.info(`📊 Fetched ${dbDeals.length} deals in ${fetchTime}ms`);
      
      // ⚡ OPTIMIZATION: Only recompute distances when the caller overrides coordinates
      logger.info('⚡ Adding vote information (and custom distance overrides when requested)...');
      const enrichStart = Date.now();
      const baseDeals = customCoordinates
        ? await addDistancesToDeals(dbDeals, customCoordinates)
        : dbDeals;
      const enrichedDeals = await addVotesToDeals(baseDeals);
      const enrichTime = Date.now() - enrichStart;
      logger.info(`✅ Enrichment completed in ${enrichTime}ms`);
      
      // Log some vote states for debugging
      const voteSample = enrichedDeals.slice(0, 3).map(deal => ({
        id: deal.deal_id,
        title: deal.title.substring(0, 30),
        votes: deal.votes,
        isUpvoted: deal.is_upvoted,
        isDownvoted: deal.is_downvoted,
        isFavorited: deal.is_favorited
      }));
      logger.info('🔍 Vote sample:', voteSample);
      
      const transformedDeals = enrichedDeals.map(transformDealForUI);
      
      this.cachedDeals = transformedDeals;
      
      // Cache the data
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(transformedDeals)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, JSON.stringify(new Date().toISOString()))
      ]);
      
      logger.info(`✅ Fetched and cached ${transformedDeals.length} deals with votes and distances`);
      
      // Notify all subscribers
      this.notifySubscribers(transformedDeals);
      
      return transformedDeals;
    } catch (error) {
      logger.error('Error fetching deals:', error);
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  // Get deals (from cache or fetch)
  async getDeals(forceRefresh = false, customCoordinates?: { lat: number; lng: number }): Promise<Deal[]> {
    // If forced refresh OR custom coordinates provided, fetch immediately to recalculate distances
    if (forceRefresh || customCoordinates) {
      return this.fetchAndCache(true, customCoordinates);
    }

    // If we have cached deals and cache is fresh, return them
    if (this.cachedDeals.length > 0 && !await this.isCacheStale()) {
      return this.cachedDeals;
    }

    // Try loading from AsyncStorage first
    const cachedDeals = await this.loadFromCache();
    if (cachedDeals.length > 0 && !await this.isCacheStale()) {
      return cachedDeals;
    }

    // Otherwise fetch fresh data
    return this.fetchAndCache(false, customCoordinates);
  }

  // Get cached deals synchronously (for focus sync without async)
  getCachedDeals(): Deal[] {
    return this.cachedDeals;
  }

  // Initialize realtime subscriptions
  async initializeRealtime() {
    if (this.isInitialized) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Subscribe to deal_instance changes
    this.realtimeChannel = supabase
      .channel('deal-cache-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deal_instance',
        },
        () => {
          logger.info('⚡ Deal change detected, scheduling refresh...');
          this.scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deal_images',
        },
        () => {
          logger.info('⚡ Deal images change detected, scheduling refresh...');
          this.scheduleRefresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('📡 Deal cache realtime: SUBSCRIBED');
          this.isInitialized = true;
        }
      });
  }

  // Debounced refresh to prevent spam
  private scheduleRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.refreshTimeout = setTimeout(async () => {
      logger.info('⏰ Executing scheduled refresh');
      await this.fetchAndCache(true);
    }, 2000); // 2 second debounce
  }

  // Subscribe to cache updates
  subscribe(callback: (deals: Deal[]) => void) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers of new data
  private notifySubscribers(deals: Deal[]) {
    this.subscribers.forEach(callback => callback(deals));
  }

  // Update a single deal in cache (for optimistic updates)
  updateDealInCache(dealId: string, updates: Partial<Deal>) {
    this.cachedDeals = this.cachedDeals.map(deal => 
      deal.id === dealId ? { ...deal, ...updates } : deal
    );
    
    // Update AsyncStorage
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cachedDeals)).catch(err => {
      logger.error('Error updating cache:', err);
    });
    
    // Notify subscribers
    this.notifySubscribers(this.cachedDeals);
  }

  // Invalidate cache and force a fresh fetch (call after deal modifications)
  async invalidateAndRefresh() {
    logger.info('🔄 Invalidating cache and forcing refresh...');
    // Clear ALL cache data to ensure no stale data
    this.cachedDeals = [];
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    // Reset fetching flag in case it's stuck
    this.isFetching = false;
    // Fetch fresh data
    const freshDeals = await this.fetchAndCache(true);
    logger.info(`✅ Cache refreshed with ${freshDeals.length} deals`);
    return freshDeals;
  }

  // Remove a specific deal from cache
  removeDealFromCache(dealId: string) {
    this.cachedDeals = this.cachedDeals.filter(deal => deal.id !== dealId);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cachedDeals)).catch(err => {
      logger.error('Error updating cache:', err);
    });
    this.notifySubscribers(this.cachedDeals);
  }

  // Cleanup
  cleanup() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.subscribers.clear();
    this.isInitialized = false;
  }

  // Clear cache (useful for logout)
  async clearCache() {
    this.cachedDeals = [];
    this.cleanup();
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEY),
      AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY)
    ]);
    logger.info('🗑️ Deal cache cleared');
  }
}

// Export singleton instance
export const dealCacheService = new DealCacheService();
