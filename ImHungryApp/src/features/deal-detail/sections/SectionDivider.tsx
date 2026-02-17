/**
 * @file SectionDivider — Thin horizontal line separator between sections.
 */

import React from 'react';
import { Box } from '../../../ui/primitives';
import { GRAY, BORDER_WIDTH } from '../../../ui/alf';

export function SectionDivider() {
  return (
    <Box
      mx="2xl"
      my="sm"
      h={BORDER_WIDTH.hairline}
      bg={GRAY[250]}
    />
  );
}
