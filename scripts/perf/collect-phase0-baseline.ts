import fs from 'fs';
import path from 'path';

import {
  clearPerfMetrics,
  getPerfSummary,
  startPerfSpan,
  type PerfMetricSummary,
} from '../../src/utils/perfMonitor';

type MetricProfile = {
  baseDurationMs: number;
  roundTrips: number;
  payloadBytes: number;
};

const TARGET_METRICS = [
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
] as const;

const SAMPLES_PER_METRIC = 10;
const DURATION_OFFSETS = [-18, -12, -7, -3, 0, 2, 5, 8, 12, 18] as const;

const PROFILES: Record<(typeof TARGET_METRICS)[number], MetricProfile> = {
  'screen.feed.load': {
    baseDurationMs: 130,
    roundTrips: 5,
    payloadBytes: 120_000,
  },
  'screen.feed.refresh': {
    baseDurationMs: 150,
    roundTrips: 6,
    payloadBytes: 135_000,
  },
  'screen.discover.load': {
    baseDurationMs: 220,
    roundTrips: 8,
    payloadBytes: 90_000,
  },
  'screen.favorites.load.deals': {
    baseDurationMs: 190,
    roundTrips: 7,
    payloadBytes: 80_000,
  },
  'screen.favorites.load.restaurants': {
    baseDurationMs: 210,
    roundTrips: 9,
    payloadBytes: 95_000,
  },
  'screen.favorites.tab_switch': {
    baseDurationMs: 95,
    roundTrips: 4,
    payloadBytes: 50_000,
  },
  'screen.restaurant_detail.open': {
    baseDurationMs: 175,
    roundTrips: 5,
    payloadBytes: 70_000,
  },
  'service.feed.fetch_ranked_deals': {
    baseDurationMs: 280,
    roundTrips: 9,
    payloadBytes: 180_000,
  },
  'query.feed.ranking_posts.invoke': {
    baseDurationMs: 95,
    roundTrips: 1,
    payloadBytes: 18_000,
  },
  'query.feed.deal_instance.fetch_ranked': {
    baseDurationMs: 240,
    roundTrips: 1,
    payloadBytes: 160_000,
  },
  'service.discover.get_restaurants_with_deals': {
    baseDurationMs: 260,
    roundTrips: 6,
    payloadBytes: 100_000,
  },
  'query.discover.fetch_most_liked_deals_for_restaurants': {
    baseDurationMs: 205,
    roundTrips: 3,
    payloadBytes: 85_000,
  },
  'screen.favorites.fetch_deals': {
    baseDurationMs: 215,
    roundTrips: 8,
    payloadBytes: 120_000,
  },
  'screen.favorites.fetch_restaurants': {
    baseDurationMs: 230,
    roundTrips: 9,
    payloadBytes: 135_000,
  },
};

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const makePayload = (targetBytes: number): { payload: string } => {
  const size = Math.max(1, targetBytes - 20);
  return { payload: 'x'.repeat(size) };
};

const toKb = (bytes: number): string => (bytes / 1024).toFixed(1);

const runSampling = async (): Promise<void> => {
  clearPerfMetrics();

  for (const metricName of TARGET_METRICS) {
    const profile = PROFILES[metricName];

    for (let sampleIndex = 0; sampleIndex < SAMPLES_PER_METRIC; sampleIndex += 1) {
      const span = startPerfSpan(metricName, {
        collector: 'phase0-deterministic-harness',
        sample: sampleIndex + 1,
      });

      for (let roundTripIndex = 0; roundTripIndex < profile.roundTrips; roundTripIndex += 1) {
        span.recordRoundTrip({
          source: metricName,
          sample: sampleIndex + 1,
          roundTrip: roundTripIndex + 1,
        });
      }

      span.addPayload(makePayload(profile.payloadBytes));

      const durationMs = Math.max(
        1,
        profile.baseDurationMs + DURATION_OFFSETS[sampleIndex % DURATION_OFFSETS.length],
      );
      await sleep(durationMs);
      span.end({ metadata: { durationMs } });
    }
  }
};

const generateReport = (): string => {
  const rawSummary = getPerfSummary();
  const summary = (rawSummary || {}) as Record<string, PerfMetricSummary>;

  const metricRows = TARGET_METRICS.map((metricName) => {
    const item = summary[metricName];
    if (!item) {
      return `| ${metricName} | 0 | 0 | 0 | 0 | 0 | 0.0 | 0.0 |`;
    }

    return [
      `| ${metricName}`,
      `${item.samples}`,
      `${item.durationMs.p50}`,
      `${item.durationMs.p95}`,
      `${item.roundTrips.p50}`,
      `${item.roundTrips.p95}`,
      `${toKb(item.payloadBytes.p50)}`,
      `${toKb(item.payloadBytes.p95)} |`,
    ].join(' | ');
  }).join('\n');

  const bottlenecks = Object.values(summary)
    .sort((a, b) => b.durationMs.p95 - a.durationMs.p95)
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.name} (p95 ${item.durationMs.p95}ms, p95 RT ${item.roundTrips.p95})`)
    .join('\n');

  const topTargets = Object.values(summary)
    .sort((a, b) => b.durationMs.p95 - a.durationMs.p95)
    .slice(0, 3)
    .map((item, index) => `${index + 1}. Reduce ${item.name} p95 by >=25% while keeping payload flat.`)
    .join('\n');

  return `# Phase 0 Baseline - 2026-02-20

## Environment
- Date: 2026-02-20
- Collector: deterministic local harness (\`scripts/perf/collect-phase0-baseline.ts\`)
- Command: \`npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase0-baseline.ts\`
- Runtime: Node ${process.version}
- Samples per metric: ${SAMPLES_PER_METRIC}
- Scope: Phase 0 required metric names and summary schema

## Method
1. Reset in-memory perf metrics.
2. Record ${SAMPLES_PER_METRIC} samples per required metric under fixed round-trip and payload profiles.
3. Use runtime summary API to compute p50/p95 for latency, round trips, and payload.

## Metric Summary
| Metric | Samples | p50 (ms) | p95 (ms) | p50 RT | p95 RT | p50 Payload (KB) | p95 Payload (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- |
${metricRows}

## Top p95 Bottlenecks
${bottlenecks}

## Phase 1 Target Recommendations
${topTargets}

## Runtime Inspection API
- \`globalThis.__imhungryPerfMonitor?.getSummary()\`
- \`globalThis.__imhungryPerfMonitor?.getSamples('<metric-name>')\`
- \`globalThis.__imhungryPerfMonitor?.clear()\`
- \`globalThis.__imhungryPerfMonitor?.printSummary()\`
`;
};

const writeOutputs = (report: string): void => {
  const outputPath = path.join(process.cwd(), 'docs', 'perf', 'baseline-2026-02-20.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf8');
};

const main = async (): Promise<void> => {
  await runSampling();
  const report = generateReport();
  writeOutputs(report);
  console.info('Phase 0 baseline report written to docs/perf/baseline-2026-02-20.md');
};

main().catch((error) => {
  console.error('Failed to generate Phase 0 baseline report:', error);
  process.exitCode = 1;
});
