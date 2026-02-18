import type { UserPost } from './user';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorType?: 'EMAIL_NOT_FOUND' | 'SUPABASE_ERROR' | 'UNKNOWN_ERROR';
}

export interface ProfileLoadingResult {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  userData: {
    username: string;
    profilePicture: string | null;
    city: string;
    state: string;
  };
  userPosts: UserPost[];
  currentUserPhotoUrl?: string | null;
}

export interface CuisineUpdateResult {
  success: boolean;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
  summary: string;
  details: Array<{
    restaurant_id: string;
    name: string;
    google_place_id: string | null;
    types: string[];
    detected_cuisine: string | null;
    updated: boolean;
  }>;
}
