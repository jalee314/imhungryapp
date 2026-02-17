/**
 * @file DealDetailHeader — Fixed header bar with back, directions, and ⋮ menu.
 *
 * Purely presentational. State & callbacks come from useDealDetail.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text } from '../../../ui/primitives';
import {
  STATIC,
  ALPHA_COLORS,
  BORDER_WIDTH,
  GRAY,
  RADIUS,
  SPACING,
} from '../../../ui/alf';

export interface DealDetailHeaderProps {
  onGoBack: () => void;
  onDirections: () => void;
  onMore: () => void;
}

export function DealDetailHeader({ onGoBack, onDirections, onMore }: DealDetailHeaderProps) {
  return (
    <Box
      row
      justify="space-between"
      align="center"
      px="lg"
      py="md"
      bg={STATIC.white}
      style={{ borderBottomWidth: BORDER_WIDTH.hairline, borderBottomColor: GRAY[300] }}
    >
      <TouchableOpacity onPress={onGoBack} style={{ padding: SPACING.xs }}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#404040" />
      </TouchableOpacity>

      <Box row align="center" gap="xs">
        <TouchableOpacity
          onPress={onDirections}
          style={{
            backgroundColor: ALPHA_COLORS.brandPrimary80,
            borderRadius: RADIUS.pill,
            paddingHorizontal: SPACING['2xl'],
            paddingVertical: SPACING.sm,
          }}
        >
          <Text
            size="sm"
            weight="regular"
            color={STATIC.black}
            style={{ fontFamily: 'Inter-Regular', lineHeight: 15, textAlign: 'center' }}
          >
            Directions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={{ padding: SPACING.xs }}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#404040" />
        </TouchableOpacity>
      </Box>
    </Box>
  );
}
