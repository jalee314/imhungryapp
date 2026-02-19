/**
 * @file ProfileContainer — Composed container that wires useProfile
 * to all feature-scoped section components.
 *
 * This component is the single composition root for the profile feature.
 * The legacy ProfilePage re-exports it for navigation compatibility.
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { useAdmin } from '../../hooks/useAdmin';
import { useProfile } from '../../hooks/useProfile';
import { STATIC, GRAY } from '../../ui/alf';
import { Box } from '../../ui/primitives';

import {
  ProfileSkeleton,
  ProfileHeaderSection,
  ProfileTabBar,
  ProfilePostsSection,
  ProfileSettingsSection,
  LogoutModal,
  DeleteAccountModal,
} from './sections';

// ============================================================================
// Component
// ============================================================================

const ProfileContainer: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const ctx = useProfile({ navigation, route });

  // Admin mode for switching between admin portal and standard profile
  const { isAdmin, isAdminMode, enterAdminMode, exitAdminMode } = useAdmin();

  // Skeleton when no data
  if (!ctx.hasData) {
    return <ProfileSkeleton />;
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* User Profile Header */}
        <ProfileHeaderSection
          displayName={ctx.displayName}
          joinDateText={ctx.joinDateText}
          locationCity={ctx.locationCity}
          photoUrl={ctx.photoUrl}
          isViewingOtherUser={ctx.isViewingOtherUser}
          onGoBack={ctx.onGoBack}
          onProfilePhotoPress={ctx.onProfilePhotoPress}
        />

        {/* Tabs */}
        <ProfileTabBar
          activeTab={ctx.activeTab}
          isViewingOtherUser={ctx.isViewingOtherUser}
          onTabChange={ctx.setActiveTab}
          onShareProfile={ctx.onShareProfile}
        />

        {/* Content Area */}
        <Box bg={GRAY[100]} flex={1}>
          {ctx.activeTab === 'posts' && (
            <ProfilePostsSection
              userPosts={ctx.userPosts}
              postsLoading={ctx.postsLoading}
              postsInitialized={ctx.postsInitialized}
              postsError={ctx.postsError}
              isViewingOtherUser={ctx.isViewingOtherUser}
              onUpvote={ctx.onUpvote}
              onDownvote={ctx.onDownvote}
              onDealPress={ctx.onDealPress}
              onDeletePost={ctx.onDeletePost}
              onRetryLoadPosts={ctx.onRetryLoadPosts}
            />
          )}

          {ctx.activeTab === 'settings' && !ctx.isViewingOtherUser && (
            <ProfileSettingsSection
              navigation={navigation}
              isAdmin={isAdmin}
              isAdminMode={isAdminMode}
              onEditProfile={ctx.onEditProfile}
              onEnterAdminMode={enterAdminMode}
              onExitAdminMode={exitAdminMode}
              onLogout={ctx.openLogoutModal}
              onDeleteAccount={ctx.openDeleteModal}
            />
          )}
        </Box>
      </ScrollView>

      {/* Logout Modal */}
      <LogoutModal
        visible={ctx.showLogoutModal}
        onClose={ctx.closeLogoutModal}
        onConfirm={ctx.confirmLogout}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={ctx.showDeleteModal}
        onClose={ctx.closeDeleteModal}
        onConfirm={ctx.confirmDeleteAccount}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: STATIC.white },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});

export default ProfileContainer;
