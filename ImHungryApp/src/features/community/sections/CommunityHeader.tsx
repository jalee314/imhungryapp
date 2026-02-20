/**
 * @file CommunityHeader — Fixed header bar with back button and "Featured Deals" title.
 *
 * Purely presentational. State & callbacks come from useCommunity.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { STATIC, GRAY, BORDER_WIDTH } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface CommunityHeaderProps {
  onGoBack: () => void;
}

const communityHeaderBorderStyle = { borderBottomWidth: BORDER_WIDTH.hairline, borderBottomColor: GRAY[250] };
const communityHeaderBackButtonStyle = {
  width: 40,
  height: 24,
  justifyContent: 'center' as const,
  alignItems: 'flex-start' as const,
};
const communityHeaderTitleStyle = { fontFamily: 'Inter' };

export function CommunityHeader({ onGoBack }: CommunityHeaderProps) {
  return (
    <Box
      bg={STATIC.white}
      h={100}
      justify="flex-end"
      style={communityHeaderBorderStyle}
    >
      <Box
        row
        justify="space-between"
        px={10}
        pb={10}
      >
        <TouchableOpacity
          onPress={onGoBack}
          style={communityHeaderBackButtonStyle}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={STATIC.black} />
        </TouchableOpacity>

        <Text
          size="xl"
          color={STATIC.black}
          textAlign="center"
          style={communityHeaderTitleStyle}
        >
          <Text weight="bold" style={communityHeaderTitleStyle}>Featured Deals</Text>
        </Text>

        {/* Spacer to balance the back button for centering */}
        <Box w={40} />
      </Box>
    </Box>
  );
}
