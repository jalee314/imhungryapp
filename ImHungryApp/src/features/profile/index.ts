/**
 * Profile Feature - Public API
 * 
 * @example
 * import { useProfile, ProfileHeader } from '@/features/profile';
 */

// Hooks
export { useProfile, type UseProfileParams, type UseProfileResult } from './hooks/useProfile';

// Components
export {
  DeleteAccountModal,
  LogoutModal,
  ProfileHeader,
  ProfileTabs,
  SettingsList,
  PostsGrid,
} from './components';

// Types
export type {
  UserProfile,
  UserDisplayData,
  UserPost,
  UserProfileData,
  UserProfileCache,
  ProfileLoadingResult,
} from './types';
