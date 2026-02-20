/**
 * @file TitleSection — Deal title input with character counter
 *
 * Matches the existing "Deal Title *" row from DealCreationScreen
 * and DealEditScreen. Purely presentational; state is owned by useDealForm.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput } from 'react-native';

import { Box, Text } from '../../../ui/primitives';
import { TITLE_MAX_LENGTH } from '../engine';

export interface TitleSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  /** Custom placeholder (defaults to "$10 Sushi before 5pm on M-W"). */
  placeholder?: string;
}

const DEFAULT_PLACEHOLDER = '$10 Sushi before 5pm on M-W';
const titleInputStyle = {
  fontFamily: 'Inter',
  fontSize: 12,
  color: '#000000',
  minHeight: 50,
  textAlignVertical: 'top',
  lineHeight: 20,
  paddingTop: 0,
  paddingLeft: 4,
  includeFontPadding: false,
};
const titleCounterStyle = { alignSelf: 'flex-end' };

export function TitleSection({
  value,
  onChangeText,
  onFocus,
  inputRef,
  placeholder = DEFAULT_PLACEHOLDER,
}: TitleSectionProps) {
  return (
    <>
      <Box row gap="lg" py={6} px="lg" h={38} align="center">
        <Ionicons name="menu-outline" size={20} color="#606060" />
        <Text size="xs" color="#000000" flex={1}>Deal Title *</Text>
      </Box>
      <Box px={15} py={4} minH={70}>
        <TextInput
          ref={inputRef}
          style={titleInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C1C1C1"
          multiline
          maxLength={TITLE_MAX_LENGTH}
          onFocus={onFocus}
        />
        <Text size="xs" color="#888889" style={titleCounterStyle} mt="xs">
          {value.length}/{TITLE_MAX_LENGTH}
        </Text>
      </Box>
    </>
  );
}
