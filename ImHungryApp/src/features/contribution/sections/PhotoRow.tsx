/**
 * @file PhotoRow — "Add Photo *" action row with photo count badge
 *
 * Thin wrapper around the icon + chevron pattern used in both screens.
 * Actual photo picking / cropping modals are orchestrated by the screen.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../../../ui/primitives';
import { GRAY, STATIC } from '../../../ui/alf/tokens';

export interface PhotoRowProps {
  /** Number of photos currently selected / attached. */
  photoCount: number;
  /** Called when the row is tapped. */
  onPress: () => void;
}

export function PhotoRow({ photoCount, onPress }: PhotoRowProps) {
  return (
    <Pressable row gap="sm" py={14} px="md" onPress={onPress}>
      <Ionicons name="camera-outline" size={20} color={GRAY[800]} />
      <Box flex={1}>
        <Text size="sm" weight="medium" color="textMuted">Add Photo *</Text>
        {photoCount > 0 && (
          <Text size="xs" color="textSubtle" mt="2xs">
            {photoCount} Photo{photoCount !== 1 ? 's' : ''} Added
          </Text>
        )}
      </Box>
      <Ionicons name="chevron-forward" size={12} color={STATIC.black} />
    </Pressable>
  );
}
