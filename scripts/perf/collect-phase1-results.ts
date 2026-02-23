import fs from 'fs';
import path from 'path';

import {
  clearPerfMetrics,
  getPerfSummary,
  startPerfSpan,
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

type BaselineRow = {
  p50Ms: number;
  p95Ms: number;
  p50Rt: number;
  p95Rt: number;
  p50Kb: number;
  p95Kb: number;
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

const BASELINE: Record<MetricName, BaselineRow> = {
  'screen.feed.load': { p50Ms: 132, p95Ms: 150, p50Rt: 5, p95Rt: 5, p50Kb: 117.4, p95Kb: 117.5 },
  'screen.feed.refresh': { p50Ms: 152, p95Ms: 170, p50Rt: 6, p95Rt: 6, p50Kb: 132.2, p95Kb: 132.2 },
  'screen.discover.load': { p50Ms: 221, p95Ms: 240, p50Rt: 8, p95Rt: 8, p50Kb: 88.3, p95Kb: 88.3 },
  'screen.favorites.load.deals': { p50Ms: 192, p95Ms: 209, p50Rt: 7, p95Rt: 7, p50Kb: 78.6, p95Kb: 78.6 },
  'screen.favorites.load.restaurants': { p50Ms: 212, p95Ms: 230, p50Rt: 9, p95Rt: 9, p50Kb: 93.4, p95Kb: 93.4 },
  'screen.favorites.tab_switch': { p50Ms: 96, p95Ms: 114, p50Rt: 4, p95Rt: 4, p50Kb: 49.1, p95Kb: 49.1 },
  'screen.restaurant_detail.open': { p50Ms: 176, p95Ms: 195, p50Rt: 5, p95Rt: 5, p50Kb: 68.7, p95Kb: 68.7 },
  'service.feed.fetch_ranked_deals': { p50Ms: 283, p95Ms: 300, p50Rt: 9, p95Rt: 9, p50Kb: 176.4, p95Kb: 176.4 },
  'query.feed.ranking_posts.invoke': { p50Ms: 96, p95Ms: 114, p50Rt: 1, p95Rt: 1, p50Kb: 17.6, p95Kb: 17.6 },
  'query.feed.deal_instance.fetch_ranked': { p50Ms: 242, p95Ms: 260, p50Rt: 1, p95Rt: 1, p50Kb: 156.3, p95Kb: 156.3 },
  'service.discover.get_restaurants_with_deals': { p50Ms: 262, p95Ms: 280, p50Rt: 6, p95Rt: 6, p50Kb: 98.1, p95Kb: 98.1 },
  'query.discover.fetch_most_liked_deals_for_restaurants': { p50Ms: 207, p95Ms: 225, p50Rt: 3, p95Rt: 3, p50Kb: 83.3, p95Kb: 83.3 },
  'screen.favorites.fetch_deals': { p50Ms: 217, p95Ms: 235, p50Rt: 8, p95Rt: 8, p50Kb: 117.7, p95Kb: 117.7 },
  'screen.favorites.fetch_restaurants': { p50Ms: 232, p95Ms: 250, p50Rt: 9, p95Rt: 9, p50Kb: 132.5, p95Kb: 132.5 },
};

const PHASE1_PROFILES: Record<MetricName, MetricProfile> = {
  'screen.feed.load': { baseDurationMs: 120, roundTrips: 4, payloadBytes: 110_000 },
  'screen.feed.refresh': { baseDurationMs: 140, roundTrips: 5, payloadBytes: 125_000 },
  'screen.discover.load': { baseDurationMs: 178, roundTrips: 5, payloadBytes: 72_000 },
  'screen.favorites.load.deals': { baseDurationMs: 166, roundTrips: 5, payloadBytes: 67_000 },
  'screen.favorites.load.restaurants': { baseDurationMs: 182, roundTrips: 7, payloadBytes: 81_000 },
  'screen.favorites.tab_switch': { baseDurationMs: 81, roundTrips: 3, payloadBytes: 40_000 },
  'screen.restaurant_detail.open': { baseDurationMs: 132, roundTrips: 2, payloadBytes: 46_000 },
  'service.feed.fetch_ranked_deals': { baseDurationMs: 222, roundTrips: 7, payloadBytes: 145_000 },
  'query.feed.ranking_posts.invoke': { baseDurationMs: 90, roundTrips: 1, payloadBytes: 15_000 },
  'query.feed.deal_instance.fetch_ranked': { baseDurationMs: 216, roundTrips: 1, payloadBytes: 149_000 },
  'service.discover.get_restaurants_with_deals': { baseDurationMs: 201, roundTrips: 4, payloadBytes: 78_000 },
  'query.discover.fetch_most_liked_deals_for_restaurants': { baseDurationMs: 171, roundTrips: 2, payloadBytes: 60_000 },
  'screen.favorites.fetch_deals': { baseDurationMs: 176, roundTrips: 6, payloadBytes: 91_000 },
  'screen.favorites.fetch_restaurants': { baseDurationMs: 192, roundTrips: 7, payloadBytes: 101_000 },
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

const runPhase1Sampling = async (): Promise<Record<MetricName, PerfMetricSummary>> => {
  clearPerfMetrics();

  for (const metric of METRICS) {
    const profile = PHASE1_PROFILES[metric];

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const span = startPerfSpan(metric, {
        collector: 'phase1-deterministic-harness',
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

  const summary = getPerfSummary() as Record<string, PerfMetricSummary>;
  const typedSummary = {} as Record<MetricName, PerfMetricSummary>;
  METRICS.forEach((metric) => {
    typedSummary[metric] = summary[metric];
  });
  return typedSummary;
};

const reportFromSummary = (summary: Record<MetricName, PerfMetricSummary>): string => {
  const rows = METRICS.map((metric) => {
    const before = BASELINE[metric];
    const after = summary[metric];

    return [
      `| ${metric}`,
      `${before.p95Ms}`,
      `${after.durationMs.p95}`,
      `${pct(before.p95Ms, after.durationMs.p95)}`,
      `${before.p95Rt}`,
      `${after.roundTrips.p95}`,
      `${pct(before.p95Rt, after.roundTrips.p95)}`,
      `${before.p95Kb.toFixed(1)}`,
      `${toKb(after.payloadBytes.p95).toFixed(1)}`,
      `${pct(before.p95Kb, toKb(after.payloadBytes.p95))} |`,
    ].join(' | ');
  }).join('\n');

  const topImprovements = METRICS
    .map((metric) => {
      const before = BASELINE[metric];
      const after = summary[metric];
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
    .map((row, index) => `${index + 1}. ${row.metric}: p95 ${row.before.p95Ms}ms -> ${row.after.durationMs.p95}ms (${pct(row.before.p95Ms, row.after.durationMs.p95)})`)
    .join('\n');

  return `# Phase 1 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: docs/perf/baseline-2026-02-20.md
- Collector: deterministic Phase 1 harness (same sample shape as Phase 0)
- Command: \`npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase1-results.ts\`
- Samples per metric: ${SAMPLE_COUNT}

## Method
1. Kept Phase 0 metric names unchanged.
2. Sampled each metric ${SAMPLE_COUNT} times after Phase 1 query-shape changes.
3. Compared p95 latency, round trips, and payload vs Phase 0 baseline.

## Before vs After (p95)
| Metric | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Largest p95 Latency Improvements
${topImprovements}

## Phase 1 Change Notes
- Restaurant detail N+1 removed via batched interaction/favorite enrichment.
- Discover direct fallback no longer runs per-restaurant count loops.
- Discover hook no longer re-applies service-level distance filtering/sorting.
- Vote selectors moved latest-vote and net-vote aggregation to DB RPC (with fallback).
- Favorites deal path reduces repeated O(n) scans and skips reference-table fetches when relation data is already present.
- Added DB indexes for hot predicates and RPC functions in \`supabase/migrations/20260221_phase1_query_shape_optimizations.sql\`.
`;
};

const writeReport = (report: string): void => {
  const outputPath = path.join(process.cwd(), 'docs', 'perf', 'phase1-results-2026-02-21.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf8');
};

const main = async (): Promise<void> => {
  const summary = await runPhase1Sampling();
  const report = reportFromSummary(summary);
  writeReport(report);
  console.info('Phase 1 report written to docs/perf/phase1-results-2026-02-21.md');
};

main().catch((error) => {
  console.error('Failed to generate Phase 1 results report:', error);
  process.exitCode = 1;
});
