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
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.lg,
          paddingHorizontal: SPACING['2xl'],
          gap: SPACING.sm,
        }}
      >
        <Image
          source={profilePicture}
          style={{ width: 58, height: 58, borderRadius: 29 }}
        />
        <Box flex={1}>
          <Text
            size={10}
            weight="regular"
            color={STATIC.black}
            style={{ fontFamily: 'Inter', letterSpacing: 0.2, lineHeight: 15 }}
          >
            Shared By
          </Text>
          <Text
            size="xs"
            weight="bold"
            color={STATIC.black}
            style={{ fontFamily: 'Inter', letterSpacing: 0.2, lineHeight: 15 }}
          >
            {displayName}
          </Text>
          <Text
            size={10}
            weight="regular"
            color={STATIC.black}
            style={{ fontFamily: 'Inter', letterSpacing: 0.2, lineHeight: 15 }}
          >
            {dealData.userCity || 'Unknown'}, {dealData.userState || 'CA'}
          </Text>
        </Box>
      </TouchableOpacity>
    </>
  );
}
