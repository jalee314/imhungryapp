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
import { GRAY, FONT_SIZE, SPACING } from '../../../ui/alf/tokens';
import { TITLE_MAX_LENGTH } from '../engine';

export interface TitleSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

export function TitleSection({
  value,
  onChangeText,
  onFocus,
  inputRef,
}: TitleSectionProps) {
  return (
    <>
      <Box row gap="sm" py="md" px="md">
        <Ionicons name="menu-outline" size={20} color={GRAY[700]} />
        <Text size="sm" weight="medium" color="textMuted">Deal Title *</Text>
      </Box>
      <Box px="lg" pb="md">
        <TextInput
          ref={inputRef}
          style={{
            fontSize: FONT_SIZE.md,
            color: GRAY[800],
            padding: 0,
            minHeight: SPACING['2xl'],
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder="$10 Sushi before 5pm on M-W"
          placeholderTextColor={GRAY[400]}
          multiline
          maxLength={TITLE_MAX_LENGTH}
          onFocus={onFocus}
        />
        <Text size="xs" color="textSubtle" textAlign="right" mt="xs">
          {value.length}/{TITLE_MAX_LENGTH}
        </Text>
      </Box>
    </>
  );
}
