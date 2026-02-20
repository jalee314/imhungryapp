/**
 * @file CommunityErrorState — Error message with retry button.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';

import { BRAND, GRAY, STATIC, RADIUS, SPACING } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface CommunityErrorStateProps {
  message: string;
  onRetry: () => void;
}

const interFont = { fontFamily: 'Inter' };
const retryButtonStyle = {
  backgroundColor: BRAND.accent,
  paddingHorizontal: SPACING['2xl'],
  paddingVertical: SPACING.md,
  borderRadius: RADIUS.md,
};

export function CommunityErrorState({ message, onRetry }: CommunityErrorStateProps) {
  return (
    <Box flex={1} center py="5xl">
      <Text
        size="md"
        color={GRAY[600]}
        textAlign="center"
        mb="lg"
        style={interFont}
      >
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={retryButtonStyle}
      >
        <Text
          size="md"
          weight="semibold"
          color={STATIC.white}
          style={interFont}
        >
          Retry
        </Text>
      </TouchableOpacity>
    </Box>
  );
}
