# ImHungry App Architecture Refactor Plan

## Overview

This document outlines a comprehensive plan to refactor the ImHungry app following Bluesky's actual architecture pattern. The goal is to create a more maintainable, scalable, and performant codebase by separating concerns into distinct layers.

> **Note:** This plan has been verified against Bluesky's actual codebase at https://github.com/bluesky-social/social-app

---

## Current State Analysis

### Current Directory Structure
```
src/
├── components/        # 19 components (mixed UI primitives and complex components)
├── context/          # 6 context files (legacy - being replaced by stores)
├── hooks/            # 8 hook files
├── screens/          # 7 screen folders with 25+ screens
├── services/         # 28 service files
├── stores/           # 6 Zustand stores
└── types/            # 1 large file (665 lines)
```

### Key Issues Identified
1. **Monolithic App.tsx** (~333 lines) - Contains all navigation logic, stack definitions, and tab configurations
2. **Large types file** - Single 665-line file mixing all domain types
3. **No clear design system** - Components are mixed primitives and feature-specific
4. **Manual data fetching** - Using `useEffect` for server state instead of React Query
5. **Flat screen structure** - All screens in `src/screens/` without clear organization
6. **Mixed concerns in services** - 28 services without clear boundaries

---

## Target Architecture (Bluesky-Aligned)

Based on Bluesky's actual implementation:

```
src/
├── ui/                     # UI Style System (inspired by Bluesky's ALF)
│   ├── index.tsx           # Main exports, ThemeProvider, useTheme
│   ├── atoms.ts            # Style primitives (like Tailwind - a.flex_row, a.p_md)
│   ├── themes.ts           # Light/Dark theme definitions
│   ├── tokens.ts           # Design tokens (colors, spacing, etc.)
│   ├── fonts.ts            # Font scale and family configuration
│   ├── breakpoints.ts      # Responsive breakpoints (gtMobile, gtTablet)
│   └── util/               # Utilities (flatten, platform, themeSelector)
│
├── components/             # Reusable UI Components (SEPARATE from alf)
│   ├── Button.tsx          # Button component
│   ├── Typography.tsx      # Text, H1, H2, P components
│   ├── Layout/             # Screen, Header, Content layout system
│   ├── forms/              # Form components (TextField, Toggle, etc.)
│   ├── dialogs/            # Dialog/Modal components
│   ├── icons/              # Icon components
│   └── ...                 # Other shared components
│
├── screens/                # Screen components (newer pattern)
│   ├── Onboarding/         # Onboarding flow screens
│   ├── Profile/            # Profile-related screens
│   ├── Settings/           # Settings screens
│   └── ...                 # Other screen groups
│
├── view/                   # View layer (Shell + Legacy screens)
│   ├── shell/              # App shell (main wrapper, drawer, etc.)
│   │   ├── index.tsx       # Main Shell component
│   │   ├── Drawer.tsx      # Navigation drawer
│   │   └── ...
│   ├── com/                # Shared view components
│   │   ├── posts/          # Post-related components
│   │   ├── util/           # Utility components (List, FAB, etc.)
│   │   └── ...
│   └── screens/            # Legacy screens (migrate to src/screens/)
│
├── state/                  # State Management Layer
│   ├── queries/            # TanStack React Query hooks (server state)
│   │   ├── feed.ts         # Feed queries
│   │   ├── profile.ts      # Profile queries
│   │   ├── preferences.ts  # Preferences queries
│   │   └── util.ts         # Query utilities
│   ├── shell/              # Shell state (React Context - NOT Zustand)
│   │   ├── composer/       # Composer state
│   │   ├── drawer.tsx      # Drawer open/close state
│   │   └── ...
│   ├── session/            # Session management (React Context)
│   └── preferences/        # User preferences state (React Context)
│
├── lib/                    # Libraries and Utilities
│   ├── api/                # API-related utilities
│   ├── hooks/              # Custom hooks
│   ├── routes/             # Route helpers and types
│   └── strings/            # String utilities
│
├── Navigation.tsx          # Single navigation file (at src root)
│
└── types/                  # TypeScript definitions
    ├── deals.ts
    ├── user.ts
    └── index.ts            # Re-exports
```

### Key Differences from Original Plan

| Aspect | Original Plan | Bluesky's Actual Pattern | ImHungry Approach |
|--------|---------------|--------------------------|-------------------|
| **Style System** | Contains components | ALF: Style system only (atoms, themes, tokens) | `src/ui/` folder |
| **Components** | Inside style folder | Separate `src/components/` folder | Same |
| **Features folder** | Proposed | Not used - screens are grouped differently | Same as Bluesky |
| **Navigation** | `src/view/Navigation.tsx` | `src/Navigation.tsx` (at src root) | Same |
| **Server State** | Manual useEffect | TanStack React Query | Same |
| **Local State** | Zustand stores | React Context (NOT Zustand) | Migrate to Context |
| **Screens** | Feature-grouped | `src/screens/` + `src/view/screens/` | Same |

> **State Management Note:** Bluesky uses **TanStack React Query** for server state and **React Context** for local state. They do NOT use Zustand. We will migrate our Zustand stores to React Context to match their pattern.

---

## Phase 1: Infrastructure & The "Shell" (Week 1)

### Goal
Extract navigation to a dedicated file and establish the shell structure.

### Tasks

#### 1.1 Extract Types (Day 1)
Split `src/types/index.ts` (665 lines) into domain-specific files:

| New File | Types to Move | Approx Lines |
|----------|---------------|--------------|
| `src/types/deals.ts` | `Deal`, `DatabaseDeal`, `CreateDealData`, `RankedDealMeta`, `DealVote`, etc. | ~150 |
| `src/types/user.ts` | `User`, `UserDisplayData`, `UserPost`, `UserProfileData`, `UserProfileCache` | ~100 |
| `src/types/restaurant.ts` | `Restaurant`, `GooglePlaceResult`, `DiscoverRestaurant`, `RestaurantDeal` | ~100 |
| `src/types/cuisine.ts` | `Cuisine`, `CuisinePreference`, cuisine-related types | ~50 |
| `src/types/admin.ts` | `AdminReport`, `AdminDeal`, `AdminUser`, admin-related types | ~80 |
| `src/types/common.ts` | `ImageVariants`, `ImageType`, navigation types, etc. | ~100 |
| `src/types/index.ts` | Re-export all types from above files | ~20 |

#### 1.2 Create Navigation File (Day 2)
Create `src/Navigation.tsx` at the **src root** (Bluesky pattern - NOT in view/):

```
src/
├── Navigation.tsx          # All navigation logic here
├── view/
│   └── shell/
│       └── index.tsx       # Shell wrapper
└── ...
```

**Key patterns from Bluesky's Navigation.tsx:**
```tsx
// src/Navigation.tsx
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {NavigationContainer} from '@react-navigation/native'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Reusable "commonScreens" pattern - shared across navigators
function commonScreens(Stack: typeof Flat) {
  return (
    <>
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="ReportContent" component={ReportContentScreen} />
      {/* ... other shared screens */}
    </>
  )
}

// Individual tab navigators
function FeedTabNavigator() {
  return (
    <FeedTab.Navigator screenOptions={screenOptions}>
      <FeedTab.Screen name="Feed" component={FeedScreen} />
      {commonScreens(FeedTab)}
    </FeedTab.Navigator>
  )
}

// Main flat navigator (Bluesky uses this for web)
export function FlatNavigator() { /* ... */ }

// Routes container with linking config
export function RoutesContainer({children}) {
  return (
    <NavigationContainer linking={linking}>
      {children}
    </NavigationContainer>
  )
}
```

#### 1.3 Create Shell Structure (Day 2-3)
Create the view/shell layer:

```
src/view/
├── shell/
│   ├── index.tsx           # Main Shell component
│   └── TabBar.tsx          # Custom bottom tab bar (from BottomNavigation)
└── com/
    └── util/
        └── ErrorBoundary.tsx
```

**Shell component (Bluesky pattern):**
```tsx
// src/view/shell/index.tsx
import {RoutesContainer, FlatNavigator} from '#/Navigation'

export function Shell() {
  const {isAuthenticated} = useAuth()
  const {isAdminMode} = useAdmin()
  
  return (
    <View style={[a.h_full, t.atoms.bg]}>
      <RoutesContainer>
        {isAdminMode ? (
          <AdminNavigator />
        ) : isAuthenticated ? (
          <MainTabNavigator />
        ) : (
          <OnboardingNavigator />
        )}
      </RoutesContainer>
      {/* Global overlays: Modals, Lightbox, etc. */}
      <ModalsContainer />
    </View>
  )
}
```

#### 1.4 Clean App.tsx (Day 3)
After extraction, `App.tsx` should only contain providers:

**Target App.tsx (~80 lines):**
```tsx
// App.tsx
import {Shell} from './src/view/shell'
import {ThemeProvider} from './src/ui'

export default function App() {
  // Initialize stores
  useInitializeAuth()
  useInitializeAdmin()
  useInitializeDataCache()
  useInitializeLocation()
  
  // Font loading...
  const [fontsLoaded] = useFonts({...})
  
  if (!fontsLoaded) {
    return <SplashScreen />
  }
  
  return (
    <ThemeProvider theme="light">
      <Shell />
    </ThemeProvider>
  )
}
```

### Phase 1 Deliverables
- [x] Types split into 7 files
- [x] `src/Navigation.tsx` created with all navigation logic
- [x] `src/view/shell/` structure created  
- [x] App.tsx reduced from 333 lines to ~80 lines
- [ ] All existing functionality preserved

---

## Phase 2: Design System - UI Layer (Week 2)

### Goal
Create a style system (NOT component library) inspired by Bluesky's ALF pattern.

> **Important:** In Bluesky, ALF is a **style system** with atoms (like Tailwind), NOT a component library. Components live in `src/components/`. We name our folder `ui/` instead of `alf/` for clarity.

### Tasks

#### 2.1 Create UI Structure (Day 1)

```
src/ui/
├── index.tsx               # ThemeProvider, useTheme exports
├── atoms.ts                # Style primitives (a.flex_row, a.p_md, etc.)
├── themes.ts               # Light/Dark theme definitions
├── tokens.ts               # Design tokens (colors, spacing values)
├── fonts.ts                # Font scale configuration
├── breakpoints.ts          # Responsive breakpoints (gtMobile, gtTablet)
└── util/
    ├── flatten.ts          # Style flattening utility
    ├── platform.ts         # Platform-specific utilities
    └── useGutters.ts       # Gutter spacing hook
```

**Atoms example (Bluesky pattern):**
```tsx
// src/ui/atoms.ts
import {StyleSheet} from 'react-native'

export const atoms = StyleSheet.create({
  // Flexbox
  flex_row: {flexDirection: 'row'},
  flex_col: {flexDirection: 'column'},
  flex_1: {flex: 1},
  flex_wrap: {flexWrap: 'wrap'},
  
  // Alignment
  align_center: {alignItems: 'center'},
  justify_center: {justifyContent: 'center'},
  justify_between: {justifyContent: 'space-between'},
  
  // Spacing (based on 4px grid)
  gap_xs: {gap: 4},
  gap_sm: {gap: 8},
  gap_md: {gap: 12},
  gap_lg: {gap: 16},
  gap_xl: {gap: 20},
  
  p_xs: {padding: 4},
  p_sm: {padding: 8},
  p_md: {padding: 12},
  p_lg: {padding: 16},
  p_xl: {padding: 20},
  
  // ... more atoms
})
```

**Theme structure (Bluesky pattern):**
```tsx
// src/ui/themes.ts
export const themes = {
  light: {
    name: 'light',
    palette: {
      primary: '#0066FF',
      background: '#FFFFFF',
      text: '#000000',
      // ...
    },
    atoms: {
      bg: {backgroundColor: '#FFFFFF'},
      text: {color: '#000000'},
      border: {borderColor: '#E5E5E5'},
      // ...
    },
  },
  dark: {
    // ...
  },
}

// src/ui/index.tsx
export function useTheme() {
  const ui = useUI()
  return ui.theme
}

// Usage in components:
// import {atoms as a, useTheme} from '#/ui'
// const t = useTheme()
// <View style={[a.flex_row, a.p_md, t.atoms.bg]} />
```

#### 2.2 Create Components Directory (Day 2-3)

Components are **separate from the style system** (Bluesky pattern):

```
src/components/
├── Button.tsx              # Button with variants
├── Typography.tsx          # Text, H1, H2, P components
├── Loader.tsx              # Loading indicator
├── Divider.tsx             # Horizontal divider
├── Layout/                 # Layout system
│   ├── index.tsx           # Screen, Content exports
│   ├── Header.tsx          # Header components
│   └── README.md           # Documentation
├── forms/                  # Form components
│   ├── TextField.tsx
│   ├── Toggle.tsx
│   └── SearchInput.tsx
├── dialogs/                # Dialog/Modal components
│   └── ...
├── icons/                  # Icon components
│   └── ...
└── cards/                  # Card components (ImHungry specific)
    ├── DealCard.tsx
    ├── RowCard.tsx
    └── SquareCard.tsx
```

**Layout component (Bluesky pattern):**
```tsx
// src/components/Layout/index.tsx
import {atoms as a, useTheme} from '#/ui'

export const Screen = ({children, style}) => {
  const {top} = useSafeAreaInsets()
  return (
    <View style={[a.flex_1, {paddingTop: top}, style]}>
      {children}
    </View>
  )
}

export const Content = ({children}) => (
  <ScrollView contentContainerStyle={[a.p_md]}>
    {children}
  </ScrollView>
)

// Header sub-components
export const Header = {
  Outer: ({children}) => <View style={[a.flex_row, a.p_md]}>{children}</View>,
  BackButton: () => <Pressable onPress={goBack}><ArrowLeft /></Pressable>,
  TitleText: ({children}) => <Text style={[a.text_lg, a.font_bold]}>{children}</Text>,
}
```

#### 2.3 Component Migration Map

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/components/DealCard.tsx` | `src/components/cards/DealCard.tsx` | Use ui atoms |
| `src/components/RowCard.tsx` | `src/components/cards/RowCard.tsx` | Use ui atoms |
| `src/components/SquareCard.tsx` | `src/components/cards/SquareCard.tsx` | Use ui atoms |
| `src/components/Header.tsx` | `src/components/Layout/Header.tsx` | Layout pattern |
| `src/components/DealCardSkeleton.tsx` | `src/components/Skeleton.tsx` | Unified skeleton |
| `src/components/RowCardSkeleton.tsx` | `src/components/Skeleton.tsx` | Unified skeleton |
| `src/components/OptimizedImage.tsx` | `src/components/Image.tsx` | ✅ Migrated |
| `src/components/VoteButtons.tsx` | `src/components/VoteButtons.tsx` | Keep, use ui atoms |
| `src/components/CuisineFilter.tsx` | `src/components/CuisineFilter.tsx` | Keep, use ui atoms |

#### 2.4 Usage Pattern

```tsx
// Before (current)
import { StyleSheet } from 'react-native'
const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 16, backgroundColor: '#fff' }
})
<View style={styles.container}>

// After (Bluesky pattern with our ui folder)
import { atoms as a, useTheme } from '#/ui'
const t = useTheme()
<View style={[a.flex_row, a.p_lg, t.atoms.bg]}>
```

### Phase 2 Deliverables
- [x] `src/ui/` folder structure created
- [x] 10+ components migrated to use ui atoms
- [x] Theme system established
- [ ] All imports updated (ongoing - gradual migration)

---

## Phase 3: Server State with React Query (Week 3)

### Goal
Move data fetching logic out of services into cached hooks.

### Tasks

#### 3.1 Install Dependencies
```bash
npm install @tanstack/react-query
```

#### 3.2 Create Query Structure
```
src/state/
├── queries/
│   ├── QueryProvider.tsx       # TanStack QueryClient setup
│   ├── deals/
│   │   ├── useDealsQuery.ts    # Wraps dealService.getDeals()
│   │   ├── useDealQuery.ts     # Single deal fetch
│   │   └── useDealMutations.ts # Create/Update/Delete
│   ├── restaurants/
│   │   ├── useRestaurantsQuery.ts
│   │   └── useRestaurantQuery.ts
│   ├── profile/
│   │   ├── useProfileQuery.ts
│   │   └── useProfileMutations.ts
│   └── index.ts
└── context/                    # React Context for local state (replacing Zustand)
    ├── AuthContext.tsx         # Auth state (migrate from AuthStore)
    ├── LocationContext.tsx     # Location state (migrate from LocationStore)
    ├── AdminContext.tsx        # Admin state (migrate from AdminStore)
    └── index.ts
```

> **Note:** We are migrating from Zustand to React Context to match Bluesky's pattern. TanStack React Query handles server state, while React Context handles local state.

#### 3.3 Query Hook Examples

**Before (in component):**
```tsx
const [deals, setDeals] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDeals = async () => {
    const data = await dealService.getDeals();
    setDeals(data);
    setLoading(false);
  };
  fetchDeals();
}, []);
```

**After (with React Query):**
```tsx
const { data: deals, isLoading } = useDealsQuery({ cuisineId, location });
```

#### 3.4 Service to Query Migration Map

| Service File | Query Hook | Notes |
|--------------|------------|-------|
| `dealService.ts` | `useDealsQuery`, `useDealMutations` | Main feed data |
| `feedService.ts` | `useFeedQuery` | Feed-specific logic |
| `discoverService.ts` | `useDiscoverQuery` | Discovery feed |
| `restaurantService.ts` | `useRestaurantsQuery` | Restaurant search |
| `favoritesService.ts` | `useFavoritesQuery` | User favorites |
| `profileLoadingService.ts` | `useProfileQuery` | Profile data |
| `userPostsService.ts` | `useUserPostsQuery` | User's deals |
| `adminService.ts` | `useAdminQueries` | Admin data |

### Phase 3 Deliverables
- [x] React Query installed and configured
- [x] QueryProvider wrapping app (in Shell)
- [x] 8+ query hooks created (deals, profile, restaurants, favorites, admin, blocked users)
- [x] Feed.tsx refactored to use useFeedQuery (Bluesky pattern: React Query + realtime invalidation)
- [x] DiscoverFeed.tsx refactored to use useRestaurantsQuery
- [x] FavoritesPage.tsx refactored to use useFavoritesPageQuery
- [x] CommunityUploadedScreen.tsx refactored to use useFeedQuery (shares cache with Feed)
- [x] BlockedUsersPage.tsx refactored to use useBlockedUsersQuery
- [x] Admin query hooks created (useAdminDealsQuery, useAdminUsersQuery, useAdminReportsQuery)
- [ ] Profile hook (useProfile) migration to React Query (pending - complex, uses ProfileCacheService)
- [ ] Admin screens migration to use admin queries (pending)

---

## Phase 4: Feature Grouping (Week 4)

### Goal
Eliminate the flat `src/screens/` structure by grouping by feature.

### Tasks

#### 4.1 Feature Structure Template
Each feature follows this pattern:
```
src/features/[feature]/
├── index.ts              # Public exports
├── screens/              # Feature screens
├── components/           # Feature-specific components
├── hooks/                # Feature-specific hooks
└── utils/                # Feature utilities
```

#### 4.2 Auth Feature
```
src/features/auth/
├── index.ts
├── screens/
│   ├── LandingScreen.tsx
│   ├── SignUp.tsx
│   ├── LogIn.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── UsernameScreen.tsx
│   ├── ProfilePhoto.tsx
│   ├── LocationPermissions.tsx
│   ├── InstantNotifications.tsx
│   └── CuisinePreferences.tsx
├── components/
│   └── AuthGuard.tsx
├── hooks/
│   └── useAuth.ts
└── stores/
    └── AuthStore.ts
```

**Files to Move:**
- `src/screens/onboarding/*` → `src/features/auth/screens/`
- `src/components/AuthGuard.tsx` → `src/features/auth/components/`
- `src/hooks/useAuth.ts` → `src/features/auth/hooks/`
- `src/stores/AuthStore.tsx` → `src/features/auth/stores/`

#### 4.3 Deals Feature
```
src/features/deals/
├── index.ts
├── screens/
│   ├── Feed.tsx
│   ├── DealDetailScreen.tsx
│   ├── CommunityUploadedScreen.tsx
│   ├── ReportContentScreen.tsx
│   └── BlockUserScreen.tsx
├── components/
│   ├── FeedTabNavigator.tsx
│   └── ThreeDotPopup.tsx
├── hooks/
│   └── useDealUpdate.ts
└── stores/
    └── DealUpdateStore.ts
```

#### 4.4 Discover Feature
```
src/features/discover/
├── index.ts
├── screens/
│   ├── DiscoverFeed.tsx
│   └── RestaurantDetailScreen.tsx
├── components/
│   └── MapSelectionModal.tsx
└── hooks/
    └── useLocation.ts
```

#### 4.5 Profile Feature
```
src/features/profile/
├── index.ts
├── screens/
│   ├── ProfilePage.tsx
│   ├── ProfileEdit.tsx
│   ├── BlockedUsersPage.tsx
│   ├── ContactUsPage.tsx
│   ├── FAQPage.tsx
│   ├── TermsConditionsPage.tsx
│   ├── PrivacyPolicyPage.tsx
│   └── CuisineEdit.tsx
├── hooks/
│   ├── useProfile.ts
│   └── useProfileEdit.ts
└── stores/
    └── FavoritesStore.ts
```

#### 4.6 Admin Feature
```
src/features/admin/
├── index.ts
├── screens/
│   ├── AdminLoginScreen.tsx
│   ├── AdminDashboardScreen.tsx
│   ├── AdminReportsScreen.tsx
│   ├── AdminDealsScreen.tsx
│   ├── AdminUsersScreen.tsx
│   └── AdminMassUploadScreen.tsx
├── hooks/
│   └── useAdmin.ts
└── stores/
    └── AdminStore.ts
```

### Phase 4 Deliverables
- [x] `src/features/` created with feature modules (auth, deals, discover, profile, admin, contribution)
- [x] `src/view/com/` created for shared components (cards/)
- [x] Screen imports updated in Navigation.tsx to use feature paths
- [x] Clean separation between screens and view components
- [x] Feature index files created for clean exports
- [x] Hooks and stores organized within feature modules

---

## Phase 5: Performance Optimization (Week 5)

### Goal
Apply Bluesky's performance patterns.

### Tasks

#### 5.1 Install FlashList
```bash
npm install @shopify/flash-list
```

#### 5.2 FlashList Migration Points
- `src/features/deals/screens/Feed.tsx` - Main feed (horizontal list)
- `src/features/discover/screens/DiscoverFeed.tsx` - Discover feed
- `src/features/profile/screens/FavoritesPage.tsx` - Favorites list
- `src/features/deals/screens/CommunityUploadedScreen.tsx` - Featured deals (2-column grid)

#### 5.3 Image Optimization
Created `src/lib/imagePreloader.ts`:
- Batch preloading for feed images
- Priority-based loading (visible items first)
- Memory-efficient with preload tracking
- Integrated into React Query hooks

### Phase 5 Deliverables
- [x] FlashList installed (@shopify/flash-list v2.2.0)
- [x] 4 lists converted to FlashList (Feed horizontal, DiscoverFeed, FavoritesPage, CommunityUploaded)
- [x] Image preloading utility created (`src/lib/imagePreloader.ts`)
- [x] Image preloading integrated into useFeedQuery, useFavoritesPageQuery, useRestaurantsQuery

> **Note on FlashList v2:** The `estimatedItemSize` prop has been removed in v2.2.0. FlashList now auto-calculates item sizes. For horizontal lists, a wrapper View with explicit height is still required.

---

## File Migration Summary

### Files to Create (New)
| Path | Purpose |
|------|---------|
| `src/Navigation.tsx` | Main navigation config (at src root) |
| `src/view/shell/index.tsx` | App shell |
| `src/view/shell/TabBar.tsx` | Custom tab bar |
| `src/ui/index.tsx` | Theme provider, useTheme |
| `src/ui/atoms.ts` | Style primitives |
| `src/ui/themes.ts` | Theme definitions |
| `src/ui/tokens.ts` | Design tokens |
| `src/state/queries/*.ts` | TanStack React Query hooks |
| `src/state/context/*.tsx` | React Context providers (local state) |
| `src/types/*.ts` | Split type files |
| `src/components/Layout/*.tsx` | Layout system |

### Files to Move
| From | To |
|------|-----|
| `src/screens/onboarding/*` | `src/screens/Onboarding/` |
| `src/screens/profile/*` | `src/screens/Profile/` + `src/screens/Settings/` |
| `src/screens/admin/*` | `src/screens/Admin/` |
| `src/screens/deal_feed/Feed.tsx` | `src/view/screens/Home.tsx` |
| `src/screens/discover_feed/*` | `src/view/screens/Discover.tsx` |
| `src/screens/favorites/*` | `src/view/screens/Favorites.tsx` |
| `src/stores/*.ts` | `src/state/stores/` |
| `src/components/DealCard.tsx` | `src/components/cards/DealCard.tsx` |
| `src/components/*Skeleton.tsx` | `src/components/Skeleton.tsx` |

### Files to Delete (After Migration)
- `src/context/` (replaced by state/shell)
- Old flat screen folders (after reorganization)

---

## Risk Mitigation

### Testing Strategy
1. **After each phase:** Run full app test on iOS simulator
2. **Before merging:** Test all user flows:
   - Onboarding (new user)
   - Login (existing user)
   - Feed browsing
   - Deal creation
   - Profile editing
   - Admin functions

### Rollback Plan
- Create git branch per phase
- Tag stable points before major changes
- Keep old imports working until migration complete

### Import Alias Strategy (Bluesky Pattern)
Update `tsconfig.json` for cleaner imports using `#/` prefix:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "#/*": ["./src/*"]
    }
  }
}
```

**Usage:**
```tsx
// Before
import {atoms} from '../../../ui'
import {useDealsQuery} from '../../../state/queries/deals'

// After (Bluesky-style with #/ prefix)
import {atoms as a, useTheme} from '#/ui'
import {useDealsQuery} from '#/state/queries/deals'
```

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 1 | 3 days | Clean App.tsx, Navigation.tsx, Shell |
| Phase 2 | 5 days | ALF Style System + Components |
| Phase 3 | 5 days | React Query + State restructure |
| Phase 4 | 5 days | Screen Organization |
| Phase 5 | 3 days | FlashList Performance |
| **Total** | **~4-5 weeks** | **Complete Architecture** |

---

## Summary: Key Bluesky Patterns

1. **UI = Style System** (NOT components)
   - `atoms` for Tailwind-like styles
   - `themes` for light/dark mode
   - Components are in separate `src/components/`
   - We call it `src/ui/` (Bluesky calls it `src/alf/`)

2. **Navigation at src root**
   - Single `src/Navigation.tsx` file
   - `commonScreens()` function for shared screens
   - `RoutesContainer` wraps everything

3. **State management**
   - `src/state/queries/` for TanStack React Query (server state)
   - `src/state/context/` for React Context (local state)
   - **NOT Zustand** - Bluesky uses React Context
   - Services stay for API calls (queries wrap them)

4. **Screen organization**
   - `src/screens/` for grouped screen folders
   - `src/view/screens/` for main tab screens
   - `src/view/com/` for shared view components

5. **Import pattern**
   - Use `#/` prefix for absolute imports
   - `atoms as a` naming convention
   - `const t = useTheme()` for theme

---

## Ready to Begin?

Phase 1 will start with:
1. Creating the `src/types/` split files
2. Creating `src/Navigation.tsx` at src root
3. Creating `src/view/shell/` structure
4. Refactoring `App.tsx`

> **State Migration Note:** Phase 3 will migrate Zustand stores to React Context. This aligns with Bluesky's pattern where they use:
> - **TanStack React Query** for server state (API data fetching, caching, mutations)
> - **React Context** for local state (auth, session, preferences, UI state)

**Shall I proceed with Phase 1 implementation?**
