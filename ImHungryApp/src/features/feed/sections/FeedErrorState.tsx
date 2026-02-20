/**
 * @file FeedErrorState — Error message with retry button.
 *
 * Purely presentational.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';

import { BRAND, GRAY, STATIC, RADIUS, SPACING } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface FeedErrorStateProps {
  message: string;
  onRetry: () => void;
}

const feedErrorTextStyle = { fontFamily: 'Inter' };
const feedErrorButtonStyle = {
  backgroundColor: BRAND.accent,
  paddingHorizontal: SPACING['2xl'],
  paddingVertical: SPACING.md,
  borderRadius: RADIUS.md,
};

export function FeedErrorState({ message, onRetry }: FeedErrorStateProps) {
  return (
    <Box flex={1} center py="5xl">
      <Text
        size="md"
        color={GRAY[600]}
        textAlign="center"
        mb="lg"
        style={feedErrorTextStyle}
      >
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={feedErrorButtonStyle}
      >
        <Text
          size="md"
          weight="semibold"
          color={STATIC.white}
          style={feedErrorTextStyle}
        >
          Retry
        </Text>
      </TouchableOpacity>
    </Box>
  );
}
