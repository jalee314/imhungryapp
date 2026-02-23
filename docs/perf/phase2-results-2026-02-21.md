# Phase 2 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: docs/perf/phase1-results-2026-02-21.md
- Collector: deterministic Phase 2 harness (includes cache metric sampling)
- Command: `npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase2-results.ts`
- Samples per metric: 10

## Method
1. Kept Phase 0/1 screen and service metric names unchanged.
2. Sampled each metric 10 times under Phase 2 profiles.
3. Recorded cache telemetry for deal/favorites caches (accesses + refresh cost).
4. Compared p95 latency, round trips, and payload vs Phase 1.

## Before vs After (p95)
| Metric | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| screen.feed.load | 138 | 132 | -4.3% | 4 | 3 | -25% | 107.4 | 99.8 | -7.1% |
| screen.feed.refresh | 158 | 146 | -7.6% | 5 | 3 | -40% | 122.1 | 113.4 | -7.1% |
| screen.discover.load | 196 | 195 | -0.5% | 5 | 5 | 0% | 70.3 | 69.6 | -1% |
| screen.favorites.load.deals | 184 | 161 | -12.5% | 5 | 3 | -40% | 65.4 | 56.8 | -13.1% |
| screen.favorites.load.restaurants | 200 | 180 | -10% | 7 | 4 | -42.9% | 79.1 | 67.7 | -14.4% |
| screen.favorites.tab_switch | 99 | 85 | -14.1% | 3 | 1 | -66.7% | 39.1 | 21.5 | -45% |
| screen.restaurant_detail.open | 150 | 151 | +0.7% | 2 | 2 | 0% | 44.9 | 45.0 | +0.2% |
| service.feed.fetch_ranked_deals | 240 | 216 | -10% | 7 | 5 | -28.6% | 141.6 | 125.3 | -11.5% |
| query.feed.ranking_posts.invoke | 108 | 110 | +1.9% | 1 | 1 | 0% | 14.6 | 14.7 | +0.7% |
| query.feed.deal_instance.fetch_ranked | 234 | 237 | +1.3% | 1 | 1 | 0% | 145.5 | 145.6 | +0.1% |
| service.discover.get_restaurants_with_deals | 219 | 219 | 0% | 4 | 4 | 0% | 76.2 | 75.5 | -0.9% |
| query.discover.fetch_most_liked_deals_for_restaurants | 189 | 188 | -0.5% | 2 | 2 | 0% | 58.6 | 58.8 | +0.3% |
| screen.favorites.fetch_deals | 194 | 171 | -11.9% | 6 | 4 | -33.3% | 88.9 | 78.4 | -11.8% |
| screen.favorites.fetch_restaurants | 210 | 188 | -10.5% | 7 | 5 | -28.6% | 98.6 | 86.3 | -12.5% |

## Cache Metrics
| Cache | Accesses | Hit Rate | Stale Refresh Frequency | Refreshes | Refresh p50 (ms) | Refresh p95 (ms) | Refresh p95 Payload (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| deal_cache | 44 | 77.3% | 18.2% | 8 | 144 | 168 | 135.7 |
| favorites_deals_cache | 36 | 77.8% | 16.7% | 6 | 123 | 137 | 87.9 |
| favorites_restaurants_cache | 30 | 76.7% | 16.7% | 5 | 134 | 141 | 98.6 |

## Largest p95 Latency Improvements
1. service.feed.fetch_ranked_deals: p95 240ms -> 216ms (-10%)
2. screen.favorites.load.deals: p95 184ms -> 161ms (-12.5%)
3. screen.favorites.fetch_deals: p95 194ms -> 171ms (-11.9%)
4. screen.favorites.fetch_restaurants: p95 210ms -> 188ms (-10.5%)
5. screen.favorites.load.restaurants: p95 200ms -> 180ms (-10%)

## Phase 2 Change Notes
- Feed realtime vote updates narrowed to vote-only INSERT/DELETE events and apply local vote deltas.
- Deal cache now keys by location context and serves stale data with background revalidation.
- Favorites focus logic no longer force-clears cache on every focus; it refreshes only when stale/dirty.
- Favorites realtime now debounces revalidation to avoid repeated full fetch loops.
- Runtime perf monitor now exposes cache summary APIs for quick console inspection.
