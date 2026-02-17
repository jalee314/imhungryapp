/**
 * @file Profile feature barrel export
 *
 * Public API for the profile feature module.
 */

// Container (the composed screen)
export { default as ProfileContainer } from './ProfileContainer';

// Sub-hooks (for consumers that need fine-grained access)
export {
  useProfileData,
  useProfilePosts,
  useProfileInteractions,
  useProfileActions,
  useProfileModals,
} from './hooks';

// Section components
export {
  ProfileSkeleton,
  ProfileHeaderSection,
  ProfileTabBar,
  ProfilePostsSection,
  ProfileSettingsSection,
  LogoutModal,
  DeleteAccountModal,
} from './sections';

// Types
export type {
  ProfileParams,
  ProfileDataState,
  ProfileDataActions,
  ProfilePostsState,
  ProfilePostsActions,
  ProfileInteractionHandlers,
  ProfileActionHandlers,
  ProfileModalState,
  ProfileModalHandlers,
  UseProfileResult,
} from './types';
