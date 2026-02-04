/**
 * DealTitleInput - Title input section for deal forms
 */

import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';
import { colors, typography } from '../../../lib/theme';

interface DealTitleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  maxLength?: number;
}

export const DealTitleInput = forwardRef<TextInput, DealTitleInputProps>(({
  value,
  onChangeText,
  onFocus,
  maxLength = 100,
}, ref) => {
  return (
    <>
      <Box
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="s4"
        paddingVertical="s1"
        height={38}
        gap="s4"
      >
        <Ionicons name="menu-outline" size={20} color="#606060" />
        <Text variant="bodySmall" flex={1}>Deal Title *</Text>
      </Box>
      <Box paddingHorizontal="s4" paddingVertical="s1" minHeight={70}>
        <TextInput
          ref={ref}
          style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.fontSize.sm,
            color: colors.text,
            minHeight: 50,
            textAlignVertical: 'top',
            lineHeight: 20,
            paddingTop: 0,
            paddingLeft: 4,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder="$10 Sushi before 5pm on M-W"
          placeholderTextColor="#C1C1C1"
          multiline
          maxLength={maxLength}
          onFocus={onFocus}
        />
        <Text variant="caption" color="textMuted" textAlign="right" marginTop="s1">
          {value.length}/{maxLength}
        </Text>
      </Box>
    </>
  );
});

DealTitleInput.displayName = 'DealTitleInput';
