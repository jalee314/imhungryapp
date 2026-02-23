/**
 * @file DiscoverErrorState — Error message with retry button.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import { BRAND, GRAY, STATIC, SEMANTIC, ICON_SIZE, RADIUS, SPACING } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface DiscoverErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DiscoverErrorState({ message, onRetry }: DiscoverErrorStateProps) {
  return (
    <Box flex={1} center py="6xl" px="4xl">
      <Ionicons name="alert-circle-outline" size={ICON_SIZE.lg} color={SEMANTIC.errorLight} />
      <Text
        size="lg"
        weight="semibold"
        color={GRAY[800]}
        textAlign="center"
        mt="lg"
        mb="sm"
        style={{ fontFamily: 'Inter' }}
      >
        Unable to load restaurants
      </Text>
      <Text
        size="sm"
        color={GRAY[600]}
        textAlign="center"
        mb="2xl"
        style={{ fontFamily: 'Inter', lineHeight: 20 }}
      >
        {message}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text
          size="md"
          weight="semibold"
          color={STATIC.white}
          style={{ fontFamily: 'Inter' }}
        >
          Try Again
        </Text>
      </TouchableOpacity>
    </Box>
  );
}

const styles = StyleSheet.create({
  retryButton: {
    backgroundColor: BRAND.accent,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
});
