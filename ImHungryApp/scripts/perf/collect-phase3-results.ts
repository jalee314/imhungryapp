import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const run = (command: string): string =>
  execSync(command, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .toString('utf8')
    .trim();

const toInt = (value: string): number => Number.parseInt(value.trim(), 10) || 0;

const countAuthCalls = (sourceRef: 'HEAD' | 'WORKTREE'): number => {
  const files = [
    'src/services/favoritesService.ts',
    'src/services/restaurantFavoriteService.ts',
    'src/features/interactions/selectors/voteSelectors.ts',
    'src/features/feed/useFeed.ts',
    'src/features/favorites/useFavoritesScreen.ts',
    'src/features/community/useCommunity.ts',
    'src/services/dealCacheService.ts',
    'src/features/deal-detail/useDealDetail.ts',
  ];

  const fileContent = files
    .map((file) =>
      sourceRef === 'HEAD'
        ? `git show HEAD:ImHungryApp/${file}`
        : `cat ${file}`,
    )
    .join('; ');

  return toInt(
    run(`(${fileContent}) | rg -o "supabase\\.auth\\.getUser\\(" | wc -l`),
  );
};

const countInlineUserHelpers = (sourceRef: 'HEAD' | 'WORKTREE'): number => {
  const files = [
    'src/services/favoritesService.ts',
    'src/services/restaurantFavoriteService.ts',
    'src/features/interactions/selectors/voteSelectors.ts',
  ];

  const fileContent = files
    .map((file) =>
      sourceRef === 'HEAD'
        ? `git show HEAD:ImHungryApp/${file}`
        : `cat ${file}`,
    )
    .join('; ');

  return toInt(
    run(`(${fileContent}) | rg -o "getCurrentUserId\\s*=\\s*async" | wc -l`),
  );
};

const countLegacyFavoriteMutationPaths = (sourceRef: 'HEAD' | 'WORKTREE'): number => {
  const files = [
    'src/services/favoritesService.ts',
    'src/services/restaurantFavoriteService.ts',
  ];

  const fileContent = files
    .map((file) =>
      sourceRef === 'HEAD'
        ? `git show HEAD:ImHungryApp/${file}`
        : `cat ${file}`,
    )
    .join('; ');

  return toInt(
    run(
      `(${fileContent}) | rg -U -o "from\\('favorite'\\)[\\s\\S]{0,120}\\.(insert|delete)" | wc -l`,
    ),
  );
};

const countCanonicalToggleReferences = (): number =>
  toInt(
    run(
      `rg -n "canonicalToggleRestaurantFavorite" src/services/favoritesService.ts src/services/restaurantFavoriteService.ts | wc -l`,
    ),
  );

const pct = (before: number, after: number): string => {
  if (before === 0) return '0%';
  const delta = ((after - before) / before) * 100;
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

const report = (): string => {
  const authCallsBefore = countAuthCalls('HEAD');
  const authCallsAfter = countAuthCalls('WORKTREE');

  const helperDefsBefore = countInlineUserHelpers('HEAD');
  const helperDefsAfter = countInlineUserHelpers('WORKTREE');

  const legacyMutationsBefore = countLegacyFavoriteMutationPaths('HEAD');
  const legacyMutationsAfter = countLegacyFavoriteMutationPaths('WORKTREE');

  const canonicalToggleRefs = countCanonicalToggleReferences();

  return `# Phase 3 Results - 2026-02-21

## Environment
- Date: 2026-02-21
- Baseline source: current \`HEAD\` (post-Phase 2) compared against Phase 3 working tree
- Collector: static domain-consolidation metrics script
- Command: \`npx ts-node --skip-project --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/perf/collect-phase3-results.ts\`

## Method
1. Compared interaction/favorites/auth domain files in \`HEAD\` vs working tree.
2. Counted direct \`supabase.auth.getUser()\` call sites in high-churn interaction/favorites paths.
3. Counted duplicated inline \`getCurrentUserId\` helper definitions.
4. Counted legacy restaurant favorite write-path fragments outside canonical interactions mutations.

## Before vs After (Domain Consolidation)
| Metric | Before | After | Delta |
| --- | --- | --- | --- |
| Direct \`supabase.auth.getUser()\` calls (targeted interaction/favorites files) | ${authCallsBefore} | ${authCallsAfter} | ${pct(authCallsBefore, authCallsAfter)} |
| Inline \`getCurrentUserId\` helper definitions (favorites + interactions selector files) | ${helperDefsBefore} | ${helperDefsAfter} | ${pct(helperDefsBefore, helperDefsAfter)} |
| Legacy restaurant-favorite write fragments in service facades | ${legacyMutationsBefore} | ${legacyMutationsAfter} | ${pct(legacyMutationsBefore, legacyMutationsAfter)} |
| Canonical restaurant-favorite toggle references in facades | 0 | ${canonicalToggleRefs} | +${canonicalToggleRefs} |

## Phase 3 Change Notes
- Added centralized user identity helper: \`src/services/currentUserService.ts\`.
- Interactions selectors/mutations/logging now resolve user identity via one shared helper.
- \`restaurantFavoriteService\` converted to compatibility wrappers over canonical interactions selectors/mutations.
- \`favoritesService.toggleRestaurantFavorite\` now delegates to canonical interactions mutation path.
- Feed/favorites/community/detail/deal-cache realtime setup paths now use shared user identity helper.

## Compatibility Notes
- Public facade APIs remain intact (no caller contract break).
- Legacy wrappers retained where existing screens/tests still depend on old service entry points.
`;
};

const writeReport = (content: string): void => {
  const outputPath = path.join(process.cwd(), 'docs', 'perf', 'phase3-results-2026-02-21.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
};

const main = (): void => {
  const content = report();
  writeReport(content);
  console.info('Phase 3 report written to docs/perf/phase3-results-2026-02-21.md');
};

main();
