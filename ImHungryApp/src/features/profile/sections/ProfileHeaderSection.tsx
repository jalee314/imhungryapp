/**
 * @file ProfileHeaderSection — User info (name, join date, location) + profile photo.
 *
 * Purely presentational. All data comes via props.
 */

import React from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text } from '../../../ui/primitives';
import {
  STATIC,
  GRAY,
  BRAND,
  BORDER_WIDTH,
  FONT_SIZE,
  FONT_WEIGHT,
  DIMENSION,
  SPACING,
  RADIUS,
} from '../../../ui/alf';

// ============================================================================
// Props
// ============================================================================

export interface ProfileHeaderSectionProps {
  displayName: string;
  joinDateText: string;
  locationCity: string;
  photoUrl: string | null;
  isViewingOtherUser: boolean;
  onGoBack: () => void;
  onProfilePhotoPress: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileHeaderSection({
  displayName,
  joinDateText,
  locationCity,
  photoUrl,
  isViewingOtherUser,
  onGoBack,
  onProfilePhotoPress,
}: ProfileHeaderSectionProps) {
  return (
    <Box
      py="lg"
      px={17}
      bg={STATIC.white}
      style={{ borderBottomWidth: BORDER_WIDTH.hairline, borderBottomColor: GRAY[250] }}
    >
      <Box
        row
        justify="space-between"
        align="center"
        style={{ height: DIMENSION.profileHeaderHeight, paddingTop: SPACING.lg }}
      >
        {/* Left: user info */}
        <Box flex={1} direction="column" justify="center" alignSelf="stretch" gap="2xl">
          <Box direction="row" align="flex-start" gap="sm">
            <Box>
              {isViewingOtherUser && (
                <TouchableOpacity style={s.backButton} onPress={onGoBack}>
                  <MaterialCommunityIcons name="chevron-left" size={28} color={STATIC.black} />
                </TouchableOpacity>
              )}
              <Text
                size="2xl"
                weight="bold"
                color={STATIC.black}
                style={s.userName}
              >
                {displayName}
              </Text>
              <Text size="xs" color={STATIC.black} style={s.joinDate}>
                {joinDateText}
              </Text>
              <Text size="xs" color={STATIC.black} style={s.location}>
                {locationCity}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Right: avatar */}
        <Box center>
          {!isViewingOtherUser ? (
            <TouchableOpacity style={s.photoContainer} onPress={onProfilePhotoPress}>
              <AvatarImage uri={photoUrl} />
            </TouchableOpacity>
          ) : (
            <Box style={s.photoContainer}>
              <AvatarImage uri={photoUrl} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// Internal helper
// ============================================================================

function AvatarImage({ uri }: { uri: string | null }) {
  if (uri) {
    return <Image source={{ uri }} style={s.profilePhoto} />;
  }
  return (
    <Box style={[s.profilePhoto, s.placeholderPhoto]} center>
      <MaterialCommunityIcons name="account" size={35} color={GRAY[500]} />
    </Box>
  );
}

// ============================================================================
// Styles
// ============================================================================

const PHOTO = DIMENSION.profilePhoto;

const s = StyleSheet.create({
  backButton: {
    marginLeft: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  userName: {
    letterSpacing: 0.48,
    lineHeight: FONT_SIZE['2xl'],
    marginTop: -1,
    fontWeight: FONT_WEIGHT.bold as any,
  },
  joinDate: {
    letterSpacing: 0.36,
    lineHeight: 20,
  },
  location: {
    letterSpacing: 0.36,
    lineHeight: 15,
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: RADIUS.full,
    borderWidth: BORDER_WIDTH.medium,
    borderColor: BRAND.accent,
  },
  placeholderPhoto: {
    backgroundColor: GRAY[150],
  },
});
