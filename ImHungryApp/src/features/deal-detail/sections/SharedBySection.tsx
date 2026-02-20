/**
 * @file SharedBySection — "Shared By" user avatar + name row.
 *
 * Purely presentational. Handles anonymous vs named display.
 */

import React from 'react';
import { Image, ImageSourcePropType, TouchableOpacity } from 'react-native';

import type { Deal } from '../../../types/deal';
import { STATIC, GRAY, BORDER_WIDTH, SPACING } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface SharedBySectionProps {
  dealData: Deal;
  displayName: string;
  profilePicture: ImageSourcePropType;
  onUserPress: () => void;
}

const sharedByRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: SPACING.lg,
  paddingHorizontal: SPACING['2xl'],
  gap: SPACING.sm,
};
const sharedByAvatarStyle = { width: 58, height: 58, borderRadius: 29 };
const sharedByTextStyle = { fontFamily: 'Inter', letterSpacing: 0.2, lineHeight: 15 };

export function SharedBySection({
  dealData,
  displayName,
  profilePicture,
  onUserPress,
}: SharedBySectionProps) {
  return (
    <>
      {/* Separator */}
      <Box
        mx="2xl"
        my="sm"
        h={BORDER_WIDTH.hairline}
        bg={GRAY[250]}
      />

      <TouchableOpacity
        onPress={onUserPress}
        activeOpacity={dealData.isAnonymous ? 1 : 0.7}
        disabled={dealData.isAnonymous}
        style={sharedByRowStyle}
      >
        <Image
          source={profilePicture}
          style={sharedByAvatarStyle}
        />
        <Box flex={1}>
          <Text
            size={10}
            weight="regular"
            color={STATIC.black}
            style={sharedByTextStyle}
          >
            Shared By
          </Text>
          <Text
            size="xs"
            weight="bold"
            color={STATIC.black}
            style={sharedByTextStyle}
          >
            {displayName}
          </Text>
          <Text
            size={10}
            weight="regular"
            color={STATIC.black}
            style={sharedByTextStyle}
          >
            {dealData.userCity || 'Unknown'}, {dealData.userState || 'CA'}
          </Text>
        </Box>
      </TouchableOpacity>
    </>
  );
}
