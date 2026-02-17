/**
 * @file FormDivider — Thin separator line between form sections
 *
 * Replaces the repeated <View style={styles.separator} /> pattern.
 */

import React from 'react';
import { Box } from '../../../ui/primitives';
import { BORDER_WIDTH } from '../../../ui/alf/tokens';

export function FormDivider() {
  return (
    <Box
      mx="md"
      h={BORDER_WIDTH.hairline}
      bg="borderSubtle"
    />
  );
}
