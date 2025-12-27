# Features Directory

This directory organizes the app by feature modules, following Bluesky's architecture pattern.

## Structure

Each feature follows a consistent pattern:

```
features/
├── auth/           # Authentication & onboarding flow
├── deals/          # Deal feed, detail, and actions
├── discover/       # Restaurant discovery
├── profile/        # User profile & settings
├── admin/          # Admin dashboard & tools
└── contribution/   # Deal creation flow
```

## Feature Module Pattern

Each feature contains:

```
feature/
├── index.ts        # Public exports
├── screens/        # Feature screens
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
└── stores/         # Feature state (Zustand stores)
```

## Import Pattern

Import from feature modules using the `#/` alias:

```tsx
// Import specific items
import { useAuth } from '#/features/auth'
import { FeedScreen } from '#/features/deals'

// Or import from screens directly
import { LandingScreen } from '#/features/auth/screens/LandingScreen'
```

## Guidelines

1. **Keep features independent** - Avoid circular dependencies between features
2. **Export via index.ts** - All public APIs should be exported from index.ts
3. **Screen-specific components** - Components used by only one screen live with that screen
4. **Shared components** - Components used across features go to `src/components/`
5. **Hooks wrap stores** - Feature hooks provide clean API over Zustand stores
