/**
 * ProfilePage - Profile Screen
 * 
 * Refactored to use design tokens, atoms, and extracted components.
 * This screen is now a thin composition layer.
 */

import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Box } from '../../components/atoms';
import { colors } from '../../lib/theme';
import { useProfile } from '../../features/profile';
import { useAdmin } from '../../hooks/useAdmin';
import {
  ProfileHeader,
  ProfileTabs,
  PostsGrid,
  SettingsList,
  LogoutModal,
  DeleteAccountModal,
} from '../../features/profile/components';

interface ProfilePageProps {}

const ProfilePage: React.FC<ProfilePageProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const {
    profile,
    photoUrl,
    dealCount,
    userPosts,
    hasData,
    activeTab,
    postsLoading,
    postsInitialized,
    postsError,
    displayName,
    joinDateText,
    locationCity,
    isViewingOtherUser,
    showLogoutModal,
    showDeleteModal,
    setActiveTab,
    onRetryLoadPosts,
    onUpvote,
    onDownvote,
    onFavorite,
    onDealPress,
    onDeletePost,
    onEditProfile,
    onProfilePhotoPress,
    onProfileTabReselect,
    onShareProfile,
    onGoBack,
    openLogoutModal,
    closeLogoutModal,
    confirmLogout,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteAccount,
  } = useProfile({ navigation, route });

  const { isAdmin, isAdminMode, enterAdminMode, exitAdminMode } = useAdmin();

  const containerStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  // Loading skeleton
  if (!hasData) {
    return (
      <SafeAreaView style={containerStyle}>
        <StatusBar style="dark" />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ProfileHeader
            displayName=""
            joinDateText=""
            locationCity=""
            photoUrl={null}
            isViewingOtherUser={false}
            isLoading={true}
          />
          <ProfileTabs
            activeTab="posts"
            onTabChange={() => {}}
            onSharePress={() => {}}
            isViewingOtherUser={false}
            isLoading={true}
          />
          <Box flex={1} bg="interactive">
            <PostsGrid
              posts={[]}
              isLoading={true}
              isInitialized={false}
              error={null}
              isViewingOtherUser={false}
              onRetry={() => {}}
              onUpvote={() => {}}
              onDownvote={() => {}}
              onPress={() => {}}
              onDelete={() => {}}
            />
          </Box>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Profile Header */}
        <ProfileHeader
          displayName={displayName}
          joinDateText={joinDateText}
          locationCity={locationCity}
          photoUrl={photoUrl}
          isViewingOtherUser={isViewingOtherUser}
          onProfilePhotoPress={onProfilePhotoPress}
          onGoBack={onGoBack}
        />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSharePress={onShareProfile}
          isViewingOtherUser={isViewingOtherUser}
        />

        {/* Content Area */}
        <Box flex={1} bg="interactive">
          {activeTab === 'posts' && (
            <PostsGrid
              posts={userPosts}
              isLoading={postsLoading}
              isInitialized={postsInitialized}
              error={postsError}
              isViewingOtherUser={isViewingOtherUser}
              onRetry={onRetryLoadPosts}
              onUpvote={onUpvote}
              onDownvote={onDownvote}
              onPress={onDealPress}
              onDelete={onDeletePost}
            />
          )}

          {activeTab === 'settings' && !isViewingOtherUser && (
            <SettingsList
              onEditProfile={onEditProfile}
              onNavigateToFAQ={() => navigation.navigate('FAQPage' as never)}
              onNavigateToPrivacy={() => navigation.navigate('PrivacyPolicyPage' as never)}
              onNavigateToTerms={() => navigation.navigate('TermsConditionsPage' as never)}
              onNavigateToContact={() => navigation.navigate('ContactUsPage' as never)}
              onNavigateToBlocked={() => navigation.navigate('BlockedUsersPage' as never)}
              onLogout={openLogoutModal}
              onDeleteAccount={openDeleteModal}
              isAdmin={isAdmin}
              isAdminMode={isAdminMode}
              onToggleAdminMode={isAdminMode ? exitAdminMode : enterAdminMode}
            />
          )}
        </Box>
      </ScrollView>

      {/* Modals */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={closeLogoutModal}
        onConfirm={confirmLogout}
      />
      
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteAccount}
      />
    </SafeAreaView>
  );
};

export default ProfilePage;
