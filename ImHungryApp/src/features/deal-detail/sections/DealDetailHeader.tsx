/**
 * @file DealDetailHeader — Fixed header bar with back, directions, and ⋮ menu.
 *
 * Purely presentational. State & callbacks come from useDealDetail.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import {
  STATIC,
  ALPHA_COLORS,
  BORDER_WIDTH,
  GRAY,
  RADIUS,
  SPACING,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface DealDetailHeaderProps {
  onGoBack: () => void;
  onDirections: () => void;
  onMore: () => void;
}

const headerBorderStyle = {
  borderBottomWidth: BORDER_WIDTH.hairline,
  borderBottomColor: GRAY[300],
};
const iconButtonStyle = { padding: SPACING.xs };
const directionsButtonStyle = {
  backgroundColor: ALPHA_COLORS.brandPrimary80,
  borderRadius: RADIUS.pill,
  paddingHorizontal: SPACING['2xl'],
  paddingVertical: SPACING.sm,
};
const directionsTextStyle = { fontFamily: 'Inter-Regular', lineHeight: 15, textAlign: 'center' as const };

export function DealDetailHeader({ onGoBack, onDirections, onMore }: DealDetailHeaderProps) {
  return (
    <Box
      row
      justify="space-between"
      align="center"
      px="lg"
      py="md"
      bg={STATIC.white}
      style={headerBorderStyle}
    >
      <TouchableOpacity onPress={onGoBack} style={iconButtonStyle}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#404040" />
      </TouchableOpacity>

      <Box row align="center" gap="xs">
        <TouchableOpacity
          onPress={onDirections}
          style={directionsButtonStyle}
        >
          <Text
            size="sm"
            weight="regular"
            color={STATIC.black}
            style={directionsTextStyle}
          >
            Directions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={iconButtonStyle}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#404040" />
        </TouchableOpacity>
      </Box>
    </Box>
  );
}
