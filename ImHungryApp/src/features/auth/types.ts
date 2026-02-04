/**
 * Auth Feature Types
 * 
 * Domain-specific types for authentication.
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';

export type AuthUser = SupabaseUser;

export interface AuthContextType {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorType?: 'EMAIL_NOT_FOUND' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export interface OnboardingUserData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  profilePhoto?: string;
  locationCity?: string;
  locationLat?: number;
  locationLong?: number;
}
