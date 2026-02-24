/**
 * @file DealDetailsSection — Optional "Details" text block.
 *
 * Renders only when dealData.details is non-empty.
 */

import React from 'react';

import { STATIC, GRAY, BORDER_WIDTH } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export interface DealDetailsSectionProps {
  details: string | undefined;
}

export function DealDetailsSection({ details }: DealDetailsSectionProps) {
  if (!details || details.trim() === '') return null;

  return (
    <>
      {/* Separator */}
      <Box
        mx="2xl"
        my="sm"
        h={BORDER_WIDTH.hairline}
        bg={GRAY[250]}
      />

      <Box px="2xl">
        <Text
          size="lg"
          weight="bold"
          color={STATIC.black}
          mb="sm"
          style={{ fontFamily: 'Inter', lineHeight: 20 }}
        >
          Details
        </Text>
        <Text
          size="xs"
          weight="regular"
          color={STATIC.black}
          style={{ fontFamily: 'Inter', lineHeight: 18 }}
        >
          {details}
        </Text>
      </Box>
    </>
  );
}
