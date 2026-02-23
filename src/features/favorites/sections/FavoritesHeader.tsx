/**
 * @file FavoritesHeader — Header bar for the Favorites screen.
 */

import React from 'react';

import { STATIC, GRAY, BORDER_WIDTH } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

export function FavoritesHeader() {
  return (
    <Box
      bg={STATIC.white}
      h={100}
      justify="flex-end"
      pb="sm"
      px="lg"
      style={{
        borderBottomWidth: BORDER_WIDTH.hairline,
        borderBottomColor: GRAY[250],
      }}
    >
      <Text
        size="2xl"
        weight="semibold"
        color={STATIC.black}
        style={{ fontFamily: 'Inter' }}
      >
        Favorites
      </Text>
    </Box>
  );
}
