# ImHungry App - Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Architectural Layers](#architectural-layers)
3. [Design Patterns](#design-patterns)
4. [Directory Structure](#directory-structure)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)

---

## Overview

ImHungry follows a **layered architecture** pattern that separates concerns into distinct layers. This architecture promotes:

- **Maintainability**: Clear separation makes code easier to understand and modify
- **Scalability**: New features can be added without affecting existing code
- **Testability**: Each layer can be tested independently
- **Reusability**: Logic can be shared across multiple components
- **Type Safety**: Full TypeScript support throughout the application

### Architecture Philosophy

> **"Screens should be dumb, hooks should be smart, services should be simple."**

- **Screens**: Pure presentation - render UI based on props and emit user actions
- **Hooks**: Business logic orchestration - manage state and coordinate between services
- **Services**: Data access abstraction - handle API calls and data transformations

---

## Architectural Layers

### Layer 1: UI Layer (Screens & Components)

**Location**: `src/screens/`, `src/components/`

**Responsibility**: Render the user interface and handle user interactions

**Characteristics**:
- Presentational/stateless when possible
- Receive data via props
- Delegate actions via callbacks
- No direct API calls
- No complex business logic

**Example**:
```typescript
// src/screens/deal_feed/Feed.tsx
const Feed: React.FC = () => {
  const {
    deals,
    loading,
    handleUpvote,
    handleFavorite,
  } = useDeals();

  return (
    <FlatList
      data={deals}
      renderItem={({ item }) => (
        <DealCard
          deal={item}
          onUpvote={handleUpvote}
          onFavorite={handleFavorite}
        />
      )}
      refreshing={loading}
    />
  );
};
```

---

### Layer 2: Business Logic Layer (Custom Hooks)

**Location**: `src/hooks/`

**Responsibility**: Encapsulate feature-specific business logic and state management

**Characteristics**:
- Manage local component state
- Orchestrate service calls
- Update global stores
- Handle complex logic
- Expose clean APIs to UI components

**Available Hooks**:
- `useAuth.ts` - Authentication logic (login, signup, session management)
- `useDeals.ts` - Deal fetching, filtering, and interactions
- `useFavorites.ts` - Favorites management (add, remove, sync)
- `useLocationHook.ts` - Location services and permissions

**Example**:
```typescript
// src/hooks/useDeals.ts
export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedCoordinates } = useLocation();

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await dealService.fetchDeals(selectedCoordinates);
      setDeals(data);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (dealId: string) => {
    await voteService.upvote(dealId);
    await loadDeals(); // Refresh data
  };

  return { deals, loading, loadDeals, handleUpvote };
};
```

---

### Layer 3: State Management (Zustand Stores)

**Location**: `src/store/`

**Responsibility**: Manage global application state

**Why Zustand?**
- Simpler API than Redux
- Better performance than React Context
- No boilerplate code
- Built-in TypeScript support
- Works seamlessly with hooks

**Available Stores**:
- `authStore.ts` - User authentication state
- `favoritesStore.ts` - Favorites state and optimistic updates
- `locationStore.ts` - User location and permissions

**Example**:
```typescript
// src/store/authStore.ts
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  signOut: async () => {
    await authService.signOut();
    set({ isAuthenticated: false, user: null });
  },
}));
```

**Usage in Components**:
```typescript
const { isAuthenticated, user, signOut } = useAuthStore();
```

---

### Layer 4: Data Access Layer (Services)

**Location**: `src/services/`

**Responsibility**: Abstract all external API calls and data transformations

**Characteristics**:
- Single source of truth for API interactions
- Handle data transformation and normalization
- Manage caching strategies
- Error handling and retry logic
- No UI concerns

**Available Services**:

| Service | Responsibility |
|---------|---------------|
| `authService.ts` | Authentication API calls |
| `dealService.ts` | Deal CRUD operations |
| `favoritesService.ts` | Favorites API and caching |
| `locationService.ts` | Location/geocoding APIs |
| `voteService.ts` | Upvote/downvote operations |
| `restaurantService.ts` | Restaurant data fetching |
| `userService.ts` | User profile operations |
| `adminService.ts` | Admin panel operations |

**Example**:
```typescript
// src/services/dealService.ts
export const dealService = {
  async fetchDeals(coordinates: Coordinates): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*, restaurants(*), users(*)')
      .gte('latitude', coordinates.latitude)
      .lte('latitude', coordinates.latitude + 0.1);

    if (error) throw error;
    
    return data.map(transformDealData);
  },

  async createDeal(dealData: CreateDealInput): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .insert(dealData)
      .select()
      .single();

    if (error) throw error;
    return transformDealData(data);
  },
};
```

---

### Layer 5: External APIs (Supabase)

**Location**: `lib/supabase.ts`

**Responsibility**: Configure and initialize external services

**Example**:
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

---

## Design Patterns

### 1. Custom Hooks Pattern

Custom hooks encapsulate reusable logic:

```typescript
// Pattern
export const useFeature = () => {
  // 1. Import dependencies
  const store = useStore();
  
  // 2. Local state
  const [data, setData] = useState([]);
  
  // 3. Effects
  useEffect(() => {
    loadData();
  }, []);
  
  // 4. Logic functions
  const loadData = async () => {
    const result = await service.fetch();
    setData(result);
  };
  
  // 5. Return API
  return { data, loading, loadData };
};
```

### 2. Service Layer Pattern

Services provide a clean API abstraction:

```typescript
// Pattern
export const featureService = {
  async fetchItems(): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  async createItem(input: CreateInput): Promise<Item> {
    // Implementation
  },
  
  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    // Implementation
  },
};
```

### 3. Store Pattern (Zustand)

Stores manage global state:

```typescript
// Pattern
interface FeatureState {
  data: Data | null;
  isLoading: boolean;
  actions: {
    setData: (data: Data) => void;
    reset: () => void;
  };
}

export const useFeatureStore = create<FeatureState>((set) => ({
  data: null,
  isLoading: false,
  
  actions: {
    setData: (data) => set({ data }),
    reset: () => set({ data: null, isLoading: false }),
  },
}));
```

---

## Directory Structure

```
ImHungryApp/
│
├── src/
│   │
│   ├── components/              # Reusable UI components
│   │   ├── AuthGuard.tsx        # Protected route wrapper
│   │   ├── BottomNavigation.tsx # Tab bar component
│   │   ├── DealCard.tsx         # Deal display component
│   │   ├── DealCardSkeleton.tsx # Loading skeleton
│   │   ├── CuisineFilter.tsx    # Cuisine filter UI
│   │   ├── LocationModal.tsx    # Location selection modal
│   │   └── ...
│   │
│   ├── screens/                 # Screen components (UI Layer)
│   │   │
│   │   ├── deal_feed/           # Deal feed screens
│   │   │   ├── Feed.tsx
│   │   │   ├── DealDetailScreen.tsx
│   │   │   └── CommunityUploadedScreen.tsx
│   │   │
│   │   ├── discover_feed/       # Discover/search screens
│   │   │   ├── DiscoverFeed.tsx
│   │   │   └── RestaurantDetailScreen.tsx
│   │   │
│   │   ├── favorites/           # Favorites screens
│   │   │   └── FavoritesPage.tsx
│   │   │
│   │   ├── profile/             # Profile screens
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── ProfileEdit.tsx
│   │   │   └── CuisineEdit.tsx
│   │   │
│   │   ├── onboarding/          # Authentication screens
│   │   │   ├── LandingScreen.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── LogIn.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ...
│   │   │
│   │   └── admin/               # Admin panel screens
│   │       ├── AdminDashboardScreen.tsx
│   │       ├── AdminDealsScreen.tsx
│   │       └── ...
│   │
│   ├── hooks/                   # Custom hooks (Business Logic)
│   │   ├── useAuth.ts           # ✅ Authentication logic
│   │   ├── useDeals.ts          # ✅ Deal management
│   │   ├── useFavorites.ts      # ✅ Favorites logic
│   │   └── useLocationHook.ts   # ✅ Location services
│   │
│   ├── store/                   # Zustand stores (Global State)
│   │   ├── authStore.ts         # ✅ Auth state
│   │   ├── favoritesStore.ts    # ✅ Favorites state
│   │   └── locationStore.ts     # ✅ Location state
│   │
│   ├── services/                # Data access layer
│   │   ├── authService.ts
│   │   ├── dealService.ts
│   │   ├── favoritesService.ts
│   │   ├── locationService.ts
│   │   ├── voteService.ts
│   │   ├── restaurantService.ts
│   │   ├── userService.ts
│   │   ├── adminService.ts
│   │   ├── interactionService.ts
│   │   └── ... (26+ services)
│   │
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Centralized type exports
│   │
│   └── context/                 # Legacy contexts (⚠️ being phased out)
│       ├── AdminContext.tsx     # Still in use
│       ├── DataCacheContext.tsx # Still in use
│       └── DealUpdateContext.tsx # Still in use
│
├── lib/
│   └── supabase.ts             # Supabase client configuration
│
├── assets/                      # Static assets
│   ├── fonts/
│   ├── images/
│   └── ...
│
└── docs/                        # Documentation
    ├── ARCHITECTURE.md          # This file
    ├── ADMIN_PANEL_GUIDE.md
    └── ...
```

---

## State Management

### Local State (useState, useReducer)

Use for component-specific state that doesn't need to be shared:

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
```

### Custom Hooks State

Use for feature-specific state that's shared within a feature:

```typescript
const { deals, loading } = useDeals(); // Shared across deal components
```

### Global State (Zustand Stores)

Use for application-wide state:

```typescript
const { isAuthenticated, user } = useAuthStore(); // Used across entire app
const { currentLocation } = useLocationStore(); // Used by multiple features
```

### When to Use Each?

| State Type | Use When | Example |
|------------|----------|---------|
| Local State | UI-only concerns | Modal open/close, form inputs |
| Hook State | Feature-specific logic | Deal list, filters, pagination |
| Global Store | Cross-feature needs | Auth status, user location, theme |

---

## Data Flow

### 1. User Action Flow

```
User Interaction
    ↓
UI Component (Screen)
    ↓
Custom Hook (useFeature)
    ↓
Service Layer (featureService)
    ↓
External API (Supabase)
    ↓
Service Layer (transform data)
    ↓
Custom Hook (update state)
    ↓
Global Store (if needed)
    ↓
UI Component (re-render)
```

### 2. Authentication Flow Example

```typescript
// 1. User clicks "Login" button
<Button onPress={handleLogin} />

// 2. Screen calls hook method
const { signInWithPassword } = useAuth();
const handleLogin = () => signInWithPassword(email, password);

// 3. Hook calls service
export const useAuth = () => {
  const signInWithPassword = async (email: string, password: string) => {
    const user = await authService.signIn(email, password);
    // Update store
    useAuthStore.getState().setUser(user);
  };
};

// 4. Service calls API
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },
};

// 5. Store updates
export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user, isAuthenticated: true }),
}));

// 6. UI re-renders automatically
const { isAuthenticated } = useAuthStore();
if (isAuthenticated) return <MainApp />;
```

---

## Best Practices

### ✅ DO

1. **Keep screens presentational**
   ```typescript
   // ✅ Good
   const Feed = () => {
     const { deals, handleUpvote } = useDeals();
     return <DealList deals={deals} onUpvote={handleUpvote} />;
   };
   ```

2. **Use custom hooks for logic**
   ```typescript
   // ✅ Good
   export const useDeals = () => {
     const [deals, setDeals] = useState([]);
     // All logic here
     return { deals, loading, refresh };
   };
   ```

3. **Use services for API calls**
   ```typescript
   // ✅ Good
   export const dealService = {
     fetchDeals: async () => {
       const { data } = await supabase.from('deals').select();
       return data;
     },
   };
   ```

4. **Type everything**
   ```typescript
   // ✅ Good
   interface Deal {
     id: string;
     title: string;
     description: string;
   }
   ```

5. **Use Zustand for global state**
   ```typescript
   // ✅ Good
   export const useAuthStore = create<AuthState>((set) => ({
     user: null,
     signOut: () => set({ user: null }),
   }));
   ```

### ❌ DON'T

1. **Don't put logic in screens**
   ```typescript
   // ❌ Bad
   const Feed = () => {
     const [deals, setDeals] = useState([]);
     useEffect(() => {
       supabase.from('deals').select().then(setDeals);
     }, []);
   };
   ```

2. **Don't call Supabase directly from screens**
   ```typescript
   // ❌ Bad
   const handleSave = async () => {
     await supabase.from('deals').insert(dealData);
   };
   ```

3. **Don't use inline styles**
   ```typescript
   // ❌ Bad
   <View style={{ padding: 10, margin: 5 }}>
   
   // ✅ Good
   <View style={styles.container}>
   const styles = StyleSheet.create({
     container: { padding: 10, margin: 5 }
   });
   ```

4. **Don't mix concerns**
   ```typescript
   // ❌ Bad - mixing UI and business logic
   const Component = () => {
     const [data, setData] = useState([]);
     const fetchData = async () => { /* API call */ };
     return <View>{/* UI */}</View>;
   };
   ```

---

## Migration Guide

### Migrating from Context to Zustand

**Before (Context)**:
```typescript
// Old context
const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  
  return (
    <FavoritesContext.Provider value={{ favorites, setFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Usage
const { favorites } = useContext(FavoritesContext);
```

**After (Zustand)**:
```typescript
// New store
export const useFavoritesStore = create((set) => ({
  favorites: [],
  setFavorites: (favorites) => set({ favorites }),
}));

// Usage (no provider needed!)
const { favorites } = useFavoritesStore();
```

### Migrating Logic from Screens to Hooks

**Before**:
```typescript
// Screen with embedded logic
const FeedScreen = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadDeals = async () => {
    setLoading(true);
    const { data } = await supabase.from('deals').select();
    setDeals(data);
    setLoading(false);
  };
  
  return <DealList deals={deals} loading={loading} />;
};
```

**After**:
```typescript
// Extract logic to hook
export const useDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadDeals = async () => {
    setLoading(true);
    const data = await dealService.fetchDeals();
    setDeals(data);
    setLoading(false);
  };
  
  return { deals, loading, loadDeals };
};

// Clean screen
const FeedScreen = () => {
  const { deals, loading } = useDeals();
  return <DealList deals={deals} loading={loading} />;
};
```

---

## Refactoring Checklist

When refactoring a feature, follow this checklist:

- [ ] **Services**: Create/update service methods for API calls
- [ ] **Types**: Define TypeScript interfaces
- [ ] **Store**: Create Zustand store if needed for global state
- [ ] **Hook**: Create custom hook with business logic
- [ ] **Screen**: Simplify screen to only UI and use hook
- [ ] **Remove**: Delete old context if replaced
- [ ] **Test**: Verify functionality works as expected
- [ ] **Document**: Update relevant documentation

---

## Conclusion

This architecture provides:

✅ **Clear Separation of Concerns** - Each layer has a single responsibility  
✅ **Improved Testability** - Layers can be tested independently  
✅ **Better Performance** - Zustand is more efficient than Context  
✅ **Enhanced Maintainability** - Easier to understand and modify  
✅ **Scalability** - New features follow established patterns  
✅ **Type Safety** - TypeScript throughout the stack  

For questions or suggestions, refer to the main [README](../README.md) or create an issue in the repository.
