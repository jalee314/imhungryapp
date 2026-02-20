/**
 * @file FavoritesHeader — Header bar for the Favorites screen.
 */

import React from 'react';

import { STATIC, GRAY, BORDER_WIDTH } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

const favoritesHeaderBorderStyle = {
  borderBottomWidth: BORDER_WIDTH.hairline,
  borderBottomColor: GRAY[250],
};
const favoritesHeaderTitleStyle = { fontFamily: 'Inter' };

export function FavoritesHeader() {
  return (
    <Box
      bg={STATIC.white}
      h={100}
      justify="flex-end"
      pb="sm"
      px="lg"
      style={favoritesHeaderBorderStyle}
    >
      <Text
        size="2xl"
        weight="semibold"
        color={STATIC.black}
        style={favoritesHeaderTitleStyle}
      >
        Favorites
      </Text>
    </Box>
  );
}
