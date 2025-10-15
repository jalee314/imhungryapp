import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, 
  TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, ActivityIndicator,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
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
import { useDealUpdate } from '../../context/DealUpdateContext';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'settings' | 'share' >('posts');
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

  

  const { postAdded, setPostAdded } = useDealUpdate();

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
        console.log('📦 Fresh profile data fetched:', {
          hasPhotoUrl: !!freshData.photoUrl,
          photoUrl: freshData.photoUrl
        });
        
        // Only update if data actually changed
        const dataChanged = JSON.stringify(freshData.profile) !== JSON.stringify(profile) ||
                            freshData.photoUrl !== photoUrl ||
                            freshData.dealCount !== dealCount;
        
        if (dataChanged) {
          console.log('✅ Updating profile with new photo URL:', freshData.photoUrl);
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
      if (postAdded) {
        loadUserPosts();
        setPostAdded(false);
      }
      // Only refresh profile data for current user, not when viewing other users
      if (!viewUser) {
        refreshProfile();
      }
    }, [viewUser, postAdded])
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
      
      // 🔥 FIX: Prevent multiple simultaneous loads
      if (postsLoading) {
        console.log('Posts already loading, skipping...');
        return;
      }
      
      setPostsLoading(true);
      setPostsError(null);
      
      const posts = await fetchUserPosts();
      const transformedPosts = posts.map(transformDealForUI);
      
      // 🔥 FIX: Use Set to remove duplicates by deal_id
      const uniquePosts = Array.from(
        new Map(transformedPosts.map(post => [post.id, post])).values()
      );
      
      setUserPosts(uniquePosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
      setPostsError('Failed to load your posts');
    } finally {
      setPostsLoading(false);
    }
  };

  // 🔥 FIX: Add a ref to track if posts are loaded
  const postsLoadedRef = useRef(false);

  useEffect(() => {
    // Only load if we haven't loaded yet AND conditions are met
    if (activeTab === 'posts' && hasData && !viewUser && !postsLoadedRef.current) {
      postsLoadedRef.current = true; // Mark as loaded
      loadUserPosts();
    }
  }, [activeTab, hasData, viewUser]);

  // 🔥 FIX: Reset the ref when navigating away
  useFocusEffect(
    React.useCallback(() => {
      // When screen loses focus, reset the loaded flag
      return () => {
        postsLoadedRef.current = false;
      };
    }, [])
  );

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
    // FIRST: Find and capture the original deal state
    const originalDeal = userPosts.find(d => d.id === dealId);
    if (!originalDeal) {
      console.error('Deal not found:', dealId);
      return;
    }

    const wasFavorited = originalDeal.isFavorited;
    console.log('🔄 Toggling favorite for deal:', dealId, 'was favorited:', wasFavorited, '-> will be:', !wasFavorited);
    
    // SECOND: Optimistically update the UI
    setUserPosts(prevPosts => {
      return prevPosts.map(d => {
        if (d.id === dealId) {
          return {
            ...d,
            isFavorited: !wasFavorited
          };
        }
        return d;
      });
    });

    // THIRD: Save to database with the original state
    console.log('💾 Calling toggleFavorite with wasFavorited:', wasFavorited);
    
    toggleFavorite(dealId, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      // Revert to original state
      setUserPosts(prevPosts => prevPosts.map(d => 
        d.id === dealId ? originalDeal : d
      ));
    });
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = userPosts.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = userPosts.findIndex(d => d.id === dealId);
      
      // Log the click interaction with source 'profile'
      logClick(dealId, 'profile', positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
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
                  <View>
                    {/* Username skeleton */}
                    <View style={[styles.skeleton, styles.skeletonUsername]} />
                    {/* Join date skeleton */}
                    <View style={[styles.skeleton, styles.skeletonJoinDate]} />
                    {/* Location skeleton */}
                    <View style={[styles.skeleton, styles.skeletonLocation]} />
                  </View>
                </View>
              </View>
              
              <View style={styles.rightSection}>
                {/* Profile photo skeleton */}
                <View style={[styles.skeleton, styles.skeletonProfilePhoto]} />
              </View>
            </View>
          </View>

          {/* Tabs Section Skeleton */}
          <View style={styles.actionButtonsContainer}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={[styles.skeleton, styles.skeletonButton]} />
              <View style={[styles.skeleton, styles.skeletonButton]} />
            </View>
            <View style={[styles.skeleton, styles.skeletonShareButton]} />
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
              <View>
                <Text style={styles.userName}>{getDisplayNameValue()}</Text>
                <Text style={styles.joinDate}>{formatJoinDate(profile)}</Text>
                <Text style={styles.location}>{profile?.location_city || 'Location not set'}</Text>
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
        </View>
        
        <TouchableOpacity 
          style={styles.shareActionButton}
          onPress={() => setActiveTab('share')}
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
              {/* Add Profile option at the top */}
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleEditProfile}
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
      

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <TouchableWithoutFeedback onPress={cancelLogout}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalViewContainer}>
                <View style={styles.modalContent}>
                  <TouchableOpacity style={styles.modalOption} onPress={confirmLogout}>
                    <Text style={styles.modalOptionText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelLogout}>
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
        onRequestClose={cancelDeleteAccount}
      >
        <TouchableWithoutFeedback onPress={cancelDeleteAccount}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalViewContainer}>
                <View style={styles.modalContent}>
                  <TouchableOpacity style={styles.modalOption} onPress={confirmDeleteAccount}>
                    <Text style={[styles.modalOptionText, styles.deleteText]}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelDeleteAccount}>
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
    borderRadius: 30,
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
    gap: 4,
    paddingTop: 8,
    paddingBottom: 100,
    paddingHorizontal: 8,
    width: 390, // Width of two cards (185 + 185) + gap (4) + paddingHorizontal (8*2) = 390
  },
  leftCard: {
    width: 185,
    marginBottom: 4,
  },
  rightCard: {
    width: 185,
    marginBottom: 4,
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