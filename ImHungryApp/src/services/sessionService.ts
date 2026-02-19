import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AppState, AppStateStatus } from 'react-native';

// Cache keys
const AUTH_SESSION_KEY = 'supabase_auth_session';
const DB_SESSION_ID_KEY = 'current_db_session_id';
const DB_SESSION_START_KEY = 'db_session_start_time';

/**
 * Get app version
 */
const getAppVersion = (): string => {
  return '1.0.0';
};

/**
 * Map Platform.OS to database enum (iOS, Android, Web)
 */
const getDeviceType = (): 'iOS' | 'Android' | 'Web' => {
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'android') return 'Android';
  return 'Web';
};

/**
 * Get OS version
 */
const getOSVersion = (): string => {
  if (Platform.OS === 'ios') return `iOS ${Platform.Version}`;
  if (Platform.OS === 'android') return `Android ${Platform.Version}`;
  return 'Unknown';
};

/**
 * Initialize Supabase auth session from cache (for staying logged in)
 */
export const initializeAuthSession = async (): Promise<boolean> => {
  try {
    // Check if there's an existing Supabase session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting auth session:', error);
      return false;
    }

    if (session) {
      console.log('✅ User is logged in:', session.user.email);

      // Create or resume database session for analytics
      await createDatabaseSession();

      return true;
    } else {
      console.log('❌ No active auth session');
      return false;
    }
  } catch (error) {
    console.error('Error initializing auth session:', error);
    return false;
  }
};

/**
 * Create a new database session for tracking user activity
 */
const createDatabaseSession = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found, cannot create database session');
      return null;
    }

    // Check if we have a recent session we can reuse
    const cachedSessionId = await AsyncStorage.getItem(DB_SESSION_ID_KEY);
    const sessionStartTime = await AsyncStorage.getItem(DB_SESSION_START_KEY);

    if (cachedSessionId && sessionStartTime) {
      const sessionAge = Date.now() - parseInt(sessionStartTime);
      const thirtyMinutes = 30 * 60 * 1000;

      if (sessionAge < thirtyMinutes) {
        console.log('📱 Reusing existing session:', cachedSessionId);
        return cachedSessionId;
      } else {
        // Session expired, end it
        await endDatabaseSession(cachedSessionId);
      }
    }

    // Create new database session
    const { data, error } = await supabase
      .from('session')
      .insert({
        user_id: user.id,
        start_time: new Date().toISOString(),
        device_type: getDeviceType(),
        app_version: getAppVersion(),
        os_version: getOSVersion(),
      })
      .select('session_id')
      .single();

    if (error) {
      console.error('Error creating database session:', error);
      return null;
    }

    // Cache the session
    await AsyncStorage.setItem(DB_SESSION_ID_KEY, data.session_id);
    await AsyncStorage.setItem(DB_SESSION_START_KEY, Date.now().toString());

    console.log('✅ New database session created:', data.session_id);
    return data.session_id;
  } catch (error) {
    console.error('Error in createDatabaseSession:', error);
    return null;
  }
};

/**
 * Get current database session ID (creates new if needed)
 */
export const getCurrentDatabaseSessionId = async (): Promise<string | null> => {
  try {
    // Check cache first
    const cachedSessionId = await AsyncStorage.getItem(DB_SESSION_ID_KEY);
    const sessionStartTime = await AsyncStorage.getItem(DB_SESSION_START_KEY);

    if (cachedSessionId && sessionStartTime) {
      const sessionAge = Date.now() - parseInt(sessionStartTime);
      const thirtyMinutes = 30 * 60 * 1000;

      if (sessionAge < thirtyMinutes) {
        return cachedSessionId;
      }
    }

    // Create new session
    return await createDatabaseSession();
  } catch (error) {
    console.error('Error getting database session:', error);
    return null;
  }
};

/**
 * End the current database session
 */
const endDatabaseSession = async (sessionId?: string): Promise<void> => {
  try {
    const sessionIdToEnd = sessionId || await AsyncStorage.getItem(DB_SESSION_ID_KEY);
    if (!sessionIdToEnd) return;

    await supabase
      .from('session')
      .update({ end_time: new Date().toISOString() })
      .eq('session_id', sessionIdToEnd);

    await AsyncStorage.removeItem(DB_SESSION_ID_KEY);
    await AsyncStorage.removeItem(DB_SESSION_START_KEY);

    console.log('📱 Database session ended:', sessionIdToEnd);
  } catch (error) {
    console.error('Error ending database session:', error);
  }
};

/**
 * Sign out and clean up all sessions
 */
export const signOut = async (): Promise<void> => {
  try {
    // End database session
    await endDatabaseSession();

    // Sign out from Supabase auth
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }

    // Clear auth cache
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);

    console.log('✅ Signed out successfully');
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
};

/**
 * Setup app state listener to manage sessions
 */
export const setupAppStateListener = (): (() => void) => {
  let lastState: AppStateStatus = AppState.currentState;

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // Only log when transitioning to background (not inactive)
    // This prevents duplicate logs since iOS fires both 'inactive' and 'background'
    if (nextAppState === 'background' && lastState !== 'background') {
      console.log('📱 App going to background - ending session');
      await endDatabaseSession();
    } else if (nextAppState === 'active' && lastState !== 'active') {
      console.log('📱 App coming to foreground - creating session');
      const isAuth = await isAuthenticated();
      if (isAuth) {
        await createDatabaseSession();
      }
    }

    lastState = nextAppState;
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
    endDatabaseSession();
  };
};
