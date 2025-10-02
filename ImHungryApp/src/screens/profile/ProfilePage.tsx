import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, 
  TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import BottomNavigation from '../../components/BottomNavigation';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchUserData, getFullUserProfile, clearUserCache } from '../../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileCacheService } from '../../services/profileCacheService';
import { signOut } from '../../services/sessionService';
import DealCard, { Deal } from '../../components/DealCard';
import DealCardSkeleton from '../../components/DealCardSkeleton';
import { loadCompleteUserProfile, loadCriticalProfileData, updateUserProfileCache } from '../../services/profileLoadingService';
import { UserProfileCache } from '../../services/userProfileService';
import { fetchUserPosts, deleteDeal, transformDealForUI } from '../../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../services/voteService';
import { logClick } from '../../services/interactionService';
import { 
  uploadProfilePhoto, 
  handleTakePhoto, 
  handleChooseFromLibrary, 
  handleUserLogout, 
  handleAccountDeletion 
} from '../../services/profileActionsService';
import { 
  formatJoinDate, 
  getDisplayName, 
  getUsernameFontSize, 
  showProfilePhotoOptions,
  showLogoutConfirmation,
  showDeleteAccountConfirmation
} from '../../services/profileUtilsService';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Get route parameters for viewing other users
  const { viewUser, username, userId } = route.params as any || {};
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);
  const [dealCount, setDealCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings' | 'share'>('posts');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Simple cache for user profiles to avoid re-fetching
  const [userProfileCache, setUserProfileCache] = useState<Map<string, UserProfileCache>>(new Map());

  // Only show loading skeleton if we have NO data at all
  const [hasData, setHasData] = useState(false);

  const [userPosts, setUserPosts] = useState<Deal[]>([]);
  const [postsError, setPostsError] = useState<string | null>(null);

  

  // Instagram-style loading: Show cache immediately, update in background
  const loadProfileData = async () => {
    try {
      // 1. IMMEDIATELY show cached data (if available)
      const cached = await ProfileCacheService.getCachedProfile();
      if (cached) {
        setProfile(cached.profile);
        setPhotoUrl(cached.photoUrl);
        setCurrentUserPhotoUrl(cached.photoUrl); // Also set current user's photo
        setDealCount(cached.dealCount);
        setHasData(true); // We have data, no need for skeleton
      }

      // 2. Fetch fresh data in background (NO visible loading)
      const freshData = await ProfileCacheService.fetchFreshProfile();
      
      if (freshData) {
        // Only update if data actually changed
        const dataChanged = JSON.stringify(freshData.profile) !== JSON.stringify(profile) ||
                            freshData.photoUrl !== photoUrl ||
                            freshData.dealCount !== dealCount;
        
        if (dataChanged) {
          setProfile(freshData.profile);
          setPhotoUrl(freshData.photoUrl);
          setCurrentUserPhotoUrl(freshData.photoUrl); // Also set current user's photo
          setDealCount(freshData.dealCount);
          
          // Cache the fresh data for next time
          await ProfileCacheService.setCachedProfile(freshData.profile, freshData.photoUrl, freshData.dealCount);
        }
      }
      
      // If no cached data was available, we're done loading
      if (!cached) {
        setHasData(true);
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setHasData(true); // Show UI even if there's an error
    }
  };

  useEffect(() => {
    if (viewUser && userId) {
      loadOtherUserProfile(userId);
    } else {
      loadProfileData();
    }
  }, [viewUser, userId]);

  // Only reload if no data exists
  useFocusEffect(
    React.useCallback(() => {
      if (!hasData) {
        loadProfileData();
      }
    }, [hasData])
  );

  // Force refresh when user updates profile (still no visible loading)
  const refreshProfile = async () => {
    const freshData = await ProfileCacheService.forceRefresh();
    if (freshData) {
      setProfile(freshData.profile);
      setPhotoUrl(freshData.photoUrl);
      setCurrentUserPhotoUrl(freshData.photoUrl); // Also set current user's photo
      setDealCount(freshData.dealCount);
    }
  };

  // Load another user's profile using the new service
  const loadOtherUserProfile = async (targetUserId: string) => {
    try {
      setLoading(true);
      setProfileLoading(true);
      
      // Phase 1: Load critical profile data first (fast display)
      console.log('Loading critical profile data for user:', targetUserId);
      const criticalData = await loadCriticalProfileData(targetUserId, currentUserPhotoUrl);
      
      // Update state with critical data immediately
      setProfile(criticalData.profile);
      setPhotoUrl(criticalData.photoUrl);
      setCurrentUserPhotoUrl(criticalData.currentUserPhotoUrl || null);
      setUserData(criticalData.userData);
      setDealCount(criticalData.dealCount);
      setHasData(true);
      setLoading(false);
      setProfileLoading(false);
      
      // Phase 2: Load posts in background (non-blocking)
      console.log('Loading posts in background for user:', targetUserId);
      setPostsLoading(true);
      
      try {
        const { fetchUserPosts } = await import('../../services/userPostsService');
        const posts = await fetchUserPosts(targetUserId, 20);
        const { updatePostsWithUserInfo } = await import('../../services/userPostsService');
        const updatedPosts = updatePostsWithUserInfo(posts, criticalData.userData.username, criticalData.photoUrl);
        
        setUserPosts(updatedPosts);
        
        // Update cache with complete data
        const cacheData = {
          profile: criticalData.profile,
          photoUrl: criticalData.photoUrl,
          dealCount: criticalData.dealCount,
          userData: criticalData.userData,
          userPosts: updatedPosts
        };
        setUserProfileCache(prev => updateUserProfileCache(prev, targetUserId, cacheData));
        
      } catch (postsError) {
        console.error('Error loading posts (non-critical):', postsError);
        // Don't show error to user since posts are non-critical
      } finally {
        setPostsLoading(false);
      }
      
    } catch (error) {
      console.error('Error loading other user profile:', error);
      Alert.alert('Error', 'Could not load user profile');
      setLoading(false);
      setProfileLoading(false);
      setPostsLoading(false);
    }
  };

  // Add the new useFocusEffect here:
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh profile data for current user, not when viewing other users
      if (!viewUser) {
        refreshProfile();
      }
    }, [viewUser])
  );

  // Use utility functions from service
  const getDisplayNameValue = () => getDisplayName(userData, profile);
  const getUsernameFontSizeValue = () => getUsernameFontSize(getDisplayNameValue());

  
  const handleEditProfile = () => {
    // Add validation before navigation
    console.log('Profile being passed to edit:', JSON.stringify(profile, null, 2));
    
    if (!profile || !profile.user_id) {
      Alert.alert('Error', 'Profile data not available. Please try again.');
      return;
    }
    
    (navigation as any).navigate('ProfileEdit', { profile });
  };

  const handleProfilePhotoPress = () => {
    showProfilePhotoOptions(
      () => handleTakePhoto(uploadPhoto),
      () => handleChooseFromLibrary(uploadPhoto)
    );
  };

  // Photo handling functions moved to service

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await handleUserLogout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    showDeleteAccountConfirmation(
      async () => {
        setShowDeleteModal(false);
        const success = await handleAccountDeletion(profile);
        if (success) {
          // Navigate to login page
          (navigation as any).navigate('LogIn');
        }
      },
      () => setShowDeleteModal(false)
    );
  };

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false);
  };

  const uploadPhoto = async (photoUri: string) => {
    await uploadProfilePhoto(
      photoUri,
      profile,
      setPhotoUrl,
      setCurrentUserPhotoUrl,
      refreshProfile
    );
  };

  const loadUserPosts = async () => {
    try {
      console.log('loadUserPosts called - viewUser:', viewUser);
      if (viewUser) {
        console.log('Skipping loadUserPosts because viewing another user');
        return;
      }
      setPostsLoading(true);
      setPostsError(null);
      const posts = await fetchUserPosts();
      const transformedPosts = posts.map(transformDealForUI);
      setUserPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
      setPostsError('Failed to load your posts');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts' && hasData && !viewUser) {
      loadUserPosts();
    }
  }, [activeTab, hasData, viewUser]);

  const handleUpvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
    setUserPosts(prevPosts => {
      return prevPosts.map(d => {
        if (d.id === dealId) {
          originalDeal = d;
          const wasUpvoted = d.isUpvoted;
          const wasDownvoted = d.isDownvoted;
          
          return {
            ...d,
            isUpvoted: !wasUpvoted,
            isDownvoted: false,
            votes: wasUpvoted 
              ? d.votes - 1
              : (wasDownvoted ? d.votes + 2 : d.votes + 1)
          };
        }
        return d;
      });
    });

    toggleUpvote(dealId).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      if (originalDeal) {
        setUserPosts(prevPosts => prevPosts.map(d => 
          d.id === dealId ? originalDeal! : d
        ));
      }
    });
  };

  const handleDownvote = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
    setUserPosts(prevPosts => {
      return prevPosts.map(d => {
        if (d.id === dealId) {
          originalDeal = d;
          const wasDownvoted = d.isDownvoted;
          const wasUpvoted = d.isUpvoted;
          
          return {
            ...d,
            isDownvoted: !wasDownvoted,
            isUpvoted: false,
            votes: wasDownvoted 
              ? d.votes + 1
              : (wasUpvoted ? d.votes - 2 : d.votes - 1)
          };
        }
        return d;
      });
    });

    toggleDownvote(dealId).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      if (originalDeal) {
        setUserPosts(prevPosts => prevPosts.map(d => 
          d.id === dealId ? originalDeal! : d
        ));
      }
    });
  };

  const handleFavorite = (dealId: string) => {
    let originalDeal: Deal | undefined;
    
    setUserPosts(prevPosts => {
      return prevPosts.map(d => {
        if (d.id === dealId) {
          originalDeal = d;
          return {
            ...d,
            isFavorited: !d.isFavorited
          };
        }
        return d;
      });
    });

    const wasFavorited = originalDeal?.isFavorited || false;
    
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      if (originalDeal) {
        setUserPosts(prevPosts => prevPosts.map(d => 
          d.id === dealId ? originalDeal! : d
        ));
      }
    });
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = userPosts.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = userPosts.findIndex(d => d.id === dealId);
      
      logClick(dealId, positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
        console.error('Failed to log click:', err);
      });
      
      (navigation as any).navigate('DealDetail', { deal: selectedDeal });
    }
  };

  const handleDeletePost = async (dealId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteDeal(dealId);
              
              if (result.success) {
                // Remove from local state
                setUserPosts(prevPosts => prevPosts.filter(post => post.id !== dealId));
                
                // Update deal count
                setDealCount(prev => Math.max(0, prev - 1));
                
                Alert.alert('Success', 'Post deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete post');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const handleProfileTabPress = () => {
    // Reset to current user's profile when profile tab is pressed
    if (viewUser) {
      // Reset state to show current user's profile
      setProfile(null);
      setPhotoUrl(null);
      setUserData(null);
      setUserPosts([]);
      setDealCount(0);
      setHasData(false);
      
      // Load current user's profile data
      loadProfileData();
    }
  };

  // Show skeleton only if we have NO data at all
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
                  {/* Username skeleton */}
                  <View style={[styles.skeleton, styles.skeletonUsername]} />
                  <View style={[styles.skeleton, styles.skeletonEditButton]} />
                </View>
                {/* Join date skeleton */}
                <View style={[styles.skeleton, styles.skeletonJoinDate]} />
                {/* Location skeleton */}
                <View style={[styles.skeleton, styles.skeletonLocation]} />
                
                {/* Stats skeleton */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <View style={[styles.skeleton, styles.skeletonStatNumber]} />
                    <View style={[styles.skeleton, styles.skeletonStatLabel]} />
                  </View>
                </View>
              </View>
              
              <View style={styles.rightSection}>
                {/* Profile photo skeleton */}
                <View style={[styles.skeleton, styles.skeletonProfilePhoto]} />
              </View>
            </View>
          </View>

          {/* Content area skeleton */}
          <View style={styles.contentArea}>
            <View style={styles.actionButtonsContainer}>
              <View style={[styles.skeleton, styles.skeletonButton]} />
              <View style={[styles.skeleton, styles.skeletonButton]} />
              <View style={styles.extraSpacing} />
              <View style={[styles.skeleton, styles.skeletonButton]} />
            </View>
          </View>
          
          {/* Show skeleton bottom nav */}
          <View style={styles.skeletonBottomNav}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View key={index} style={[styles.skeleton, styles.skeletonNavItem]} />
            ))}
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
        {viewUser && (
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
              <Text style={[styles.userName, { fontSize: getUsernameFontSizeValue() }]}>{getDisplayNameValue()}</Text>
              {!viewUser && (
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#000" />
                </TouchableOpacity>
              )}
            </View>
              <Text style={styles.joinDate}>{formatJoinDate(profile)}</Text>
              <Text style={styles.location}>{profile?.location_city || 'Location not set'}</Text>
              
              {/* Statistics with real deal count */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{dealCount}</Text>
                  <Text style={styles.statLabel}>Deals Posted</Text>
                </View>
              </View>
          </View>
          
          <View style={styles.rightSection}>
              {!viewUser ? (
                <TouchableOpacity 
                  style={styles.profilePhotoContainer}
                  onPress={handleProfilePhotoPress}
                >
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
                  ) : (
                    <View style={[styles.profilePhoto, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="account" size={40} color="#999" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.profilePhotoContainer}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
                  ) : (
                    <View style={[styles.profilePhoto, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="account" size={40} color="#999" />
                    </View>
                  )}
                </View>
              )}
          </View>
          </View>
        </View>

        {/* Gray Scrollable Content Container */}
        <View style={styles.contentArea}>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, activeTab === 'posts' && styles.activeButton]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.actionButtonText, activeTab === 'posts' && styles.activeButtonText]}>
              {viewUser ? 'Posts' : 'My Posts'}
            </Text>
          </TouchableOpacity>
          
          {!viewUser && (
            <TouchableOpacity 
              style={[styles.actionButton, activeTab === 'settings' && styles.activeButton]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.actionButtonText, activeTab === 'settings' && styles.activeButtonText]}>
                Settings
              </Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.extraSpacing} />
          
          <TouchableOpacity 
            style={[styles.shareActionButton, styles.shareActionButton]}
            onPress={() => setActiveTab('share')}
          >
            <Text style={styles.shareButtonText}>Share</Text>
            <MaterialCommunityIcons name="share-variant" size={16} color="#000" />
          </TouchableOpacity>
        </View>
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
                    onPress={loadUserPosts}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : userPosts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="food-off" size={48} color="#999" />
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <Text style={styles.emptySubtext}>
                    {viewUser ? 'This user hasn\'t posted any deals yet.' : 'Support the platform by posting food deals you see!'}
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
                        onUpvote={handleUpvote}
                        onDownvote={handleDownvote}
                        onPress={handleDealPress}
                        showDelete={!viewUser}
                        onDelete={handleDeletePost}
                        hideAuthor={true}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {activeTab === 'settings' && !viewUser && (
            <View style={styles.settingsList}>
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
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={20} color="#000" />
                <Text style={styles.settingText}>Log Out</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleDeleteAccount}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#000" />
                <Text style={styles.settingText}>Delete Account</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
              </View>
            )}
        </View>

      </ScrollView>
      
      {/* Bottom Navigation - Fixed at bottom */}
      <BottomNavigation 
        photoUrl={currentUserPhotoUrl} 
        activeTab="profile"
        onTabPress={(tab) => {
          if (tab === 'profile') {
            handleProfileTabPress();
          }
        }}
      />

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={confirmLogout}
            >
              <Text style={styles.modalOptionText}>Log Out</Text>
            </TouchableOpacity>
            <View style={styles.modalSeparator} />
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={cancelLogout}
            >
              <Text style={styles.modalOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeleteAccount}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={confirmDeleteAccount}
            >
              <Text style={styles.modalOptionText}>Delete Account</Text>
            </TouchableOpacity>
            <View style={styles.modalSeparator} />
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={cancelDeleteAccount}
            >
              <Text style={styles.modalOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  
  backButtonContainer: {
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingLeft: 5,
    paddingRight: 20,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center'
  },
  
  extraSpacing: {
    width: 20,
  },
  
  contentArea: {
    backgroundColor: '#F5F5F5',
    flex: 1, // This makes it fill remaining space
    paddingHorizontal: 20,
    paddingTop: 20,
    // Remove paddingBottom from here - it's already in dealsGrid
  },
  
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    paddingRight: 20,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: '#000',
  },
  editButton: {
    padding: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#000',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#000',
  },

  profilePhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 9999,
    borderWidth: 1,
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
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    minWidth: 95,
    borderColor: '#D8D8D8',
  },
  shareActionButton: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    minWidth: 95,
    borderColor: '#000',
    flexDirection: 'row',
    gap: 4,
  },
  activeButton: {
    backgroundColor: '#FFA05C',
    borderColor: '#D8D8D8'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  activeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
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
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFA05C',
    overflow: 'hidden',
    marginBottom: 100, // Add this so settings also has space for bottom nav
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalOption: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '400',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 0,
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  skeletonUsername: {
    width: 120,
    height: 26,
    marginBottom: 4,
  },
  skeletonEditButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  skeletonJoinDate: {
    width: 150,
    height: 12,
    marginBottom: 2,
  },
  skeletonLocation: {
    width: 100,
    height: 12,
    marginBottom: 15,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E1E9EE',
  },
  skeletonButton: {
    flex: 1,
    height: 35,
    borderRadius: 20,
    minWidth: 95,
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
    marginHorizontal: -20, // Counteract contentArea's paddingHorizontal: 20
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 100, // Keep this - only padding needed for bottom nav
  },
  leftCard: {
    width: '43%',
    marginBottom: 8,
  },
  rightCard: {
    width: '43%', 
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    width: '100%',
    marginLeft: 40,

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