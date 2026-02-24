/**
 * Lightweight runtime performance monitor for screen/service instrumentation.
 * Stores per-metric samples and exposes p50/p95 summaries.
 */

export type PerfMetadata = Record<string, unknown>;

export interface PerfSample {
  name: string;
  durationMs: number;
  roundTrips: number;
  payloadBytes: number;
  success: boolean;
  startedAt: string;
  endedAt: string;
  metadata?: PerfMetadata;
}

export interface PerfDistributionSummary {
  p50: number;
  p95: number;
  average: number;
  min: number;
  max: number;
  total: number;
}

export interface PerfMetricSummary {
  name: string;
  samples: number;
  successRate: number;
  durationMs: PerfDistributionSummary;
  roundTrips: PerfDistributionSummary;
  payloadBytes: PerfDistributionSummary;
}

export interface CacheAccessSample {
  cacheName: string;
  hit: boolean;
  stale: boolean;
  source?: string;
  timestamp: string;
}

export type CacheRefreshTrigger = 'miss' | 'stale' | 'manual' | 'realtime' | 'unknown';

export interface CacheRefreshSample {
  cacheName: string;
  durationMs: number;
  roundTrips: number;
  payloadBytes: number;
  triggeredBy: CacheRefreshTrigger;
  timestamp: string;
}

export interface CacheMetricSummary {
  cacheName: string;
  accesses: number;
  hits: number;
  misses: number;
  staleHits: number;
  hitRate: number;
  staleRefreshFrequency: number;
  refreshes: number;
  refreshCostMs: PerfDistributionSummary;
  refreshRoundTrips: PerfDistributionSummary;
  refreshPayloadBytes: PerfDistributionSummary;
}

export interface PerfSpan {
  readonly name: string;
  recordRoundTrip: (payload?: unknown, count?: number) => void;
  addPayload: (payload?: unknown) => void;
  end: (options?: PerfSpanEndOptions) => PerfSample;
}

export interface PerfSpanEndOptions {
  success?: boolean;
  metadata?: PerfMetadata;
  error?: unknown;
}

export interface PerfRoundTripOptions<T> {
  count?: number;
  request?: unknown;
  response?: (result: T) => unknown;
}

export interface CacheAccessOptions {
  hit: boolean;
  stale?: boolean;
  source?: string;
}

export interface CacheRefreshOptions {
  durationMs: number;
  roundTrips?: number;
  payloadBytes?: number;
  triggeredBy?: CacheRefreshTrigger;
}

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const round = (value: number): number => {
  if (!isFiniteNumber(value)) return 0;
  return Math.round(value * 100) / 100;
};

const percentile = (values: number[], percentileValue: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  );
  return round(sorted[index]);
};

const summarizeValues = (values: number[]): PerfDistributionSummary => {
  if (values.length === 0) {
    return {
      p50: 0,
      p95: 0,
      average: 0,
      min: 0,
      max: 0,
      total: 0,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    average: round(total / values.length),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
    total: round(total),
  };
};

const stringifyForBytes = (payload: unknown): string => {
  if (payload === null || payload === undefined) {
    return '';
  }
  if (typeof payload === 'string') {
    return payload;
  }
  if (
    typeof payload === 'number' ||
    typeof payload === 'boolean' ||
    typeof payload === 'bigint'
  ) {
    return String(payload);
  }

  try {
    return JSON.stringify(payload) ?? '';
  } catch {
    return String(payload);
  }
};

export const estimatePayloadBytes = (payload: unknown): number => {
  const serialized = stringifyForBytes(payload);
  if (!serialized) return 0;

  if (typeof Buffer !== 'undefined' && typeof Buffer.byteLength === 'function') {
    return Buffer.byteLength(serialized, 'utf8');
  }

  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(serialized).length;
  }

  return serialized.length;
};

class PerfSpanImpl implements PerfSpan {
  public readonly name: string;
  private readonly monitor: PerfMonitor;
  private readonly startMs: number;
  private readonly metadata?: PerfMetadata;
  private roundTrips = 0;
  private payloadBytes = 0;
  private ended = false;

  constructor(name: string, monitor: PerfMonitor, metadata?: PerfMetadata) {
    this.name = name;
    this.monitor = monitor;
    this.metadata = metadata;
    this.startMs = Date.now();
  }

  recordRoundTrip(payload?: unknown, count = 1): void {
    const safeCount = Math.max(0, Math.floor(count));
    if (safeCount <= 0) return;
    this.roundTrips += safeCount;
    if (payload !== undefined) {
      this.payloadBytes += estimatePayloadBytes(payload);
    }
  }

  addPayload(payload?: unknown): void {
    if (payload === undefined) return;
    this.payloadBytes += estimatePayloadBytes(payload);
  }

  end(options?: PerfSpanEndOptions): PerfSample {
    if (this.ended) {
      throw new Error(`Perf span "${this.name}" already ended`);
    }
    this.ended = true;

    const endMs = Date.now();
    const errorMetadata = options?.error
      ? {
          error:
            options.error instanceof Error
              ? options.error.message
              : String(options.error),
        }
      : undefined;

    const metadata =
      this.metadata || options?.metadata || errorMetadata
        ? {
            ...(this.metadata || {}),
            ...(options?.metadata || {}),
            ...(errorMetadata || {}),
          }
        : undefined;

    const sample: PerfSample = {
      name: this.name,
      durationMs: Math.max(0, endMs - this.startMs),
      roundTrips: this.roundTrips,
      payloadBytes: this.payloadBytes,
      success: options?.success ?? !options?.error,
      startedAt: new Date(this.startMs).toISOString(),
      endedAt: new Date(endMs).toISOString(),
      metadata,
    };

    this.monitor.addSample(sample);
    return sample;
  }
}

class PerfMonitor {
  private readonly samplesByMetric = new Map<string, PerfSample[]>();
  private readonly cacheAccessByName = new Map<string, CacheAccessSample[]>();
  private readonly cacheRefreshByName = new Map<string, CacheRefreshSample[]>();

  startSpan(name: string, metadata?: PerfMetadata): PerfSpan {
    return new PerfSpanImpl(name, this, metadata);
  }

  addSample(sample: PerfSample): void {
    const current = this.samplesByMetric.get(sample.name) ?? [];
    current.push(sample);
    this.samplesByMetric.set(sample.name, current);
  }

  getSamples(name?: string): PerfSample[] {
    if (name) {
      return [...(this.samplesByMetric.get(name) ?? [])];
    }
    return Array.from(this.samplesByMetric.values()).flatMap((samples) => [...samples]);
  }

  clear(name?: string): void {
    if (name) {
      this.samplesByMetric.delete(name);
      return;
    }
    this.samplesByMetric.clear();
  }

  clearCacheMetrics(cacheName?: string): void {
    if (cacheName) {
      this.cacheAccessByName.delete(cacheName);
      this.cacheRefreshByName.delete(cacheName);
      return;
    }

    this.cacheAccessByName.clear();
    this.cacheRefreshByName.clear();
  }

  reset(): void {
    this.clear();
    this.clearCacheMetrics();
  }

  getSummary(name?: string): PerfMetricSummary | Record<string, PerfMetricSummary> | null {
    if (name) {
      const summary = this.summarizeMetric(name);
      return summary;
    }

    const result: Record<string, PerfMetricSummary> = {};
    this.samplesByMetric.forEach((_samples, metricName) => {
      const summary = this.summarizeMetric(metricName);
      if (summary) {
        result[metricName] = summary;
      }
    });

    return result;
  }

  printSummary(name?: string): void {
    const summary = this.getSummary(name);
    if (!summary || (typeof summary === 'object' && Object.keys(summary).length === 0)) {
      console.info('[perf] No samples recorded.');
      return;
    }
    console.info('[perf] Summary:', summary);
  }

  recordCacheAccess(cacheName: string, options: CacheAccessOptions): void {
    const current = this.cacheAccessByName.get(cacheName) ?? [];
    current.push({
      cacheName,
      hit: options.hit,
      stale: options.stale ?? false,
      source: options.source,
      timestamp: new Date().toISOString(),
    });
    this.cacheAccessByName.set(cacheName, current);
  }

  recordCacheRefresh(cacheName: string, options: CacheRefreshOptions): void {
    const current = this.cacheRefreshByName.get(cacheName) ?? [];
    current.push({
      cacheName,
      durationMs: Math.max(0, round(options.durationMs)),
      roundTrips: Math.max(0, Math.floor(options.roundTrips ?? 0)),
      payloadBytes: Math.max(0, Math.floor(options.payloadBytes ?? 0)),
      triggeredBy: options.triggeredBy ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
    this.cacheRefreshByName.set(cacheName, current);
  }

  getCacheSummary(cacheName?: string): CacheMetricSummary | Record<string, CacheMetricSummary> | null {
    if (cacheName) {
      return this.summarizeCache(cacheName);
    }

    const names = new Set<string>([
      ...this.cacheAccessByName.keys(),
      ...this.cacheRefreshByName.keys(),
    ]);

    const result: Record<string, CacheMetricSummary> = {};
    names.forEach((name) => {
      const summary = this.summarizeCache(name);
      if (summary) {
        result[name] = summary;
      }
    });

    return result;
  }

  printCacheSummary(cacheName?: string): void {
    const summary = this.getCacheSummary(cacheName);
    if (!summary || (typeof summary === 'object' && Object.keys(summary).length === 0)) {
      console.info('[perf] No cache samples recorded.');
      return;
    }
    console.info('[perf] Cache Summary:', summary);
  }

  private summarizeMetric(name: string): PerfMetricSummary | null {
    const samples = this.samplesByMetric.get(name) ?? [];
    if (samples.length === 0) return null;

    const successes = samples.filter((sample) => sample.success).length;
    return {
      name,
      samples: samples.length,
      successRate: round((successes / samples.length) * 100),
      durationMs: summarizeValues(samples.map((sample) => sample.durationMs)),
      roundTrips: summarizeValues(samples.map((sample) => sample.roundTrips)),
      payloadBytes: summarizeValues(samples.map((sample) => sample.payloadBytes)),
    };
  }

  private summarizeCache(cacheName: string): CacheMetricSummary | null {
    const accesses = this.cacheAccessByName.get(cacheName) ?? [];
    const refreshes = this.cacheRefreshByName.get(cacheName) ?? [];

    if (accesses.length === 0 && refreshes.length === 0) {
      return null;
    }

    const hits = accesses.filter((sample) => sample.hit).length;
    const misses = accesses.length - hits;
    const staleHits = accesses.filter((sample) => sample.hit && sample.stale).length;

    return {
      cacheName,
      accesses: accesses.length,
      hits,
      misses,
      staleHits,
      hitRate: accesses.length > 0 ? round((hits / accesses.length) * 100) : 0,
      staleRefreshFrequency: accesses.length > 0 ? round((staleHits / accesses.length) * 100) : 0,
      refreshes: refreshes.length,
      refreshCostMs: summarizeValues(refreshes.map((sample) => sample.durationMs)),
      refreshRoundTrips: summarizeValues(refreshes.map((sample) => sample.roundTrips)),
      refreshPayloadBytes: summarizeValues(refreshes.map((sample) => sample.payloadBytes)),
    };
  }
}

export const perfMonitor = new PerfMonitor();

export const startPerfSpan = (name: string, metadata?: PerfMetadata): PerfSpan =>
  perfMonitor.startSpan(name, metadata);

export const clearPerfMetrics = (name?: string): void => perfMonitor.clear(name);

export const resetPerfMetrics = (): void => perfMonitor.reset();

export const getPerfSamples = (name?: string): PerfSample[] => perfMonitor.getSamples(name);

export const getPerfSummary = (
  name?: string,
): PerfMetricSummary | Record<string, PerfMetricSummary> | null =>
  perfMonitor.getSummary(name);

export const printPerfSummary = (name?: string): void => perfMonitor.printSummary(name);

export const recordCacheAccess = (
  cacheName: string,
  options: CacheAccessOptions,
): void => perfMonitor.recordCacheAccess(cacheName, options);

export const recordCacheRefresh = (
  cacheName: string,
  options: CacheRefreshOptions,
): void => perfMonitor.recordCacheRefresh(cacheName, options);

export const getCacheSummary = (
  cacheName?: string,
): CacheMetricSummary | Record<string, CacheMetricSummary> | null =>
  perfMonitor.getCacheSummary(cacheName);

export const clearCacheMetrics = (cacheName?: string): void =>
  perfMonitor.clearCacheMetrics(cacheName);

export const printCacheSummary = (cacheName?: string): void =>
  perfMonitor.printCacheSummary(cacheName);

export const measureRoundTrip = async <T>(
  span: PerfSpan,
  operation: () => Promise<T>,
  options?: PerfRoundTripOptions<T>,
): Promise<T> => {
  const result = await operation();
  const payload = {
    request: options?.request,
    response: options?.response ? options.response(result) : result,
  };
  span.recordRoundTrip(payload, options?.count ?? 1);
  return result;
};

type PerfRuntimeApi = {
  startSpan: typeof startPerfSpan;
  clear: typeof clearPerfMetrics;
  reset: typeof resetPerfMetrics;
  getSamples: typeof getPerfSamples;
  getSummary: typeof getPerfSummary;
  printSummary: typeof printPerfSummary;
  recordCacheAccess: typeof recordCacheAccess;
  recordCacheRefresh: typeof recordCacheRefresh;
  clearCacheMetrics: typeof clearCacheMetrics;
  getCacheSummary: typeof getCacheSummary;
  printCacheSummary: typeof printCacheSummary;
  estimatePayloadBytes: typeof estimatePayloadBytes;
};

declare global {
  // eslint-disable-next-line no-var
  var __imhungryPerfMonitor: PerfRuntimeApi | undefined;
}

if (typeof globalThis !== 'undefined') {
  globalThis.__imhungryPerfMonitor = {
    startSpan: startPerfSpan,
    clear: clearPerfMetrics,
    reset: resetPerfMetrics,
    getSamples: getPerfSamples,
    getSummary: getPerfSummary,
    printSummary: printPerfSummary,
    recordCacheAccess,
    recordCacheRefresh,
    clearCacheMetrics,
    getCacheSummary,
    printCacheSummary,
    estimatePayloadBytes,
  };
}
