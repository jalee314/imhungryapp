# Dead Code Audit — PR-049

**Date:** 2026-02-18
**Branch:** `pr049_code_audit`

## Summary

Systematic dead-code audit of `ImHungryApp/src/`. Identified and removed
proven-unused files, exports, and types. Integrated two previously test-only
UI components (`ModalHeader`, `ScreenHeader`) into production screens.

| Metric | Value |
|---|---|
| Files deleted | 8 |
| Dead exports removed/unexported | 34 |
| Lines removed (approx.) | ~750 |
| Header components adopted in production | 2 (used in 8 screens) |
| Tests after cleanup | 871 pass / 0 fail |
| New TS errors introduced | 0 |
| New lint violations | 0 |

---

## Phase 1 — Entirely Dead Files Deleted

| File | Evidence | Lines |
|---|---|---|
| `services/imageCacheService.ts` | Zero imports anywhere in `src/` | 23 |
| `services/cuisineUpdateService.ts` | Zero imports anywhere in `src/` | 173 |
| `components/SquareCard.tsx` | Zero imports (neither production nor test) | 115 |
| `types/components.ts` | All 14 exports unused; components define props inline | 111 |
| `types/navigation.ts` | All 3 exports unused; components define props inline | 13 |
| `types/service-results.ts` | All 3 types duplicated in respective service files; zero importers | 39 |
| `types/user.ts` | All 5 types duplicated in service files; only importer was `service-results.ts` (also dead) | 68 |
| `types/index.ts` | Barrel re-export file with zero consumers (`import from '../types'` not used anywhere) | 110 |

## Phase 2 — Dead Exports Removed from Live Files

### Exports deleted (function/type body removed)

| File | Export | Reason |
|---|---|---|
| `services/imageProcessingService.ts` | `getOptimizedImageUrl` | Wrapper combining two other exported functions; never imported |
| `services/profileLoadingService.ts` | `ProfileLoadingResult` (type) | Only used by the deleted `loadCompleteUserProfile` |
| `services/profileLoadingService.ts` | `loadCompleteUserProfile` | Superseded by `loadCriticalProfileData`; zero importers |
| `services/profileUtilsService.ts` | `getUsernameFontSize` | Zero importers |
| `services/profileUtilsService.ts` | `showLogoutConfirmation` | Zero importers (logout handled via modal) |
| `services/userPostsService.ts` | `clearUserPostsCache` | Zero importers |
| `services/userProfileService.ts` | `clearProfileCache` | Zero importers |
| `services/userProfileService.ts` | `clearAllProfileCache` | Zero importers |
| `services/userService.ts` | `updateUserData` | Zero importers (profile updates go through `profileUpdateService`) |
| `services/userService.ts` | `getPublicUrl` (private) | Only caller was `updateUserData` (now removed) |
| `services/deals/utils.ts` | `parseDate` | Zero importers |
| `app/navigation/routeConstants.ts` | `RouteParams` re-export | Type removed from `types.ts`; zero consumers through this path |
| `app/navigation/routeConstants.ts` | `DeepLinkPath` re-export | Zero consumers through `routeConstants` |

### Exports unexported (kept as module-private)

| File | Export → Private | Reason |
|---|---|---|
| `services/cuisineMappingService.ts` | `GOOGLE_PLACES_CUISINE_MAPPING` | Only used internally by `mapAndCreateRestaurantCuisine` |
| `services/cuisineMappingService.ts` | `getCuisineFromGooglePlacesTypes` | Only used internally |
| `services/cuisineMappingService.ts` | `getCuisineIdByName` | Only used internally |
| `services/cuisineMappingService.ts` | `createRestaurantCuisineEntry` | Only used internally |
| `services/profileUpdateService.ts` | `ProfileFormUpdate` (type) | Only used within the file |
| `services/profileUpdateService.ts` | `fetchUserCuisines` | Only called by `fetchCurrentUserCuisines` in same file |
| `services/sessionService.ts` | `createDatabaseSession` | Only called internally by `initializeAuthSession`/`setupAppStateListener` |
| `services/sessionService.ts` | `endDatabaseSession` | Only called internally |
| `services/sessionService.ts` | `isAuthenticated` | Only called internally by `setupAppStateListener` |
| `services/userPostsService.ts` | `transformDealForUI` | Only called internally by `fetchUserPosts` |
| `services/userService.ts` | `User` (type) | Used internally but never imported externally |
| `services/userService.ts` | `UserDisplayData` (type) | Used internally but never imported externally |

### Navigation types pruned

| File | Exports removed | Count |
|---|---|---|
| `app/navigation/types.ts` | All `*NavigationProp` types (11) | 11 |
| `app/navigation/types.ts` | All `*ScreenProps` types (10) | 10 |
| `app/navigation/types.ts` | `RouteParams` interface | 1 |
| | **Total** | **22** |

ParamList types (10) retained — actively used by stack components.

## Phase 3 — Header Components Adopted

Previously test-only ALF components promoted to production use:

### `ModalHeader` → adopted in 2 modals

| Screen | Before | After |
|---|---|---|
| `components/CalendarModal.tsx` | Inline View/Text header (8 lines + 3 styles) | `<ModalHeader>` |
| `components/ListSelectionModal.tsx` | Inline View/Text header (7 lines + 4 styles) | `<ModalHeader>` |

### `ScreenHeader` → adopted in 6 screens

| Screen | Before | After |
|---|---|---|
| `screens/admin/AdminLoginScreen.tsx` | Inline `View/Ionicons/Text` (6 lines + 4 styles) | `<ScreenHeader>` |
| `screens/admin/AdminMassUploadScreen.tsx` | Inline `View/Ionicons/Text` (9 lines + 4 styles) | `<ScreenHeader>` |
| `screens/profile/TermsConditionsPage.tsx` | Inline `View/MCI/Text` (6 lines + 3 styles) | `<ScreenHeader>` |
| `screens/profile/PrivacyPolicyPage.tsx` | Inline `View/MCI/Text` (6 lines + 3 styles) | `<ScreenHeader>` |
| `screens/profile/FAQPage.tsx` | Inline `View/MCI/Text` (6 lines + 3 styles) | `<ScreenHeader>` |
| `screens/profile/ContactUsPage.tsx` | Inline `View/MCI/Text` (6 lines + 3 styles) | `<ScreenHeader>` |

The 4 profile pages also dropped the `MaterialCommunityIcons` import (icon now
provided by `ScreenHeader` using `Ionicons`).

## Verification

```
Test Suites: 34 passed, 34 total
Tests:       871 passed, 871 total
Snapshots:   129 passed, 129 total

TypeScript:  0 new errors (pre-existing baseline unchanged)
Lint:        0 new violations in touched files
```
