/**
 * @file FormDivider — Thin separator line between form sections
 *
 * Replaces the repeated <View style={styles.separator} /> pattern.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '../../../ui/primitives';

export function FormDivider() {
  return (
    <Box
      my={4}
      style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#C1C1C1' }}
    />
  );
}
