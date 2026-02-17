/**
 * @file AnonymousToggle — Switch row for anonymous posting
 *
 * Matches the incognito toggle from DealCreationScreen / DealEditScreen.
 */

import React from 'react';
import { Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text } from '../../../ui/primitives';

export interface AnonymousToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function AnonymousToggle({
  value,
  onValueChange,
}: AnonymousToggleProps) {
  return (
    <Box row gap="lg" py={6} px="lg" minH={38} align="center">
      <MaterialCommunityIcons name="incognito" size={20} color="#606060" />
      <Text size="xs" color="#000000" flex={1}>
        Anonymous
      </Text>
      <Switch
        trackColor={{ false: '#D2D5DA', true: '#FFA05C' }}
        thumbColor="#FFFFFF"
        onValueChange={onValueChange}
        value={value}
      />
    </Box>
  );
}
