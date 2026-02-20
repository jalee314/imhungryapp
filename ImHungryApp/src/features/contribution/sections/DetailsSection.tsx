/**
 * @file DetailsSection — Extra details multiline textarea
 *
 * Mirrors the "Extra Details" area used in DealCreationScreen / DealEditScreen.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput } from 'react-native';

import { Box, Text } from '../../../ui/primitives';

export interface DetailsSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  /** Custom placeholder text. */
  placeholder?: string;
}

const DEFAULT_PLACEHOLDER =
  '• Is it valid for takeout, delivery, or dine-in?\n' +
  '• Are there any limitations or exclusions?\n' +
  '• Are there any codes or special instructions needed to redeem it?\n' +
  '• Is this a mobile deal or in-person deal?';
const detailsInputStyle = {
  fontFamily: 'Inter',
  fontSize: 12,
  color: '#000000',
  flex: 1,
  minHeight: 180,
  textAlignVertical: 'top',
  paddingHorizontal: 0,
  paddingTop: 0,
  paddingLeft: 2,
  paddingBottom: 12,
  lineHeight: 20,
  includeFontPadding: false,
};

export function DetailsSection({
  value,
  onChangeText,
  onFocus,
  inputRef,
  placeholder = DEFAULT_PLACEHOLDER,
}: DetailsSectionProps) {
  return (
    <>
      <Box row gap="lg" py={6} px="lg" minH={38} align="center">
        <Ionicons name="menu-outline" size={20} color="#606060" />
        <Text size="xs" color="#000000" flex={1}>Extra Details</Text>
      </Box>
      <Box px={15} py={4} flex={1} minH={200}>
        <TextInput
          ref={inputRef}
          style={detailsInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C1C1C1"
          multiline
          onFocus={onFocus}
        />
      </Box>
    </>
  );
}
