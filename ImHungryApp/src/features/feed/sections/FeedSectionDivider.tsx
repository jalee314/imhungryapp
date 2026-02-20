/**
 * @file FeedSectionDivider — Thin horizontal separator between feed sections.
 */

import React from 'react';

import { GRAY, BORDER_WIDTH } from '../../../ui/alf';
import { Box } from '../../../ui/primitives';

export function FeedSectionDivider() {
  return (
    <Box
      h={BORDER_WIDTH.hairline}
      bg={GRAY[250]}
      mb="xs"
      style={{ marginHorizontal: -20, width: '110%' }}
    />
  );
}
