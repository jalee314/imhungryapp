/**
 * Supabase Mock Utility for Tests
 *
 * Provides a deterministic mock of the Supabase client for testing.
 * All network calls are mocked to prevent actual API requests.
 */

import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Mock user data
export const mockUser: User = {
  id: 'test-user-id-123',
  app_metadata: {},
  user_metadata: {
    display_name: 'Test User',
  },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: 'test@example.com',
  phone: '',
  confirmed_at: '2026-01-01T00:00:00.000Z',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  last_sign_in_at: '2026-01-01T00:00:00.000Z',
  role: 'authenticated',
  updated_at: '2026-01-01T00:00:00.000Z',
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Auth state change listeners
type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;
const authListeners: AuthListener[] = [];

// Mock query builder for chained calls
const createMockQueryBuilder = (data: unknown[] = [], error: Error | null = null) => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: data[0] ?? null, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data: data[0] ?? null, error }),
    then: jest.fn((resolve) => resolve({ data, error })),
  };

  // Make the builder thenable for async/await
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: { data: unknown[]; error: Error | null }) => void) =>
      Promise.resolve({ data, error }).then(resolve),
  });

  return builder;
};

// Mock storage bucket
const createMockStorageBucket = () => ({
  upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
  download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
  remove: jest.fn().mockResolvedValue({ data: null, error: null }),
  list: jest.fn().mockResolvedValue({ data: [], error: null }),
  getPublicUrl: jest.fn().mockReturnValue({
    data: { publicUrl: 'https://mock-storage.supabase.co/mock-path' },
  }),
  createSignedUrl: jest.fn().mockResolvedValue({
    data: { signedUrl: 'https://mock-storage.supabase.co/signed/mock-path' },
    error: null,
  }),
});

// Create the mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    }),
    signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    onAuthStateChange: jest.fn((callback: AuthListener) => {
      authListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(() => {
              const index = authListeners.indexOf(callback);
              if (index > -1) authListeners.splice(index, 1);
            }),
          },
        },
      };
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null,
    }),
  },

  from: jest.fn((table: string) => createMockQueryBuilder()),

  storage: {
    from: jest.fn((bucket: string) => createMockStorageBucket()),
    listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
    createBucket: jest.fn().mockResolvedValue({ data: null, error: null }),
    deleteBucket: jest.fn().mockResolvedValue({ data: null, error: null }),
  },

  functions: {
    invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
  },

  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),

  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
    unsubscribe: jest.fn(),
  })),

  removeChannel: jest.fn(),
  removeAllChannels: jest.fn(),
});

// Singleton mock instance
export const mockSupabase = createMockSupabaseClient();

// Helper to simulate auth state changes
export const simulateAuthStateChange = (
  event: AuthChangeEvent,
  session: Session | null
) => {
  authListeners.forEach((listener) => listener(event, session));
};

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  authListeners.length = 0;

  // Reset auth mocks
  Object.values(mockSupabase.auth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as jest.Mock).mockClear();
    }
  });

  // Reset other mocks
  mockSupabase.from.mockClear();
  mockSupabase.rpc.mockClear();
  mockSupabase.storage.from.mockClear();
};

// Helper to configure mock responses
export const configureMockQuery = (
  table: string,
  data: unknown[],
  error: Error | null = null
) => {
  mockSupabase.from.mockImplementation((t: string) => {
    if (t === table) {
      return createMockQueryBuilder(data, error);
    }
    return createMockQueryBuilder();
  });
};

// Helper to configure authenticated state
export const configureMockAuth = (
  user: User | null = mockUser,
  session: Session | null = mockSession
) => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session },
    error: null,
  });
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
};
