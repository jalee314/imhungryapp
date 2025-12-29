import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Monicon } from '@monicon/native';
import DealCard from '#/components/cards/DealCard';
import DealCardSkeleton from '#/components/DealCardSkeleton';
import SkeletonLoader from '#/components/SkeletonLoader';
import { useProfile } from '../hooks/useProfile';
import { tokens, atoms as a } from '#/ui';

interface ProfilePageProps {}

interface UserProfile {
  [key: string]: any;
  display_name?: string | null;
  profile_photo?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  date_created?: string | null;
  inserted_at?: string | null;
  created?: string | null;
  registered_at?: string | null;
  signup_date?: string | null;
}

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
    openLogoutModal,
    closeLogoutModal,
    confirmLogout,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteAccount,
  } = useProfile({ navigation, route });

  // All data/state/handlers now come from useProfile hook

  // Skeleton when no data
  if (!hasData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Loading Skeleton */}
          <View style={styles.userProfileContainer}>
            <View style={styles.header}>
              <View style={styles.leftSection}>
                <View style={styles.userInfo}>
                  <View>
                    {/* Username skeleton */}
                    <SkeletonLoader width={150} height={24} borderRadius={4} style={{ marginBottom: 6 }} />
                    {/* Join date skeleton */}
                    <SkeletonLoader width={120} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                    {/* Location skeleton */}
                    <SkeletonLoader width={100} height={14} borderRadius={4} />
                  </View>
                </View>
              </View>
              
              <View style={styles.rightSection}>
                {/* Profile photo skeleton */}
                <SkeletonLoader width={75} height={75} borderRadius={37.5} />
              </View>
            </View>
          </View>

          {/* Tabs Section Skeleton */}
          <View style={styles.actionButtonsContainer}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <SkeletonLoader width={80} height={35} borderRadius={20} />
              <SkeletonLoader width={80} height={35} borderRadius={20} />
            </View>
            <SkeletonLoader width={40} height={32} borderRadius={12} />
          </View>

          {/* Content area skeleton - Grid of posts */}
          <View style={styles.contentArea}>
            <View style={styles.dealsGrid}>
              {[1, 2, 3, 4, 5, 6].map((item, index) => (
                <View key={item} style={[
                  index % 2 === 0 ? styles.leftCard : styles.rightCard
                ]}>
                  <DealCardSkeleton variant="vertical" />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent} // Add this
      >
        
        {/* User Profile Container */}
        <View style={styles.userProfileContainer}>
        {/* Back Button for Other Users */}
        {isViewingOtherUser && (
          <View style={styles.backButtonContainer}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Header Section with Profile Photo */}
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={styles.userInfo}>
              <View>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.joinDate}>{joinDateText}</Text>
                <Text style={styles.location}>{locationCity}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.rightSection}>
              {!isViewingOtherUser ? (
                <TouchableOpacity 
                  style={styles.profilePhotoContainer}
                  onPress={onProfilePhotoPress}
                >
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
                  ) : (
                    <View style={[styles.profilePhoto, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="account" size={35} color="#999" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.profilePhotoContainer}>
                  {photoUrl ? (
                    <Image 
                      key={photoUrl} // Force re-render when URL changes
                      source={{ uri: photoUrl }} 
                      style={styles.profilePhoto}
                      onError={(e) => console.log('❌ Image load error:', e.nativeEvent.error)}
                      onLoad={() => console.log('✅ Image loaded successfully:', photoUrl)}
                    />
                  ) : (
                    <View style={[styles.profilePhoto, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="account" size={35} color="#999" />
                    </View>
                  )}
                </View>
              )}
          </View>
        </View>
        </View>

        {/* Tabs Section */}
        <View style={styles.actionButtonsContainer}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity 
            style={[styles.actionButton, activeTab === 'posts' && styles.activeButton]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.actionButtonText, activeTab === 'posts' && styles.activeButtonText]}>
              {isViewingOtherUser ? 'Posts' : 'My Posts'}
            </Text>
          </TouchableOpacity>
          
          {!isViewingOtherUser && (
            <TouchableOpacity 
              style={[styles.actionButton, activeTab === 'settings' && styles.activeButton]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.actionButtonText, activeTab === 'settings' && styles.activeButtonText]}>
                Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
          <TouchableOpacity 
            style={styles.shareActionButton}
            onPress={onShareProfile}
          >
          <Monicon name="mdi-light:share" size={24} color="#000" />
        </TouchableOpacity>
        </View>

        {/* Gray Scrollable Content Container */}
        <View style={styles.contentArea}>
          {activeTab === 'posts' && (
            <View style={styles.postsContainer}>
              {postsLoading ? (
                <View style={styles.dealsGrid}>
                  {[1, 2, 3, 4, 5, 6].map((item, index) => (
                    <View key={item} style={[
                      index % 2 === 0 ? styles.leftCard : styles.rightCard
                    ]}>
                      <DealCardSkeleton variant="vertical" />
                    </View>
                  ))}
                </View>
              ) : postsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{postsError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={onRetryLoadPosts}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : userPosts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="food-off" size={48} color="#999" />
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <Text style={styles.emptySubtext}>
                    {isViewingOtherUser ? 'This user hasn\'t posted any deals yet.' : 'Support the platform by posting food deals you see!'}
                  </Text>
                </View>
              ) : (
                <View style={styles.dealsGrid}>
                  {userPosts.map((post, index) => (
                    <View key={post.id} style={[
                      index % 2 === 0 ? styles.leftCard : styles.rightCard
                    ]}>
                      <DealCard
                        deal={post}
                        variant="vertical"
                        onUpvote={onUpvote}
                        onDownvote={onDownvote}
                        onPress={onDealPress}
                        showDelete={!isViewingOtherUser}
                        onDelete={onDeletePost}
                        hideAuthor={true}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {activeTab === 'settings' && !isViewingOtherUser && (
            <View style={styles.settingsList}>
              {/* Add Profile option at the top */}
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={onEditProfile}
              >
                <MaterialCommunityIcons name="account-edit" size={20} color="#000" />
                <Text style={styles.settingText}>Profile</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('FAQPage' as never)}
              >
                <MaterialCommunityIcons name="help-circle" size={20} color="#000" />
                <Text style={styles.settingText}>FAQ</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PrivacyPolicyPage' as never)}
              >
                <MaterialCommunityIcons name="file-document" size={20} color="#000" />
                <Text style={styles.settingText}>Privacy & Policy</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('TermsConditionsPage' as never)}
              >
                <MaterialCommunityIcons name="file-document" size={20} color="#000" />
                <Text style={styles.settingText}>Terms & Conditions</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => (navigation as any).navigate('ContactUsPage')}
              >
                <MaterialCommunityIcons name="headphones" size={20} color="#000" />
                <Text style={styles.settingText}>Contact Us</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => (navigation as any).navigate('BlockedUsersPage')}
              >
                <MaterialCommunityIcons name="account-cancel" size={20} color="#000" />
                <Text style={styles.settingText}>Blocked Users</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={openLogoutModal}
              >
                <MaterialCommunityIcons name="logout" size={20} color="#000" />
                <Text style={styles.settingText}>Log Out</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={openDeleteModal}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#000" />
                <Text style={styles.settingText}>Delete Account</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
              </View>
            )}
        </View>

      </ScrollView>
      

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeLogoutModal}
      >
        <TouchableWithoutFeedback onPress={closeLogoutModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalViewContainer}>
                <View style={styles.modalContent}>
                  <TouchableOpacity style={styles.modalOption} onPress={confirmLogout}>
                    <Text style={styles.modalOptionText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={closeLogoutModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <TouchableWithoutFeedback onPress={closeDeleteModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalViewContainer}>
                <View style={styles.modalContent}>
                  <TouchableOpacity style={styles.modalOption} onPress={confirmDeleteAccount}>
                    <Text style={[styles.modalOptionText, styles.deleteText]}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={closeDeleteModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  scrollView: {
    ...a.flex_1,
  },
  scrollViewContent: {
    flexGrow: 1, // Add this - allows content to grow and fill space
  },
  
  userProfileContainer: {
    paddingVertical: tokens.space.lg,
    paddingHorizontal: 17,
    ...a.bg_white,
    borderBottomWidth: 0.5,
    ...a.border_gray_300,
  },
  
  backButtonContainer: {
    paddingHorizontal: tokens.space.lg,
  },
  backButton: {
    padding: tokens.space.xs,
  },
  
  actionButtonsContainer: {
    ...a.flex_row,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
    gap: tokens.space.xs,
    ...a.items_center,
    ...a.justify_between,
    ...a.bg_gray_100,
  },
  
  extraSpacing: {
    width: tokens.space.xl,
  },
  
  contentArea: {
    ...a.bg_gray_100,
    ...a.flex_1,
    paddingTop: 0,
  },
  
  header: {
    ...a.flex_row,
    paddingTop: tokens.space.lg,
    paddingBottom: 0,
    ...a.items_center,
    ...a.justify_between,
    height: 117,
  },
  leftSection: {
    ...a.flex_1,
    flexDirection: 'column',
    gap: tokens.space._2xl,
    ...a.justify_center,
    alignSelf: 'stretch',
  },
  rightSection: {
    ...a.items_center,
    ...a.justify_center,
  },
  userInfo: {
    ...a.flex_row,
    alignItems: 'flex-start',
    gap: tokens.space.sm,
  },
  userName: {
    fontSize: tokens.fontSize._2xl,
    fontWeight: '800',
    ...a.text_black,
    letterSpacing: 0.48,
    lineHeight: 24,
    marginTop: -1,
  },
  editButton: {
    padding: tokens.space.xs,
  },
  joinDate: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_black,
    letterSpacing: 0.36,
    lineHeight: 20,
  },
  location: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_black,
    letterSpacing: 0.36,
    lineHeight: 15,
  },

  profilePhotoContainer: {
    ...a.items_center,
    ...a.justify_center,
  },
  profilePhoto: {
    width: 85,
    height: 85,
    borderRadius: tokens.space._5xl,
    borderWidth: 2,
    ...a.border_primary_500,
  },

  statsContainer: {
    paddingTop: 15,
    ...a.justify_center,
  },
  statItem: {
    ...a.flex_row,
    ...a.items_center,
    ...a.flex_1,
  },
  statNumber: {
    fontSize: tokens.fontSize._2xl,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_primary_500,
    marginRight: 10,
  },
  statLabel: {
    fontSize: tokens.fontSize.xs,
    ...a.text_black,
    ...a.text_center,
  },

  actionButton: {
    borderRadius: tokens.space.xl,
    ...a.bg_white,
    borderWidth: 1,
    ...a.border_white,
    ...a.items_center,
    ...a.justify_center,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
  },
  shareActionButton: {
    borderRadius: 30,
    ...a.bg_white,
    borderWidth: 1,
    ...a.border_white,
    ...a.items_center,
    ...a.justify_center,
    width: 40,
    height: 32,
  },
  activeButton: {
    ...a.bg_primary_600,
    ...a.border_primary_600,
  },
  actionButtonText: {
    fontSize: tokens.fontSize.sm,
    ...a.text_black,
  },
  activeButtonText: {
    ...a.text_black,
  },
  shareButtonIcon: {
    ...a.text_black,
  },

  textContainer: {
    ...a.absolute,
    top: '50%',
    left: tokens.space.xl,
    right: tokens.space.xl,
    transform: [{ translateY: -50 }],
    padding: tokens.space.lg,
  },
  
  contentText: {
    fontSize: tokens.fontSize.md,
    color: '#333',
    ...a.text_center,
    lineHeight: 24,
  },
  
  settingsList: {
    ...a.bg_white,
    borderRadius: 10,
    ...a.overflow_hidden,
    marginHorizontal: tokens.space.lg,
    marginTop: tokens.space.lg,
    marginBottom: 100,
  },
  settingItem: {
    ...a.flex_row,
    ...a.items_center,
    paddingVertical: tokens.space.lg,
    paddingHorizontal: tokens.space.xl,
    // borderBottomWidth: 1, // This was creating the separator
  },
  settingText: {
    ...a.flex_1,
    fontSize: tokens.fontSize.md,
    ...a.text_black,
    fontWeight: tokens.fontWeight.medium,
    marginLeft: 10,
  },
  settingArrow: {
    fontSize: tokens.fontSize.xl,
    ...a.text_black,
    fontWeight: tokens.fontWeight.bold,
  },

  // Modal styles
  modalOverlay: {
    ...a.flex_1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    ...a.justify_end,
  },
  modalViewContainer: {
    paddingHorizontal: tokens.space.lg,
    paddingBottom: 90,
  },
  modalContent: {
    ...a.bg_white,
    borderRadius: 10,
    marginBottom: tokens.space.sm,
  },
  modalOption: {
    paddingVertical: tokens.space.lg,
    ...a.items_center,
  },
  modalOptionText: {
    fontFamily: 'Inter',
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.medium,
    ...a.text_black,
  },
  deleteText: {
    color: 'red',
  },
  cancelButton: {
    ...a.bg_white,
    borderRadius: 10,
    paddingVertical: tokens.space.lg,
    ...a.items_center,
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.medium,
    ...a.text_black,
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: tokens.space.xs,
  },
  skeletonUsername: {
    width: 150,
    height: 24,
    marginBottom: 6,
  },
  skeletonEditButton: {
    width: 24,
    height: 24,
    borderRadius: tokens.space.md,
    marginLeft: tokens.space.sm,
  },
  skeletonJoinDate: {
    width: 120,
    height: 14,
    marginBottom: tokens.space.xs,
  },
  skeletonLocation: {
    width: 100,
    height: 14,
    marginBottom: tokens.space.sm,
  },
  skeletonStatNumber: {
    width: 30,
    height: 24,
    marginRight: 10,
  },
  skeletonStatLabel: {
    width: 80,
    height: 12,
  },
  skeletonProfilePhoto: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#E1E9EE',
  },
  skeletonButton: {
    height: 35,
    borderRadius: tokens.space.xl,
    width: 80,
  },
  skeletonShareButton: {
    width: 40,
    height: 40,
    borderRadius: tokens.space.xl,
  },
  skeletonBottomNav: {
    ...a.absolute,
    bottom: 0,
    left: 0,
    right: 0,
    ...a.flex_row,
    ...a.bg_white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 6,
    paddingHorizontal: 15,
    justifyContent: 'space-around',
    ...a.items_center,
    paddingBottom: 34,
  },
  skeletonNavItem: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  // Skeleton loading styles
  loadingContainer: {
    ...a.justify_center,
    ...a.items_center,
  },
  loadingText: {
    marginTop: tokens.space.lg,
    fontSize: tokens.fontSize.md,
    ...a.text_gray_500,
  },
  postsContainer: {
    ...a.flex_1,
    ...a.w_full,
    justifyContent: 'flex-start',
    ...a.items_center,
  },
  dealsGrid: {
    ...a.flex_row,
    ...a.flex_wrap,
    justifyContent: 'flex-start',
    paddingTop: tokens.space.sm,
    paddingBottom: 100,
    paddingLeft: 10,
    paddingRight: 10,
    ...a.w_full,
  },
  leftCard: {
    marginBottom: tokens.space.xs,
    marginRight: 2,
  },
  rightCard: {
    marginBottom: tokens.space.xs,
    marginLeft: 2,
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: 60,
    paddingHorizontal: tokens.space._4xl,
    ...a.w_full,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_gray_500,
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    ...a.text_center,
    ...a.w_full,
  },
  emptySubtext: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_400,
    ...a.text_center,
    fontFamily: 'Inter',
    ...a.w_full,
  },
  errorContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: 60,
},
  errorText: {
    fontSize: tokens.fontSize.md,
    ...a.text_gray_500,
    ...a.text_center,
    marginBottom: tokens.space.lg,
    fontFamily: 'Inter',
  },
  retryButton: {
    ...a.bg_primary_500,
    paddingHorizontal: tokens.space._2xl,
    paddingVertical: tokens.space.md,
    borderRadius: tokens.space.sm,
  },
  retryButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.semibold,
    fontFamily: 'Inter',
  },
  verticalInteractions: {
    ...a.flex_row,
    ...a.items_center,
    marginBottom: 10,
  },
  verticalVoteContainer: {
    ...a.flex_row,
    ...a.items_center,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
  },
  verticalVoteButton: {
    padding: tokens.space.xs,
  },
  upvoted: {
    ...a.bg_primary_500,
  },
  downvoted: {
    ...a.bg_primary_500,
  },
  verticalVoteCount: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginHorizontal: tokens.space.sm,
  },
  verticalVoteSeparator: {
    width: 1,
    height: 12,
    ...a.bg_black,
    marginHorizontal: tokens.space.sm,
  },
  verticalFavoriteButton: {
    ...a.bg_white,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    ...a.justify_center,
    ...a.items_center,
  },
  favorited: {
    ...a.bg_primary_600,
  },
  verticalDeleteButton: {
    ...a.bg_white,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    ...a.justify_center,
    ...a.items_center,
  },
});

export default ProfilePage;