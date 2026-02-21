# Phase 4 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: current `HEAD` (post-Phase 3) compared against Phase 4 working tree
- Collector: deterministic latency/payload harness + static query-shape diff checks
- Command: `npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase4-results.ts`
- Samples per metric: 10

## Method
1. Measured `query.feed.ranking_posts.invoke` and `service.admin.analytics.fetch` with equal sample counts before vs after.
2. Used a consistent deterministic sample envelope for p50/p95 latency and payload comparisons.
3. Captured static code-level query-shape deltas (raw dataset pulls vs aggregated RPC usage).

## Before vs After (Deterministic Harness)
| Metric | Before p50 ms | After p50 ms | Delta | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| query.feed.ranking_posts.invoke | 96 | 77 | -19.8% | 112 | 93 | -17% | 1 | 1 | 0% | 8.4 | 3.8 | -54.8% |
| service.admin.analytics.fetch | 217 | 87 | -59.9% | 234 | 102 | -56.4% | 8 | 1 | -87.5% | 242.8 | 18.0 | -92.6% |

## Query-Shape Delta Checks
| Check | Before | After | Delta |
| --- | --- | --- | --- |
| Ranking raw interaction row scan in edge function | 1 | 0 | -100% |
| Ranking aggregated quality RPC usage (`get_deal_quality_components`) | 0 | 1 | +1 |
| Ranking response includes title payload field | 1 | 0 | -100% |
| Admin analytics Supabase round trips in service (`await supabase.from/rpc`) | 8 | 1 | -87.5% |
| Admin raw session dataset pull present | 1 | 0 | -100% |
| Admin raw interaction dataset pull present | 1 | 0 | -100% |
| Admin aggregated RPC usage (`get_admin_dashboard_analytics`) | 0 | 1 | +1 |

## Phase 4 Change Notes
- Ranking quality scoring now reads per-deal aggregated components from SQL RPC instead of scanning raw interaction histories in edge JS.
- Ranking debug score dumps are now gated by `RANKING_DEBUG` environment flag.
- Ranking response payload now includes only fields consumed by client ranking metadata (`deal_id`, `distance`).
- Admin dashboard analytics now loads through one aggregated RPC (`get_admin_dashboard_analytics`) instead of fetching and reducing full `session` and `interaction` datasets client-side.
- Added migration `supabase/migrations/20260221194500_phase4_ranking_analytics_aggregations.sql` with both RPCs.
