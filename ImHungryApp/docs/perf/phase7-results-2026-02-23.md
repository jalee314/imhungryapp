# Phase 7 Results - 2026-02-23

## Environment
- Date: 2026-02-23
- Baseline source: current `HEAD` (post-Phase 6) compared against Phase 7 working tree
- Collector: deterministic regression harness + static behavior parity checks
- Command: `npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase7-results.ts`
- Samples per metric: 10

## Method
1. Measured favorites load metrics with equal sample counts before vs after.
2. Used a deterministic envelope for p50/p95 latency, round trips, and payload.
3. Added static parity checks for Supabase call shape and route usage in favorites handlers.

## Before vs After (Deterministic Harness)
| Metric | Before p50 ms | After p50 ms | Delta | Before p95 ms | After p95 ms | Delta | Before p95 RT | After p95 RT | Delta | Before p95 KB | After p95 KB | Delta |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| screen.favorites.load.deals | 126 | 125 | -0.8% | 141 | 140 | -0.7% | 5 | 5 | 0% | 8.1 | 8.1 | 0% |
| screen.favorites.load.restaurants | 134 | 133 | -0.7% | 148 | 148 | 0% | 5 | 5 | 0% | 5.3 | 5.3 | 0% |

## Regression Parity Checks
| Check | Before | After | Delta |
| --- | --- | --- | --- |
| Favorites deals service Supabase call sites (`from/rpc`) | 2 | 2 | 0% |
| Favorites restaurants service Supabase call sites (`from/rpc`) | 2 | 2 | 0% |
| Favorites navigation to `DealDetail` present | 1 | 1 | 0% |
| Favorites navigation to `RestaurantDetail` present | 1 | 1 | 0% |

## Phase 7 Change Notes
- Added parity tests for favorites navigation payload mapping and guard conditions.
- Locked behavior for route contracts after Phase 6 module decomposition.
- No runtime query-shape or payload-contract changes introduced in Phase 7.
