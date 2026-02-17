/**
 * @file AnonymousToggle — Switch row for anonymous posting
 *
 * Matches the incognito toggle from DealCreationScreen / DealEditScreen.
 */

import React from 'react';
import { Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text } from '../../../ui/primitives';
import { BRAND, GRAY } from '../../../ui/alf/tokens';

export interface AnonymousToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function AnonymousToggle({
  value,
  onValueChange,
}: AnonymousToggleProps) {
  return (
    <Box row gap="sm" py={14} px="md">
      <MaterialCommunityIcons name="incognito" size={20} color={GRAY[700]} />
      <Text size="sm" weight="medium" color="textMuted" flex={1}>
        Anonymous
      </Text>
      <Switch
        trackColor={{ false: GRAY[400], true: BRAND.primary }}
        thumbColor="#FFFFFF"
        onValueChange={onValueChange}
        value={value}
      />
    </Box>
  );
}
