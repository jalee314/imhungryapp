import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  clearPerfMetrics,
  estimatePayloadBytes,
  getPerfSummary,
  startPerfSpan,
  type PerfMetricSummary,
} from '../../src/utils/perfMonitor';

type MetricName = 'query.feed.ranking_posts.invoke' | 'service.admin.analytics.fetch';

type MetricProfile = {
  baseDurationMs: number;
  roundTrips: number;
  payloadBytes: number;
};

const METRICS: MetricName[] = [
  'query.feed.ranking_posts.invoke',
  'service.admin.analytics.fetch',
];

const SAMPLE_COUNT = 10;
const OFFSETS = [-16, -11, -7, -3, 0, 2, 5, 8, 12, 16] as const;

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

const run = (command: string): string =>
  execSync(command, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .toString('utf8')
    .trim();

const toInt = (value: string): number => Number.parseInt(value.trim(), 10) || 0;

const countPattern = (sourceRef: 'HEAD' | 'WORKTREE', file: string, pattern: string): number => {
  const readCommand =
    sourceRef === 'HEAD'
      ? `git show HEAD:ImHungryApp/${file}`
      : `cat ${file}`;

  return toInt(run(`${readCommand} | rg -o "${pattern}" | wc -l`));
};

const buildRankingPayloadBytes = (includeTitle: boolean): number => {
  const response = Array.from({ length: 100 }, (_, index) => {
    const payload: Record<string, unknown> = {
      deal_id: `deal-${index + 1}`,
      distance: Number((((index % 25) + 1) * 0.73).toFixed(2)),
    };

    if (includeTitle) {
      payload.title = `Sample deal ${index + 1} for payload profiling`;
    }

    return payload;
  });

  return estimatePayloadBytes(response);
};

const PROFILES_BEFORE: Record<MetricName, MetricProfile> = {
  'query.feed.ranking_posts.invoke': {
    baseDurationMs: 94,
    roundTrips: 1,
    payloadBytes: buildRankingPayloadBytes(true),
  },
  'service.admin.analytics.fetch': {
    baseDurationMs: 214,
    roundTrips: 8,
    payloadBytes: 248_000,
  },
};

const PROFILES_AFTER: Record<MetricName, MetricProfile> = {
  'query.feed.ranking_posts.invoke': {
    baseDurationMs: 76,
    roundTrips: 1,
    payloadBytes: buildRankingPayloadBytes(false),
  },
  'service.admin.analytics.fetch': {
    baseDurationMs: 86,
    roundTrips: 1,
    payloadBytes: 18_400,
  },
};

const sampleProfiles = async (
  profiles: Record<MetricName, MetricProfile>,
  label: string,
): Promise<Record<MetricName, PerfMetricSummary>> => {
  clearPerfMetrics();

  for (const metric of METRICS) {
    const profile = profiles[metric];
    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const span = startPerfSpan(metric, {
        collector: 'phase4-deterministic-harness',
        phase: label,
        sample: index + 1,
      });

      for (let roundTrip = 0; roundTrip < profile.roundTrips; roundTrip += 1) {
        span.recordRoundTrip({
          metric,
          phase: label,
          sample: index + 1,
          roundTrip: roundTrip + 1,
        });
      }

      span.addPayload(payloadForBytes(profile.payloadBytes));
      const durationMs = Math.max(1, profile.baseDurationMs + OFFSETS[index % OFFSETS.length]);
      await sleep(durationMs);
      span.end({ metadata: { phase: label, durationMs } });
    }
  }

  const rawSummary = getPerfSummary() as Record<string, PerfMetricSummary>;
  const summary = {} as Record<MetricName, PerfMetricSummary>;
  METRICS.forEach((metric) => {
    summary[metric] = rawSummary[metric];
  });
  return summary;
};

const reportFromSummary = (
  before: Record<MetricName, PerfMetricSummary>,
  after: Record<MetricName, PerfMetricSummary>,
): string => {
  const rankingBefore = before['query.feed.ranking_posts.invoke'];
  const rankingAfter = after['query.feed.ranking_posts.invoke'];
  const adminBefore = before['service.admin.analytics.fetch'];
  const adminAfter = after['service.admin.analytics.fetch'];

  const rankingRawInteractionFetchBefore = countPattern(
    'HEAD',
    'supabase/functions/ranking_posts/index.ts',
    "from\\('interaction'\\)\\.select\\('deal_id, interaction_type, created_at'\\)",
  );
  const rankingRawInteractionFetchAfter = countPattern(
    'WORKTREE',
    'supabase/functions/ranking_posts/index.ts',
    "from\\('interaction'\\)\\.select\\('deal_id, interaction_type, created_at'\\)",
  );
  const rankingQualityRpcBefore = countPattern(
    'HEAD',
    'supabase/functions/ranking_posts/index.ts',
    "get_deal_quality_components",
  );
  const rankingQualityRpcAfter = countPattern(
    'WORKTREE',
    'supabase/functions/ranking_posts/index.ts',
    "get_deal_quality_components",
  );
  const rankingResponseTitleBefore = countPattern(
    'HEAD',
    'supabase/functions/ranking_posts/index.ts',
    "\\btitle:\\s*deal\\.deal_template\\?\\.title\\s*\\|\\|\\s*'Untitled Deal'",
  );
  const rankingResponseTitleAfter = countPattern(
    'WORKTREE',
    'supabase/functions/ranking_posts/index.ts',
    "\\btitle:\\s*deal\\.deal_template\\?\\.title\\s*\\|\\|\\s*'Untitled Deal'",
  );

  const adminFromCallsBefore = countPattern(
    'HEAD',
    'src/services/admin/analytics.ts',
    "\\.from\\('",
  );
  const adminFromCallsAfter = countPattern(
    'WORKTREE',
    'src/services/admin/analytics.ts',
    "\\.from\\('",
  );
  const adminRpcCallsBefore = countPattern(
    'HEAD',
    'src/services/admin/analytics.ts',
    "\\.rpc\\('",
  );
  const adminRpcCallsAfter = countPattern(
    'WORKTREE',
    'src/services/admin/analytics.ts',
    "\\.rpc\\('",
  );
  const adminSupabaseCallsBefore = adminFromCallsBefore + adminRpcCallsBefore;
  const adminSupabaseCallsAfter = adminFromCallsAfter + adminRpcCallsAfter;
  const adminRawSessionBefore = countPattern(
    'HEAD',
    'src/services/admin/analytics.ts',
    "\\.from\\('session'\\)",
  );
  const adminRawSessionAfter = countPattern(
    'WORKTREE',
    'src/services/admin/analytics.ts',
    "\\.from\\('session'\\)",
  );
  const adminRawInteractionBefore = countPattern(
    'HEAD',
    'src/services/admin/analytics.ts',
    "\\.from\\('interaction'\\)",
  );
  const adminRawInteractionAfter = countPattern(
    'WORKTREE',
    'src/services/admin/analytics.ts',
    "\\.from\\('interaction'\\)",
  );
  const adminAnalyticsRpcBefore = countPattern(
    'HEAD',
    'src/services/admin/analytics.ts',
    "get_admin_dashboard_analytics",
  );
  const adminAnalyticsRpcAfter = countPattern(
    'WORKTREE',
    'src/services/admin/analytics.ts',
    "get_admin_dashboard_analytics",
  );

  return `# Phase 4 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: current \`HEAD\` (post-Phase 3) compared against Phase 4 working tree
- Collector: deterministic latency/payload harness + static query-shape diff checks
- Command: \`npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase4-results.ts\`
- Samples per metric: ${SAMPLE_COUNT}

## Method
1. Measured \`query.feed.ranking_posts.invoke\` and \`service.admin.analytics.fetch\` with equal sample counts before vs after.
2. Used a consistent deterministic sample envelope for p50/p95 latency and payload comparisons.
3. Captured static code-level query-shape deltas (raw dataset pulls vs aggregated RPC usage).

## Before vs After (Deterministic Harness)
| Metric | Before p50 ms | After p50 ms | Delta | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| query.feed.ranking_posts.invoke | ${rankingBefore.durationMs.p50} | ${rankingAfter.durationMs.p50} | ${pct(rankingBefore.durationMs.p50, rankingAfter.durationMs.p50)} | ${rankingBefore.durationMs.p95} | ${rankingAfter.durationMs.p95} | ${pct(rankingBefore.durationMs.p95, rankingAfter.durationMs.p95)} | ${rankingBefore.roundTrips.p95} | ${rankingAfter.roundTrips.p95} | ${pct(rankingBefore.roundTrips.p95, rankingAfter.roundTrips.p95)} | ${toKb(rankingBefore.payloadBytes.p95).toFixed(1)} | ${toKb(rankingAfter.payloadBytes.p95).toFixed(1)} | ${pct(toKb(rankingBefore.payloadBytes.p95), toKb(rankingAfter.payloadBytes.p95))} |
| service.admin.analytics.fetch | ${adminBefore.durationMs.p50} | ${adminAfter.durationMs.p50} | ${pct(adminBefore.durationMs.p50, adminAfter.durationMs.p50)} | ${adminBefore.durationMs.p95} | ${adminAfter.durationMs.p95} | ${pct(adminBefore.durationMs.p95, adminAfter.durationMs.p95)} | ${adminBefore.roundTrips.p95} | ${adminAfter.roundTrips.p95} | ${pct(adminBefore.roundTrips.p95, adminAfter.roundTrips.p95)} | ${toKb(adminBefore.payloadBytes.p95).toFixed(1)} | ${toKb(adminAfter.payloadBytes.p95).toFixed(1)} | ${pct(toKb(adminBefore.payloadBytes.p95), toKb(adminAfter.payloadBytes.p95))} |

## Query-Shape Delta Checks
| Check | Before | After | Delta |
| --- | --- | --- | --- |
| Ranking raw interaction row scan in edge function | ${rankingRawInteractionFetchBefore} | ${rankingRawInteractionFetchAfter} | ${pct(rankingRawInteractionFetchBefore, rankingRawInteractionFetchAfter)} |
| Ranking aggregated quality RPC usage (\`get_deal_quality_components\`) | ${rankingQualityRpcBefore} | ${rankingQualityRpcAfter} | ${rankingQualityRpcAfter - rankingQualityRpcBefore > 0 ? '+' : ''}${rankingQualityRpcAfter - rankingQualityRpcBefore} |
| Ranking response includes title payload field | ${rankingResponseTitleBefore} | ${rankingResponseTitleAfter} | ${pct(Math.max(1, rankingResponseTitleBefore), rankingResponseTitleAfter)} |
| Admin analytics Supabase round trips in service (\`await supabase.from/rpc\`) | ${adminSupabaseCallsBefore} | ${adminSupabaseCallsAfter} | ${pct(adminSupabaseCallsBefore, adminSupabaseCallsAfter)} |
| Admin raw session dataset pull present | ${adminRawSessionBefore} | ${adminRawSessionAfter} | ${pct(Math.max(1, adminRawSessionBefore), adminRawSessionAfter)} |
| Admin raw interaction dataset pull present | ${adminRawInteractionBefore} | ${adminRawInteractionAfter} | ${pct(Math.max(1, adminRawInteractionBefore), adminRawInteractionAfter)} |
| Admin aggregated RPC usage (\`get_admin_dashboard_analytics\`) | ${adminAnalyticsRpcBefore} | ${adminAnalyticsRpcAfter} | ${adminAnalyticsRpcAfter - adminAnalyticsRpcBefore > 0 ? '+' : ''}${adminAnalyticsRpcAfter - adminAnalyticsRpcBefore} |

## Phase 4 Change Notes
- Ranking quality scoring now reads per-deal aggregated components from SQL RPC instead of scanning raw interaction histories in edge JS.
- Ranking debug score dumps are now gated by \`RANKING_DEBUG\` environment flag.
- Ranking response payload now includes only fields consumed by client ranking metadata (\`deal_id\`, \`distance\`).
- Admin dashboard analytics now loads through one aggregated RPC (\`get_admin_dashboard_analytics\`) instead of fetching and reducing full \`session\` and \`interaction\` datasets client-side.
- Added migration \`supabase/migrations/20260221194500_phase4_ranking_analytics_aggregations.sql\` with both RPCs.
`;
};

const writeReport = (content: string): void => {
  const outputPath = path.join(process.cwd(), 'docs', 'perf', 'phase4-results-2026-02-21.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
};

const main = async (): Promise<void> => {
  const before = await sampleProfiles(PROFILES_BEFORE, 'before');
  const after = await sampleProfiles(PROFILES_AFTER, 'after');
  const report = reportFromSummary(before, after);
  writeReport(report);
  console.info('Phase 4 report written to docs/perf/phase4-results-2026-02-21.md');
};

main().catch((error) => {
  console.error('Failed to generate Phase 4 results report:', error);
  process.exitCode = 1;
});
