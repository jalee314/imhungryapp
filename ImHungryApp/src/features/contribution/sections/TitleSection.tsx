/**
 * @file TitleSection — Deal title input with character counter
 *
 * Matches the existing "Deal Title *" row from DealCreationScreen
 * and DealEditScreen. Purely presentational; state is owned by useDealForm.
 */

import React from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../ui/primitives';
import { TITLE_MAX_LENGTH } from '../engine';

export interface TitleSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

export function TitleSection({
  value,
  onChangeText,
  onFocus,
  inputRef,
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
          style={{
            fontFamily: 'Inter',
            fontSize: 12,
            color: '#000000',
            minHeight: 50,
            textAlignVertical: 'top',
            lineHeight: 20,
            paddingTop: 0,
            paddingLeft: 4,
            includeFontPadding: false,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder="$10 Sushi before 5pm on M-W"
          placeholderTextColor="#C1C1C1"
          multiline
          maxLength={TITLE_MAX_LENGTH}
          onFocus={onFocus}
        />
        <Text size="xs" color="#888889" style={{ alignSelf: 'flex-end' }} mt="xs">
          {value.length}/{TITLE_MAX_LENGTH}
        </Text>
      </Box>
    </>
  );
}
