/**
 * SettingsList - Profile Feature Component
 * 
 * List of settings options with navigation.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, Pressable } from '../../../components/atoms';
import { colors, spacing, borderRadius } from '../../../lib/theme';

interface SettingsItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, onPress }) => (
  <Pressable 
    onPress={onPress}
    row 
    alignCenter 
    py="xl" 
    px="2xl"
  >
    <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
    <Text flex={1} size="base" weight="medium" color="text" ml={spacing.md}>
      {label}
    </Text>
    <Text size="xl" weight="bold" color="text">›</Text>
  </Pressable>
);

interface SettingsListProps {
  onEditProfile: () => void;
  onNavigateToFAQ: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
  onNavigateToContact: () => void;
  onNavigateToBlocked: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isAdmin?: boolean;
  isAdminMode?: boolean;
  onToggleAdminMode?: () => void;
}

export const SettingsList: React.FC<SettingsListProps> = ({
  onEditProfile,
  onNavigateToFAQ,
  onNavigateToPrivacy,
  onNavigateToTerms,
  onNavigateToContact,
  onNavigateToBlocked,
  onLogout,
  onDeleteAccount,
  isAdmin = false,
  isAdminMode = false,
  onToggleAdminMode,
}) => {
  return (
    <Box 
      bg="background" 
      rounded="md" 
      overflow="hidden" 
      mx="xl" 
      mt="xl" 
      mb="9xl"
    >
      <SettingsItem 
        icon="account-edit" 
        label="Profile" 
        onPress={onEditProfile} 
      />
      
      {isAdmin && onToggleAdminMode && (
        <SettingsItem
          icon={isAdminMode ? 'account' : 'shield-account'}
          label={isAdminMode ? 'Switch to Standard Profile' : 'Switch to Admin Profile'}
          onPress={onToggleAdminMode}
        />
      )}
      
      <SettingsItem 
        icon="help-circle" 
        label="FAQ" 
        onPress={onNavigateToFAQ} 
      />
      
      <SettingsItem 
        icon="file-document" 
        label="Privacy & Policy" 
        onPress={onNavigateToPrivacy} 
      />
      
      <SettingsItem 
        icon="file-document" 
        label="Terms & Conditions" 
        onPress={onNavigateToTerms} 
      />
      
      <SettingsItem 
        icon="headphones" 
        label="Contact Us" 
        onPress={onNavigateToContact} 
      />
      
      <SettingsItem 
        icon="account-cancel" 
        label="Blocked Users" 
        onPress={onNavigateToBlocked} 
      />
      
      <SettingsItem 
        icon="logout" 
        label="Log Out" 
        onPress={onLogout} 
      />
      
      <SettingsItem 
        icon="delete" 
        label="Delete Account" 
        onPress={onDeleteAccount} 
      />
    </Box>
  );
};

export default SettingsList;
