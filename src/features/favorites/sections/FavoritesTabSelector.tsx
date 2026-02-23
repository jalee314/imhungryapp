/**
 * @file FavoritesTabSelector — Deals / Restaurants pill tabs.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import {
  STATIC,
  BRAND,
  GRAY,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { FavoritesTab } from '../types';

export interface FavoritesTabSelectorProps {
  activeTab: FavoritesTab;
  onTabChange: (tab: FavoritesTab) => void;
}

export function FavoritesTabSelector({
  activeTab,
  onTabChange,
}: FavoritesTabSelectorProps) {
  return (
    <Box
      direction="row"
      bg={STATIC.white}
      px="xl"
      py="sm"
      gap="xs"
    >
      <TouchableOpacity
        style={[styles.tab, activeTab === 'deals' && styles.activeTab]}
        onPress={() => onTabChange('deals')}
      >
        <Text
          size="sm"
          color={STATIC.black}
          textAlign="center"
          style={styles.tabText}
        >
          🤝 Deals
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
        onPress={() => onTabChange('restaurants')}
      >
        <Text
          size="sm"
          color={STATIC.black}
          textAlign="center"
          style={styles.tabText}
        >
          🍽 Restaurants
        </Text>
      </TouchableOpacity>
    </Box>
  );
}

const styles = StyleSheet.create({
  tab: {
    borderRadius: RADIUS.circle,
    backgroundColor: STATIC.white,
    borderWidth: BORDER_WIDTH.thin,
    borderColor: GRAY[325],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    height: 35,
  },
  activeTab: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  tabText: {
    fontFamily: 'Inter',
    lineHeight: 18,
  },
});
