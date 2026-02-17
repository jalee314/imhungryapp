/**
 * @file ProfileSettingsSection — Settings menu list for own profile.
 *
 * Purely presentational.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text } from '../../../ui/primitives';
import {
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
} from '../../../ui/alf';

// ============================================================================
// Props
// ============================================================================

export interface ProfileSettingsSectionProps {
  navigation: any;
  isAdmin: boolean;
  isAdminMode: boolean;
  onEditProfile: () => void;
  onEnterAdminMode: () => void;
  onExitAdminMode: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

// ============================================================================
// Item descriptor (avoids repetitive JSX)
// ============================================================================

interface SettingItemConfig {
  icon: string;
  label: string;
  onPress: () => void;
  visible?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileSettingsSection({
  navigation,
  isAdmin,
  isAdminMode,
  onEditProfile,
  onEnterAdminMode,
  onExitAdminMode,
  onLogout,
  onDeleteAccount,
}: ProfileSettingsSectionProps) {
  const items: SettingItemConfig[] = [
    { icon: 'account-edit', label: 'Profile', onPress: onEditProfile },
    {
      icon: isAdminMode ? 'account' : 'shield-account',
      label: isAdminMode ? 'Switch to Standard Profile' : 'Switch to Admin Profile',
      onPress: isAdminMode ? onExitAdminMode : onEnterAdminMode,
      visible: isAdmin,
    },
    { icon: 'help-circle', label: 'FAQ', onPress: () => navigation.navigate('FAQPage' as never) },
    { icon: 'file-document', label: 'Privacy & Policy', onPress: () => navigation.navigate('PrivacyPolicyPage' as never) },
    { icon: 'file-document', label: 'Terms & Conditions', onPress: () => navigation.navigate('TermsConditionsPage' as never) },
    { icon: 'headphones', label: 'Contact Us', onPress: () => (navigation as any).navigate('ContactUsPage') },
    { icon: 'account-cancel', label: 'Blocked Users', onPress: () => (navigation as any).navigate('BlockedUsersPage') },
    { icon: 'logout', label: 'Log Out', onPress: onLogout },
    { icon: 'delete', label: 'Delete Account', onPress: onDeleteAccount },
  ];

  return (
    <Box
      bg={STATIC.white}
      rounded="card"
      overflow="hidden"
      mx="lg"
      mt="lg"
      mb={100}
    >
      {items
        .filter((i) => i.visible !== false)
        .map((item) => (
          <TouchableOpacity key={item.label} style={s.row} onPress={item.onPress}>
            <MaterialCommunityIcons name={item.icon} size={20} color={STATIC.black} />
            <Text flex={1} size="md" weight="medium" color={STATIC.black} ml="md">
              {item.label}
            </Text>
            <Text size="xl" weight="bold" color={STATIC.black}>›</Text>
          </TouchableOpacity>
        ))}
    </Box>
  );
}

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
});
