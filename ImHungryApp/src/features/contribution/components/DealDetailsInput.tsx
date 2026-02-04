/**
 * DealDetailsInput - Extra details input section for deal forms
 */

import React, { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';
import { colors, typography } from '../../../lib/theme';

interface DealDetailsInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  placeholder?: string;
}

const DEFAULT_PLACEHOLDER = `• Is it valid for takeout, delivery, or dine-in?
• Are there any limitations or exclusions?
• Are there any codes or special instructions needed to redeem it?
• Is this a mobile deal or in-person deal?`;

export const DealDetailsInput = forwardRef<TextInput, DealDetailsInputProps>(({
  value,
  onChangeText,
  onFocus,
  placeholder = DEFAULT_PLACEHOLDER,
}, ref) => {
  return (
    <>
      <Box
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="s4"
        paddingVertical="s1"
        minHeight={38}
        gap="s4"
      >
        <Ionicons name="menu-outline" size={20} color="#606060" />
        <Text variant="bodySmall" flex={1}>Extra Details</Text>
      </Box>
      <Box paddingHorizontal="s4" paddingVertical="s1" flex={1} minHeight={200}>
        <TextInput
          ref={ref}
          style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.fontSize.sm,
            color: colors.text,
            flex: 1,
            minHeight: 180,
            textAlignVertical: 'top',
            paddingHorizontal: 0,
            paddingTop: 0,
            paddingLeft: 2,
            paddingBottom: 12,
            lineHeight: 20,
          }}
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
});

DealDetailsInput.displayName = 'DealDetailsInput';
