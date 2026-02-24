/**
 * @file SectionDivider — Thin horizontal line separator between sections.
 */

import React from 'react';

import { GRAY, BORDER_WIDTH } from '../../../ui/alf';
import { Box } from '../../../ui/primitives';

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
