import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DealCard from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useProfile } from '../../hooks/useProfile';

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
              <MaterialCommunityIcons name="arrow-left" size={24} color="#404040" />
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
          <MaterialCommunityIcons name="share-variant" size={16} color="#000" />
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
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1, // Add this - allows content to grow and fill space
  },
  
  userProfileContainer: {
    paddingVertical: 16,
    paddingHorizontal: 17,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D8D8D8',
  },
  
  backButtonContainer: {
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5', // Changed from '#fff' to grey
  },
  
  extraSpacing: {
    width: 20,
  },
  
  contentArea: {
    backgroundColor: '#F5F5F5',
    flex: 1,
    paddingTop: 0,
  },
  
  header: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 117,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 24,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.48,
    lineHeight: 24,
    marginTop: -1,
  },
  editButton: {
    padding: 4,
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    letterSpacing: 0.36,
    lineHeight: 20,
  },
  location: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    letterSpacing: 0.36,
    lineHeight: 15,
  },

  profilePhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 75,
    height: 75,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#FFA05C',
  },

  statsContainer: {
    paddingTop: 15,
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA05C',
    marginRight: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },

  actionButton: {
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareActionButton: {
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
  },
  activeButton: {
    backgroundColor: '#FF8C4C',
    borderColor: '#FF8C4C',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#000',
  },
  activeButtonText: {
    color: '#000',
  },
  shareButtonIcon: {
    color: '#000',
  },

  textContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
    padding: 16,
  },
  
  contentText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    // borderBottomWidth: 1, // This was creating the separator
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginLeft: 10,
  },
  settingArrow: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalViewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalOptionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  deleteText: {
    color: 'red',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  skeletonUsername: {
    width: 150,
    height: 24,
    marginBottom: 6,
  },
  skeletonEditButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  skeletonJoinDate: {
    width: 120,
    height: 14,
    marginBottom: 4,
  },
  skeletonLocation: {
    width: 100,
    height: 14,
    marginBottom: 8,
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
    borderRadius: 20,
    width: 80,
  },
  skeletonShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 6,
    paddingHorizontal: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 34,
  },
  skeletonNavItem: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  // Skeleton loading styles
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  postsContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 100,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%',
  },
  leftCard: {
    marginBottom: 4,
    marginRight: 2,
  },
  rightCard: {
    marginBottom: 4,
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
    width: '100%',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Inter',
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
},
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#FFA05C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  verticalInteractions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  verticalVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verticalVoteButton: {
    padding: 4,
  },
  upvoted: {
    backgroundColor: '#FFA05C',
  },
  downvoted: {
    backgroundColor: '#FFA05C',
  },
  verticalVoteCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 8,
  },
  verticalVoteSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#000',
    marginHorizontal: 8,
  },
  verticalFavoriteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favorited: {
    backgroundColor: '#FF8C4C',
  },
  verticalDeleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfilePage;