/**
 * Format join date from various possible date fields
 */
export const formatJoinDate = (profile: any) => {
  if (!profile) return 'Joined recently';
  
  const dateString = profile.created_at || profile.createdAt || profile.date_created || 
                    profile.inserted_at || profile.created || profile.registered_at || profile.signup_date;
  
  if (!dateString) return 'Joined recently';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Joined recently';
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  } catch (error) {
    return 'Joined recently';
  }
};

/**
 * Get display name from userData or profile
 */
export const getDisplayName = (userData: any, profile: any) => {
  return userData?.username || profile?.display_name || '';
};

/**
 * Calculate username font size based on length
 */
export const getUsernameFontSize = (username: string) => {
  const length = username.length;
  
  if (length <= 8) return 26;
  if (length <= 12) return 24;
  return 22;
};

/**
 * Show profile photo picker options
 */
export const showProfilePhotoOptions = (
  handleTakePhoto: () => void,
  handleChooseFromLibrary: () => void
) => {
  const { Alert } = require('react-native');
  
  Alert.alert(
    'Update Profile Photo',
    'Choose how you want to update your profile photo',
    [
      {
        text: 'Take Photo',
        onPress: handleTakePhoto,
      },
      {
        text: 'Choose from Library',
        onPress: handleChooseFromLibrary,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
};

/**
 * Show logout confirmation
 */
export const showLogoutConfirmation = (
  onConfirm: () => void,
  onCancel: () => void
) => {
  const { Alert } = require('react-native');
  
  Alert.alert(
    'Log Out',
    'Are you sure you want to log out?',
    [
      {
        text: 'Cancel',
        onPress: onCancel,
        style: 'cancel',
      },
      {
        text: 'Log Out',
        onPress: onConfirm,
        style: 'destructive',
      },
    ]
  );
};

/**
 * Show delete account confirmation
 */
export const showDeleteAccountConfirmation = (
  onConfirm: () => void,
  onCancel: () => void
) => {
  const { Alert } = require('react-native');
  
  Alert.alert(
    'Delete Account',
    'Are you sure? All your information is going to be deleted.',
    [
      {
        text: 'Cancel',
        onPress: onCancel,
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: onConfirm,
        style: 'destructive',
      },
    ]
  );
};
