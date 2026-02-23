import { supabase } from '../../lib/supabase';

const USER_CACHE_TTL_MS = process.env.NODE_ENV === 'test' ? 0 : 5000;

interface CurrentUserCacheEntry {
  userId: string | null;
  fetchedAt: number;
}

let cachedUser: CurrentUserCacheEntry | null = null;
let inflightUserRequest: Promise<string | null> | null = null;
let authListenerInitialized = false;

const isCacheFresh = (entry: CurrentUserCacheEntry | null): boolean => {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < USER_CACHE_TTL_MS;
};

const readCurrentUserId = async (): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[currentUserService] Failed to fetch current user:', error);
    return null;
  }
};

export const getCurrentUserId = async (options?: {
  forceRefresh?: boolean;
}): Promise<string | null> => {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && isCacheFresh(cachedUser)) {
    return cachedUser?.userId ?? null;
  }

  if (!forceRefresh && inflightUserRequest) {
    return inflightUserRequest;
  }

  inflightUserRequest = readCurrentUserId()
    .then((userId) => {
      cachedUser = {
        userId,
        fetchedAt: Date.now(),
      };
      return userId;
    })
    .finally(() => {
      inflightUserRequest = null;
    });

  return inflightUserRequest;
};

export const clearCurrentUserCache = (): void => {
  cachedUser = null;
  inflightUserRequest = null;
};

const initializeAuthStateListener = (): void => {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  if (typeof supabase.auth.onAuthStateChange !== 'function') {
    return;
  }

  supabase.auth.onAuthStateChange(() => {
    clearCurrentUserCache();
  });
};

initializeAuthStateListener();
