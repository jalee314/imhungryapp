/**
 * @file PickerRow — Generic option row with chevron (category / cuisine)
 *
 * Replaces the per-field TouchableOpacity+icon+chevron pattern that is
 * duplicated across both contribution screens.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Text, Pressable } from '../../../ui/primitives';

export interface PickerRowProps {
  /** Icon name from Ionicons. */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Primary label text. */
  label: string;
  /** Optional selected value display text. */
  selectedLabel?: string | null;
  /** Called when the row is tapped. */
  onPress: () => void;
}

const rowMinHeightStyle = { minHeight: 38 };
const pickerLabelStyle = { fontSize: 11 };

export function PickerRow({
  icon,
  label,
  selectedLabel,
  onPress,
}: PickerRowProps) {
  return (
    <Pressable row gap="lg" py={6} px="lg" align="center" style={rowMinHeightStyle} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#606060" />
      <Box flex={1}>
        <Text size="xs" color="#000000">{label}</Text>
        {!!selectedLabel && (
          <Text style={pickerLabelStyle} color="#888889" mt="2xs" numberOfLines={1}>
            {selectedLabel}
          </Text>
        )}
      </Box>
      <Ionicons name="chevron-forward" size={12} color="black" />
    </Pressable>
  );
}
