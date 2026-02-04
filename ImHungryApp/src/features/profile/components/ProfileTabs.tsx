/**
 * ProfileTabs - Profile Feature Component
 * 
 * Tab bar for switching between Posts and Settings views.
 */

import React from 'react';
import { Monicon } from '@monicon/native';
import { Box, Text, Pressable, Skeleton } from '../../../components/atoms';
import { colors } from '../../../lib/theme';

type TabType = 'posts' | 'settings';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSharePress: () => void;
  isViewingOtherUser: boolean;
  isLoading?: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  onSharePress,
  isViewingOtherUser,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Box 
        row 
        px="xl" 
        py="m" 
        gap="s" 
        alignCenter 
        justifyBetween 
        bg="interactive"
      >
        <Box row gap="s">
          <Skeleton width={80} height={35} rounded="2xl" />
          <Skeleton width={80} height={35} rounded="2xl" />
        </Box>
        <Skeleton width={40} height={32} rounded="lg" />
      </Box>
    );
  }

  return (
    <Box 
      row 
      px="xl" 
      py="m" 
      gap="s" 
      alignCenter 
      justifyBetween 
      bg="interactive"
    >
      <Box row gap="s">
        {/* Posts Tab */}
        <Pressable
          onPress={() => onTabChange('posts')}
          rounded="2xl"
          alignCenter
          justifyCenter
          px="xl"
          py="m"
          bg={activeTab === 'posts' ? 'primaryDark' : 'background'}
          style={{
            borderWidth: 1,
            borderColor: activeTab === 'posts' ? colors.primaryDark : colors.background,
          }}
        >
          <Text size="md" color="text">
            {isViewingOtherUser ? 'Posts' : 'My Posts'}
          </Text>
        </Pressable>

        {/* Settings Tab - Only for own profile */}
        {!isViewingOtherUser && (
          <Pressable
            onPress={() => onTabChange('settings')}
            rounded="2xl"
            alignCenter
            justifyCenter
            px="xl"
            py="m"
            bg={activeTab === 'settings' ? 'primaryDark' : 'background'}
            style={{
              borderWidth: 1,
              borderColor: activeTab === 'settings' ? colors.primaryDark : colors.background,
            }}
          >
            <Text size="md" color="text">
              Settings
            </Text>
          </Pressable>
        )}
      </Box>

      {/* Share Button */}
      <Pressable
        onPress={onSharePress}
        rounded="full"
        alignCenter
        justifyCenter
        width={40}
        height={32}
        bg="background"
        style={{
          borderWidth: 1,
          borderColor: colors.background,
        }}
      >
        <Monicon name="mdi-light:share" size={24} color={colors.text} />
      </Pressable>
    </Box>
  );
};

export default ProfileTabs;
