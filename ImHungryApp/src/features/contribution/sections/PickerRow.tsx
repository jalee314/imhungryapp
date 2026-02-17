/**
 * @file PickerRow — Generic option row with chevron (category / cuisine)
 *
 * Replaces the per-field TouchableOpacity+icon+chevron pattern that is
 * duplicated across both contribution screens.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../../../ui/primitives';
import { GRAY, STATIC } from '../../../ui/alf/tokens';

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

export function PickerRow({
  icon,
  label,
  selectedLabel,
  onPress,
}: PickerRowProps) {
  return (
    <Pressable row gap="sm" py={14} px="md" onPress={onPress}>
      <Ionicons name={icon} size={20} color={GRAY[700]} />
      <Box flex={1}>
        <Text size="sm" weight="medium" color="textMuted">{label}</Text>
        {!!selectedLabel && (
          <Text size="xs" color="textSubtle" mt="2xs" numberOfLines={1}>
            {selectedLabel}
          </Text>
        )}
      </Box>
      <Ionicons name="chevron-forward" size={12} color={STATIC.black} />
    </Pressable>
  );
}
