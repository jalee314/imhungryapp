/**
 * ProfileHeader - Profile Feature Component
 * 
 * Displays user information (name, date, location) and profile photo.
 * Uses design tokens and atoms.
 */

import React from 'react';
import { Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, Pressable, Skeleton } from '../../../components/atoms';
import { colors } from '../../../lib/theme';

interface ProfileHeaderProps {
  displayName: string;
  joinDateText: string;
  locationCity: string;
  photoUrl: string | null;
  isViewingOtherUser: boolean;
  onProfilePhotoPress?: () => void;
  onGoBack?: () => void;
  isLoading?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  joinDateText,
  locationCity,
  photoUrl,
  isViewingOtherUser,
  onProfilePhotoPress,
  onGoBack,
  isLoading = false,
}) => {
  const profilePhotoStyle = {
    width: 85,
    height: 85,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary,
  };

  if (isLoading) {
    return (
      <Box 
        py="xl" 
        px={17} 
        bg="background" 
        borderBottom={0.5} 
        borderColor="borderLight"
      >
        <Box row pt="xl" alignCenter justifyBetween height={117}>
          {/* Left: Info skeleton */}
          <Box flex={1} gap="sm">
            <Skeleton width={150} height={24} rounded="xs" />
            <Skeleton width={120} height={14} rounded="xs" />
            <Skeleton width={100} height={14} rounded="xs" />
          </Box>
          
          {/* Right: Photo skeleton */}
          <Skeleton circle size={85} />
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      py="xl" 
      px={17} 
      bg="background" 
      borderBottom={0.5} 
      borderColor="borderLight"
    >
      <Box row pt="xl" alignCenter justifyBetween height={117}>
        {/* Left Section: User Info */}
        <Box flex={1} justifyCenter>
          {/* Back Button for Other Users */}
          {isViewingOtherUser && onGoBack && (
            <Pressable 
              onPress={onGoBack} 
              style={{ marginLeft: -8, marginBottom: 12 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
            </Pressable>
          )}
          
          <Text 
            size="2xl" 
            weight="bold" 
            color="text"
            style={{ letterSpacing: 0.48, marginTop: -1 }}
          >
            {displayName}
          </Text>
          
          <Text size="sm" color="text" lineHeight={20}>
            {joinDateText}
          </Text>
          
          <Text size="sm" color="text" lineHeight={15}>
            {locationCity}
          </Text>
        </Box>

        {/* Right Section: Profile Photo */}
        <Box alignCenter justifyCenter>
          {!isViewingOtherUser ? (
            <Pressable onPress={onProfilePhotoPress}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={profilePhotoStyle} />
              ) : (
                <Box 
                  center 
                  style={[profilePhotoStyle, { backgroundColor: colors.interactive }]}
                >
                  <MaterialCommunityIcons name="account" size={35} color={colors.textMuted} />
                </Box>
              )}
            </Pressable>
          ) : (
            <>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={profilePhotoStyle} />
              ) : (
                <Box 
                  center 
                  style={[profilePhotoStyle, { backgroundColor: colors.interactive }]}
                >
                  <MaterialCommunityIcons name="account" size={35} color={colors.textMuted} />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileHeader;
