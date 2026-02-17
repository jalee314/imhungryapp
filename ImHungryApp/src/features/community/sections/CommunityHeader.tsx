/**
 * @file CommunityHeader — Fixed header bar with back button and "Featured Deals" title.
 *
 * Purely presentational. State & callbacks come from useCommunity.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text } from '../../../ui/primitives';
import {
  STATIC,
  GRAY,
  BORDER_WIDTH,
  SPACING,
} from '../../../ui/alf';

export interface CommunityHeaderProps {
  onGoBack: () => void;
}

export function CommunityHeader({ onGoBack }: CommunityHeaderProps) {
  return (
    <Box
      bg={STATIC.white}
      h={100}
      justify="flex-end"
      style={{ borderBottomWidth: BORDER_WIDTH.hairline, borderBottomColor: GRAY[250] }}
    >
      <Box
        row
        justify="space-between"
        px={10}
        pb={10}
      >
        <TouchableOpacity
          onPress={onGoBack}
          style={{ width: 40, height: 24, justifyContent: 'center', alignItems: 'flex-start' }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={STATIC.black} />
        </TouchableOpacity>

        <Text
          size="xl"
          color={STATIC.black}
          textAlign="center"
          style={{ fontFamily: 'Inter' }}
        >
          <Text weight="bold" style={{ fontFamily: 'Inter' }}>Featured Deals</Text>
        </Text>

        {/* Spacer to balance the back button for centering */}
        <Box w={40} />
      </Box>
    </Box>
  );
}
