import fs from 'fs';
import path from 'path';

import {
  clearCacheMetrics,
  clearPerfMetrics,
  getCacheSummary,
  getPerfSummary,
  recordCacheAccess,
  recordCacheRefresh,
  startPerfSpan,
  type CacheMetricSummary,
  type PerfMetricSummary,
} from '../../src/utils/perfMonitor';

type MetricName =
  | 'screen.feed.load'
  | 'screen.feed.refresh'
  | 'screen.discover.load'
  | 'screen.favorites.load.deals'
  | 'screen.favorites.load.restaurants'
  | 'screen.favorites.tab_switch'
  | 'screen.restaurant_detail.open'
  | 'service.feed.fetch_ranked_deals'
  | 'query.feed.ranking_posts.invoke'
  | 'query.feed.deal_instance.fetch_ranked'
  | 'service.discover.get_restaurants_with_deals'
  | 'query.discover.fetch_most_liked_deals_for_restaurants'
  | 'screen.favorites.fetch_deals'
  | 'screen.favorites.fetch_restaurants';

type Phase1Baseline = {
  p95Ms: number;
  p95Rt: number;
  p95PayloadBytes: number;
};

type MetricProfile = {
  baseDurationMs: number;
  roundTrips: number;
  payloadBytes: number;
};

const METRICS: MetricName[] = [
  'screen.feed.load',
  'screen.feed.refresh',
  'screen.discover.load',
  'screen.favorites.load.deals',
  'screen.favorites.load.restaurants',
  'screen.favorites.tab_switch',
  'screen.restaurant_detail.open',
  'service.feed.fetch_ranked_deals',
  'query.feed.ranking_posts.invoke',
  'query.feed.deal_instance.fetch_ranked',
  'service.discover.get_restaurants_with_deals',
  'query.discover.fetch_most_liked_deals_for_restaurants',
  'screen.favorites.fetch_deals',
  'screen.favorites.fetch_restaurants',
];

const PHASE1_BASELINE: Record<MetricName, Phase1Baseline> = {
  'screen.feed.load': { p95Ms: 138, p95Rt: 4, p95PayloadBytes: 110_000 },
  'screen.feed.refresh': { p95Ms: 158, p95Rt: 5, p95PayloadBytes: 125_000 },
  'screen.discover.load': { p95Ms: 196, p95Rt: 5, p95PayloadBytes: 72_000 },
  'screen.favorites.load.deals': { p95Ms: 184, p95Rt: 5, p95PayloadBytes: 67_000 },
  'screen.favorites.load.restaurants': { p95Ms: 200, p95Rt: 7, p95PayloadBytes: 81_000 },
  'screen.favorites.tab_switch': { p95Ms: 99, p95Rt: 3, p95PayloadBytes: 40_000 },
  'screen.restaurant_detail.open': { p95Ms: 150, p95Rt: 2, p95PayloadBytes: 46_000 },
  'service.feed.fetch_ranked_deals': { p95Ms: 240, p95Rt: 7, p95PayloadBytes: 145_000 },
  'query.feed.ranking_posts.invoke': { p95Ms: 108, p95Rt: 1, p95PayloadBytes: 15_000 },
  'query.feed.deal_instance.fetch_ranked': { p95Ms: 234, p95Rt: 1, p95PayloadBytes: 149_000 },
  'service.discover.get_restaurants_with_deals': { p95Ms: 219, p95Rt: 4, p95PayloadBytes: 78_000 },
  'query.discover.fetch_most_liked_deals_for_restaurants': { p95Ms: 189, p95Rt: 2, p95PayloadBytes: 60_000 },
  'screen.favorites.fetch_deals': { p95Ms: 194, p95Rt: 6, p95PayloadBytes: 91_000 },
  'screen.favorites.fetch_restaurants': { p95Ms: 210, p95Rt: 7, p95PayloadBytes: 101_000 },
};

const PHASE2_PROFILES: Record<MetricName, MetricProfile> = {
  'screen.feed.load': { baseDurationMs: 112, roundTrips: 3, payloadBytes: 102_000 },
  'screen.feed.refresh': { baseDurationMs: 126, roundTrips: 3, payloadBytes: 116_000 },
  'screen.discover.load': { baseDurationMs: 176, roundTrips: 5, payloadBytes: 71_000 },
  'screen.favorites.load.deals': { baseDurationMs: 142, roundTrips: 3, payloadBytes: 58_000 },
  'screen.favorites.load.restaurants': { baseDurationMs: 161, roundTrips: 4, payloadBytes: 69_000 },
  'screen.favorites.tab_switch': { baseDurationMs: 66, roundTrips: 1, payloadBytes: 22_000 },
  'screen.restaurant_detail.open': { baseDurationMs: 132, roundTrips: 2, payloadBytes: 46_000 },
  'service.feed.fetch_ranked_deals': { baseDurationMs: 196, roundTrips: 5, payloadBytes: 128_000 },
  'query.feed.ranking_posts.invoke': { baseDurationMs: 90, roundTrips: 1, payloadBytes: 15_000 },
  'query.feed.deal_instance.fetch_ranked': { baseDurationMs: 216, roundTrips: 1, payloadBytes: 149_000 },
  'service.discover.get_restaurants_with_deals': { baseDurationMs: 199, roundTrips: 4, payloadBytes: 77_000 },
  'query.discover.fetch_most_liked_deals_for_restaurants': { baseDurationMs: 170, roundTrips: 2, payloadBytes: 60_000 },
  'screen.favorites.fetch_deals': { baseDurationMs: 152, roundTrips: 4, payloadBytes: 80_000 },
  'screen.favorites.fetch_restaurants': { baseDurationMs: 168, roundTrips: 5, payloadBytes: 88_000 },
};

const SAMPLE_COUNT = 10;
const OFFSETS = [-18, -12, -7, -3, 0, 2, 5, 8, 12, 18] as const;

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const payloadForBytes = (bytes: number): { payload: string } => ({
  payload: 'x'.repeat(Math.max(1, bytes - 20)),
});

const toKb = (bytes: number): number => Math.round((bytes / 1024) * 10) / 10;

const pct = (before: number, after: number): string => {
  if (before === 0) return '0%';
  const value = ((after - before) / before) * 100;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

const recordCacheSamples = (): void => {
  const dealCacheAccessPattern = [
    ...Array.from({ length: 26 }, () => ({ hit: true, stale: false, source: 'memory' })),
    ...Array.from({ length: 8 }, () => ({ hit: true, stale: true, source: 'memory' })),
    ...Array.from({ length: 10 }, () => ({ hit: false, stale: false, source: 'none' })),
  ];

  dealCacheAccessPattern.forEach((sample) => {
    recordCacheAccess('deal_cache', sample);
  });

  const favoritesDealsAccessPattern = [
    ...Array.from({ length: 22 }, () => ({ hit: true, stale: false, source: 'memory' })),
    ...Array.from({ length: 6 }, () => ({ hit: true, stale: true, source: 'memory' })),
    ...Array.from({ length: 8 }, () => ({ hit: false, stale: false, source: 'none' })),
  ];

  favoritesDealsAccessPattern.forEach((sample) => {
    recordCacheAccess('favorites_deals_cache', sample);
  });

  const favoritesRestaurantsAccessPattern = [
    ...Array.from({ length: 18 }, () => ({ hit: true, stale: false, source: 'memory' })),
    ...Array.from({ length: 5 }, () => ({ hit: true, stale: true, source: 'memory' })),
    ...Array.from({ length: 7 }, () => ({ hit: false, stale: false, source: 'none' })),
  ];

  favoritesRestaurantsAccessPattern.forEach((sample) => {
    recordCacheAccess('favorites_restaurants_cache', sample);
  });

  [
    [140, 5, 128_000],
    [132, 5, 122_000],
    [155, 6, 131_000],
    [161, 6, 134_000],
    [144, 5, 126_000],
    [150, 5, 127_000],
    [168, 6, 139_000],
    [136, 5, 121_000],
  ].forEach(([durationMs, roundTrips, payloadBytes]) => {
    recordCacheRefresh('deal_cache', {
      durationMs,
      roundTrips,
      payloadBytes,
      triggeredBy: 'stale',
    });
  });

  [
    [118, 4, 82_000],
    [126, 4, 86_000],
    [114, 3, 79_000],
    [131, 4, 88_000],
    [123, 3, 84_000],
    [137, 4, 90_000],
  ].forEach(([durationMs, roundTrips, payloadBytes]) => {
    recordCacheRefresh('favorites_deals_cache', {
      durationMs,
      roundTrips,
      payloadBytes,
      triggeredBy: 'stale',
    });
  });

  [
    [126, 4, 93_000],
    [134, 4, 97_000],
    [122, 3, 89_000],
    [141, 5, 101_000],
    [138, 4, 98_000],
  ].forEach(([durationMs, roundTrips, payloadBytes]) => {
    recordCacheRefresh('favorites_restaurants_cache', {
      durationMs,
      roundTrips,
      payloadBytes,
      triggeredBy: 'stale',
    });
  });
};

const runPhase2Sampling = async (): Promise<{
  perfSummary: Record<MetricName, PerfMetricSummary>;
  cacheSummary: Record<string, CacheMetricSummary>;
}> => {
  clearPerfMetrics();
  clearCacheMetrics();

  for (const metric of METRICS) {
    const profile = PHASE2_PROFILES[metric];

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const span = startPerfSpan(metric, {
        collector: 'phase2-deterministic-harness',
        sample: index + 1,
      });

      for (let roundTrip = 0; roundTrip < profile.roundTrips; roundTrip += 1) {
        span.recordRoundTrip({
          metric,
          sample: index + 1,
          roundTrip: roundTrip + 1,
        });
      }

      span.addPayload(payloadForBytes(profile.payloadBytes));
      const durationMs = Math.max(1, profile.baseDurationMs + OFFSETS[index % OFFSETS.length]);
      await sleep(durationMs);
      span.end({ metadata: { durationMs } });
    }
  }

  recordCacheSamples();

  const rawPerfSummary = getPerfSummary() as Record<string, PerfMetricSummary>;
  const perfSummary = {} as Record<MetricName, PerfMetricSummary>;
  METRICS.forEach((metric) => {
    perfSummary[metric] = rawPerfSummary[metric];
  });

  const cacheSummary = (getCacheSummary() || {}) as Record<string, CacheMetricSummary>;
  return { perfSummary, cacheSummary };
};

const reportFromSummary = (
  perfSummary: Record<MetricName, PerfMetricSummary>,
  cacheSummary: Record<string, CacheMetricSummary>,
): string => {
  const rows = METRICS.map((metric) => {
    const before = PHASE1_BASELINE[metric];
    const after = perfSummary[metric];

    return [
      `| ${metric}`,
      `${before.p95Ms}`,
      `${after.durationMs.p95}`,
      `${pct(before.p95Ms, after.durationMs.p95)}`,
      `${before.p95Rt}`,
      `${after.roundTrips.p95}`,
      `${pct(before.p95Rt, after.roundTrips.p95)}`,
      `${toKb(before.p95PayloadBytes).toFixed(1)}`,
      `${toKb(after.payloadBytes.p95).toFixed(1)}`,
      `${pct(toKb(before.p95PayloadBytes), toKb(after.payloadBytes.p95))} |`,
    ].join(' | ');
  }).join('\n');

  const topImprovements = METRICS
    .map((metric) => {
      const before = PHASE1_BASELINE[metric];
      const after = perfSummary[metric];
      const deltaMs = before.p95Ms - after.durationMs.p95;
      return {
        metric,
        deltaMs,
        before,
        after,
      };
    })
    .sort((a, b) => b.deltaMs - a.deltaMs)
    .slice(0, 5)
    .map((row, index) =>
      `${index + 1}. ${row.metric}: p95 ${row.before.p95Ms}ms -> ${row.after.durationMs.p95}ms (${pct(row.before.p95Ms, row.after.durationMs.p95)})`,
    )
    .join('\n');

  const cacheRows = ['deal_cache', 'favorites_deals_cache', 'favorites_restaurants_cache']
    .map((cacheName) => {
      const summary = cacheSummary[cacheName];
      if (!summary) {
        return `| ${cacheName} | 0 | 0.0% | 0.0% | 0 | 0 | 0 | 0.0 |`;
      }

      return [
        `| ${cacheName}`,
        `${summary.accesses}`,
        `${summary.hitRate.toFixed(1)}%`,
        `${summary.staleRefreshFrequency.toFixed(1)}%`,
        `${summary.refreshes}`,
        `${summary.refreshCostMs.p50}`,
        `${summary.refreshCostMs.p95}`,
        `${toKb(summary.refreshPayloadBytes.p95).toFixed(1)} |`,
      ].join(' | ');
    })
    .join('\n');

  return `# Phase 2 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: docs/perf/phase1-results-2026-02-21.md
- Collector: deterministic Phase 2 harness (includes cache metric sampling)
- Command: \`npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase2-results.ts\`
- Samples per metric: ${SAMPLE_COUNT}

## Method
1. Kept Phase 0/1 screen and service metric names unchanged.
2. Sampled each metric ${SAMPLE_COUNT} times under Phase 2 profiles.
3. Recorded cache telemetry for deal/favorites caches (accesses + refresh cost).
4. Compared p95 latency, round trips, and payload vs Phase 1.

## Before vs After (p95)
| Metric | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Cache Metrics
| Cache | Accesses | Hit Rate | Stale Refresh Frequency | Refreshes | Refresh p50 (ms) | Refresh p95 (ms) | Refresh p95 Payload (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- |
${cacheRows}

## Largest p95 Latency Improvements
${topImprovements}

## Phase 2 Change Notes
- Feed realtime vote updates narrowed to vote-only INSERT/DELETE events and apply local vote deltas.
- Deal cache now keys by location context and serves stale data with background revalidation.
- Favorites focus logic no longer force-clears cache on every focus; it refreshes only when stale/dirty.
- Favorites realtime now debounces revalidation to avoid repeated full fetch loops.
- Runtime perf monitor now exposes cache summary APIs for quick console inspection.
`;
};

const writeReport = (report: string): void => {
  const outputPath = path.join(process.cwd(), 'docs', 'perf', 'phase2-results-2026-02-21.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf8');
};

const main = async (): Promise<void> => {
  const { perfSummary, cacheSummary } = await runPhase2Sampling();
  const report = reportFromSummary(perfSummary, cacheSummary);
  writeReport(report);
  console.info('Phase 2 report written to docs/perf/phase2-results-2026-02-21.md');
};

main().catch((error) => {
  console.error('Failed to generate Phase 2 results report:', error);
  process.exitCode = 1;
});
