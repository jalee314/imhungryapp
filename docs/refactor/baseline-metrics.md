# Baseline Code Health Metrics

**Generated:** 2026-02-11 21:44:51 UTC  
**Branch:** real_refactor (pre-refactor baseline)

## Summary

| Metric | Value |
|--------|-------|
| Total source files | 114 |
| Total LOC | 35,695 |
| Large files (>300 LOC) | 35 |
| TypeScript errors | 110 |
| Type safety issues | 290 |
| Tech debt markers | 0 |
| Test files | 1 |

---

## File Counts

| Category | Count |
|----------|-------|
| TypeScript files (.ts) | 46 |
| TSX files (.tsx) | 68 |
| **Total source files** | **114** |

## Lines of Code

| Category | LOC |
|----------|-----|
| TypeScript | 11,172 |
| TSX | 24,523 |
| **Total** | **35,695** |

## Large Files (>300 lines)

These files are candidates for refactoring/splitting:

| File | Lines |
|------|-------|
| src/services/dealService.ts | 1,587 |
| src/screens/deal_feed/DealDetailScreen.tsx | 1,513 |
| src/components/PhotoReviewModal.tsx | 1,254 |
| src/screens/contribution/DealEditScreen.tsx | 1,085 |
| src/screens/contribution/DealCreationScreen.tsx | 1,066 |
| src/components/InstagramPhotoPickerModal.tsx | 1,061 |
| src/screens/admin/AdminReportsScreen.tsx | 1,059 |
| src/screens/profile/ProfilePage.tsx | 1,057 |
| src/services/adminService.ts | 915 |
| src/screens/admin/AdminMassUploadScreen.tsx | 862 |
| src/screens/contribution/DealPreviewScreen.tsx | 790 |
| src/screens/admin/AdminUsersScreen.tsx | 726 |
| src/screens/discover_feed/RestaurantDetailScreen.tsx | 707 |
| src/screens/favorites/FavoritesPage.tsx | 699 |
| src/screens/deal_feed/Feed.tsx | 699 |
| src/services/favoritesService.ts | 692 |
| src/types/index.ts | 664 |
| src/screens/deal_feed/CommunityUploadedScreen.tsx | 582 |
| src/screens/admin/AdminDealsScreen.tsx | 548 |
| src/hooks/useProfile.ts | 537 |
| src/components/DealCard.tsx | 512 |
| src/components/ImageCropperModal.tsx | 468 |
| src/components/LocationModal.tsx | 457 |
| src/services/discoverService.ts | 446 |
| src/screens/onboarding/ResetPassword.tsx | 385 |
| src/screens/admin/AdminDashboardScreen.tsx | 382 |
| src/services/profileActionsService.ts | 358 |
| src/screens/discover_feed/DiscoverFeed.tsx | 353 |
| src/services/locationService.ts | 351 |
| src/screens/onboarding/SignUp.tsx | 339 |
| src/screens/onboarding/LogIn.tsx | 333 |
| src/services/imageProcessingService.ts | 329 |
| src/screens/onboarding/ProfilePhoto.tsx | 324 |
| src/screens/onboarding/UsernameScreen.tsx | 319 |
| src/screens/onboarding/CuisinePreferences.tsx | 318 |

**Total large files:** 35

## TypeScript Errors

| Metric | Count |
|--------|-------|
| TypeScript errors | 110 |

## ESLint Issues

| Category | Count |
|----------|-------|
| Errors | 3 |
| Warnings | 1,291 |

## Type Safety

| Pattern | Count |
|---------|-------|
| `: any` usages | 183 |
| `as any` casts | 99 |
| `as never` casts | 8 |
| **Total type safety issues** | **290** |

## Technical Debt Markers

| Marker | Count |
|--------|-------|
| TODO comments | 0 |
| FIXME comments | 0 |
| HACK comments | 0 |

## Test Coverage

| Metric | Count |
|--------|-------|
| Test files | 1 |

---

## Refactor Goals

Based on these baseline metrics, the refactor should aim to:

1. **Reduce TypeScript errors** from 110 to 0
2. **Reduce type safety issues** from 290 to <50
3. **Split large files** (>500 LOC) into smaller, focused modules
4. **Increase test coverage** from 1 test file
5. **Address ESLint warnings** (1,291 → <100)

---

## How to Update

Run the metrics script to generate updated measurements:

```bash
./scripts/metrics/codebase-health.sh
```
