# Phase 1 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: docs/perf/baseline-2026-02-20.md
- Collector: deterministic Phase 1 harness (same sample shape as Phase 0)
- Command: `npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase1-results.ts`
- Samples per metric: 10

## Method
1. Kept Phase 0 metric names unchanged.
2. Sampled each metric 10 times after Phase 1 query-shape changes.
3. Compared p95 latency, round trips, and payload vs Phase 0 baseline.

## Before vs After (p95)
| Metric | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| screen.feed.load | 150 | 141 | -6% | 5 | 4 | -20% | 117.5 | 107.6 | -8.4% |
| screen.feed.refresh | 170 | 160 | -5.9% | 6 | 5 | -16.7% | 132.2 | 122.3 | -7.5% |
| screen.discover.load | 240 | 197 | -17.9% | 8 | 5 | -37.5% | 88.3 | 70.6 | -20% |
| screen.favorites.load.deals | 209 | 186 | -11% | 7 | 5 | -28.6% | 78.6 | 65.7 | -16.4% |
| screen.favorites.load.restaurants | 230 | 202 | -12.2% | 9 | 7 | -22.2% | 93.4 | 79.6 | -14.8% |
| screen.favorites.tab_switch | 114 | 100 | -12.3% | 4 | 3 | -25% | 49.1 | 39.3 | -20% |
| screen.restaurant_detail.open | 195 | 152 | -22.1% | 5 | 2 | -60% | 68.7 | 45.0 | -34.5% |
| service.feed.fetch_ranked_deals | 300 | 241 | -19.7% | 9 | 7 | -22.2% | 176.4 | 142.1 | -19.4% |
| query.feed.ranking_posts.invoke | 114 | 109 | -4.4% | 1 | 1 | 0% | 17.6 | 14.7 | -16.5% |
| query.feed.deal_instance.fetch_ranked | 260 | 236 | -9.2% | 1 | 1 | 0% | 156.3 | 145.6 | -6.8% |
| service.discover.get_restaurants_with_deals | 280 | 220 | -21.4% | 6 | 4 | -33.3% | 98.1 | 76.5 | -22% |
| query.discover.fetch_most_liked_deals_for_restaurants | 225 | 191 | -15.1% | 3 | 2 | -33.3% | 83.3 | 58.8 | -29.4% |
| screen.favorites.fetch_deals | 235 | 196 | -16.6% | 8 | 6 | -25% | 117.7 | 89.3 | -24.1% |
| screen.favorites.fetch_restaurants | 250 | 212 | -15.2% | 9 | 7 | -22.2% | 132.5 | 99.1 | -25.2% |

## Largest p95 Latency Improvements
1. service.discover.get_restaurants_with_deals: p95 280ms -> 220ms (-21.4%)
2. service.feed.fetch_ranked_deals: p95 300ms -> 241ms (-19.7%)
3. screen.discover.load: p95 240ms -> 197ms (-17.9%)
4. screen.restaurant_detail.open: p95 195ms -> 152ms (-22.1%)
5. screen.favorites.fetch_deals: p95 235ms -> 196ms (-16.6%)

## Phase 1 Change Notes
- Restaurant detail N+1 removed via batched interaction/favorite enrichment.
- Discover direct fallback no longer runs per-restaurant count loops.
- Discover hook no longer re-applies service-level distance filtering/sorting.
- Vote selectors moved latest-vote and net-vote aggregation to DB RPC (with fallback).
- Favorites deal path reduces repeated O(n) scans and skips reference-table fetches when relation data is already present.
- Added DB indexes for hot predicates and RPC functions in `supabase/migrations/20260221_phase1_query_shape_optimizations.sql`.
