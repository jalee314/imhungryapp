/**
 * @file ProfileTabBar — Posts / Settings tab selector + share button.
 *
 * Purely presentational.
 */

import { Monicon } from '@monicon/native';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import {
  STATIC,
  GRAY,
  BRAND,
  SPACING,
  RADIUS,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

// ============================================================================
// Props
// ============================================================================

export interface ProfileTabBarProps {
  activeTab: 'posts' | 'settings';
  isViewingOtherUser: boolean;
  onTabChange: (tab: 'posts' | 'settings') => void;
  onShareProfile: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileTabBar({
  activeTab,
  isViewingOtherUser,
  onTabChange,
  onShareProfile,
}: ProfileTabBarProps) {
  return (
    <Box row justify="space-between" align="center" px="lg" py="sm" bg={GRAY[100]}>
      <Box row gap="xs">
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'posts' && s.activeTab]}
          onPress={() => onTabChange('posts')}
        >
          <Text
            size="sm"
            color={STATIC.black}
            style={activeTab === 'posts' ? s.activeText : undefined}
          >
            {isViewingOtherUser ? 'Posts' : 'My Posts'}
          </Text>
        </TouchableOpacity>

        {!isViewingOtherUser && (
          <TouchableOpacity
            style={[s.tabButton, activeTab === 'settings' && s.activeTab]}
            onPress={() => onTabChange('settings')}
          >
            <Text
              size="sm"
              color={STATIC.black}
              style={activeTab === 'settings' ? s.activeText : undefined}
            >
              Settings
            </Text>
          </TouchableOpacity>
        )}
      </Box>

      <TouchableOpacity style={s.shareButton} onPress={onShareProfile}>
        <Monicon name="mdi-light:share" size={24} color={STATIC.black} />
      </TouchableOpacity>
    </Box>
  );
}

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  tabButton: {
    borderRadius: RADIUS.circle,
    backgroundColor: STATIC.white,
    borderWidth: 1,
    borderColor: STATIC.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  activeTab: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  activeText: {
    color: STATIC.black,
  },
  shareButton: {
    borderRadius: RADIUS.pill,
    backgroundColor: STATIC.white,
    borderWidth: 1,
    borderColor: STATIC.white,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
  },
});
