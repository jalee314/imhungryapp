/**
 * @file useProfileActions — Edit profile, photo upload, share, back, tab-reselect.
 */

import { Alert, Share } from 'react-native';

import {
  uploadProfilePhoto,
  handleTakePhoto,
  handleChooseFromLibrary,
} from '../../../services/profileActionsService';
import {
  getDisplayName,
  showProfilePhotoOptions,
} from '../../../services/profileUtilsService';
import type { UserPost } from '../../../services/userPostsService';
import type { ProfileRecord, ProfileUserData } from '../../../services/userProfileService';
import { logger } from '../../../utils/logger';
import type { ProfileActionHandlers, ProfileNavigation } from '../types';

// ============================================================================
// Hook
// ============================================================================

export interface UseProfileActionsParams {
  navigation: ProfileNavigation;
  profile: ProfileRecord | null;
  userData: ProfileUserData | null;
  photoUrl: string | null;
  viewUser: boolean | undefined;
  setProfile: React.Dispatch<React.SetStateAction<ProfileRecord | null>>;
  setPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentUserPhotoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setUserData: React.Dispatch<React.SetStateAction<ProfileUserData | null>>;
  setDealCount: React.Dispatch<React.SetStateAction<number>>;
  setHasData: React.Dispatch<React.SetStateAction<boolean>>;
  setUserPosts: React.Dispatch<React.SetStateAction<UserPost[]>>;
  setPostsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  refreshProfile: () => Promise<void>;
  loadProfileData: () => Promise<void>;
}

export function useProfileActions({
  navigation,
  profile,
  userData,
  photoUrl: _photoUrl,
  viewUser,
  setProfile,
  setPhotoUrl,
  setCurrentUserPhotoUrl,
  setUserData,
  setDealCount,
  setHasData,
  setUserPosts,
  setPostsInitialized,
  refreshProfile,
  loadProfileData,
}: UseProfileActionsParams): ProfileActionHandlers {
  const onEditProfile = () => {
    if (!profile || !profile.user_id) {
      Alert.alert('Error', 'Profile data not available. Please try again.');
      return;
    }
    navigation.navigate('ProfileEdit', { profile });
  };

  const uploadPhoto = async (uri: string) => {
    await uploadProfilePhoto(uri, profile, setPhotoUrl, setCurrentUserPhotoUrl, refreshProfile);
  };

  const onProfilePhotoPress = () => {
    if (viewUser) return; // Only own profile
    showProfilePhotoOptions(
      () => handleTakePhoto(uploadPhoto),
      () => handleChooseFromLibrary(uploadPhoto),
    );
  };

  const onProfileTabReselect = () => {
    if (viewUser) {
      // Reset to current user
      setProfile(null);
      setPhotoUrl(null);
      setUserData(null);
      setUserPosts([]);
      setDealCount(0);
      setHasData(false);
      setPostsInitialized(false);
      loadProfileData();
    }
  };

  const onShareProfile = async () => {
    try {
      const displayName = getDisplayName(userData, profile);
      const message = viewUser
        ? `Check out ${displayName}'s profile on ImHungri!`
        : `Check out my profile on ImHungri!`;
      await Share.share({ message });
    } catch (err) {
      logger.error('Error sharing profile:', err);
      Alert.alert('Error', 'Could not share profile');
    }
  };

  const onGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      logger.info('📸 Profile: No back route available, navigating to Feed');
      navigation.navigate('MainTabs', { screen: 'Feed' });
    }
  };

  return { onEditProfile, onProfilePhotoPress, onProfileTabReselect, onShareProfile, onGoBack };
}
