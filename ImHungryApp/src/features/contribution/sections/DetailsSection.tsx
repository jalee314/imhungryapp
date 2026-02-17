/**
 * @file DetailsSection — Extra details multiline textarea
 *
 * Mirrors the "Extra Details" area used in DealCreationScreen / DealEditScreen.
 */

import React from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../ui/primitives';
import { GRAY, FONT_SIZE } from '../../../ui/alf/tokens';

export interface DetailsSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

const PLACEHOLDER =
  '• Is it valid for takeout, delivery, or dine-in?\n' +
  '• Are there any limitations or exclusions?\n' +
  '• Are there any codes or special instructions needed to redeem it?\n' +
  '• Is this a mobile deal or in-person deal?';

export function DetailsSection({
  value,
  onChangeText,
  onFocus,
  inputRef,
}: DetailsSectionProps) {
  return (
    <>
      <Box row gap="sm" py="md" px="md">
        <Ionicons name="menu-outline" size={20} color={GRAY[700]} />
        <Text size="sm" weight="medium" color="textMuted" flex={1}>Extra Details</Text>
      </Box>
      <Box px="lg" pb="md">
        <TextInput
          ref={inputRef}
          style={{
            fontSize: FONT_SIZE.sm,
            color: GRAY[800],
            padding: 0,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={PLACEHOLDER}
          placeholderTextColor={GRAY[400]}
          multiline
          onFocus={onFocus}
        />
      </Box>
    </>
  );
}
