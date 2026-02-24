/**
 * @file DiscoverSearchBar — Search input for filtering restaurants.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

import SkeletonLoader from '../../../components/SkeletonLoader';
import {
  STATIC,
  GRAY,
  ALPHA_COLORS,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  ICON_SIZE,
} from '../../../ui/alf';
import { Box } from '../../../ui/primitives';

const { width: screenWidth } = Dimensions.get('window');

export interface DiscoverSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

/**
 * Search bar skeleton shown during initial loading.
 */
export function DiscoverSearchBarSkeleton() {
  return (
    <Box px="lg" py="sm">
      <SkeletonLoader
        width={screenWidth - SPACING['2xl']}
        height={35}
        borderRadius={RADIUS.pill}
      />
    </Box>
  );
}

export function DiscoverSearchBar({
  value,
  onChangeText,
  onClear,
}: DiscoverSearchBarProps) {
  return (
    <Box px="lg" py="sm">
      <Box
        direction="row"
        align="center"
        bg={STATIC.white}
        rounded="pill"
        h={35}
        px="lg"
        gap="lg"
        borderWidth={BORDER_WIDTH.hairline}
        borderColor={GRAY[325]}
        style={[
          styles.container,
          value.length > 0 && styles.containerFocused,
        ]}
      >
        <Ionicons name="search" size={ICON_SIZE.xs} color={GRAY[600]} />
        <TextInput
          style={styles.input}
          placeholder="Search"
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={ALPHA_COLORS.placeholderGray}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={ICON_SIZE.xs} color={GRAY[600]} />
          </TouchableOpacity>
        )}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 2,
  },
  containerFocused: {
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: ALPHA_COLORS.placeholderGray,
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: -0.41,
    lineHeight: 22,
    padding: 0,
  },
  clearButton: {
    padding: SPACING.xs,
  },
});
