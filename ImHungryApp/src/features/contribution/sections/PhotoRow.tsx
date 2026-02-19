/**
 * @file PhotoRow — "Add Photo *" action row with photo count badge
 *
 * Thin wrapper around the icon + chevron pattern used in both screens.
 * Actual photo picking / cropping modals are orchestrated by the screen.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Text, Pressable } from '../../../ui/primitives';

export interface PhotoRowProps {
  /** Number of photos currently selected / attached. */
  photoCount: number;
  /** Called when the row is tapped. */
  onPress: () => void;
}

export function PhotoRow({ photoCount, onPress }: PhotoRowProps) {
  return (
    <Pressable row gap="lg" py={6} px="lg" align="center" style={{ minHeight: 38 }} onPress={onPress}>
      <Ionicons name="camera-outline" size={20} color="#404040" />
      <Box flex={1}>
        <Text size="xs" color="#000000">Add Photo *</Text>
        {photoCount > 0 && (
          <Text style={{ fontSize: 11 }} color="#888889" mt="2xs">
            {photoCount} Photo{photoCount !== 1 ? 's' : ''} Added
          </Text>
        )}
      </Box>
      <Ionicons name="chevron-forward" size={12} color="black" />
    </Pressable>
  );
}
