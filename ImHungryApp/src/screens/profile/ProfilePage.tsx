import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, Image, 
  TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { fetchUserPosts, deleteDeal, transformDealForUI } from '../../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../services/voteService';
import { logClick } from '../../services/interactionService';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dealCount, setDealCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings' | 'share'>('posts');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Only show loading skeleton if we have NO data at all
  const [hasData, setHasData] = useState(false);

  const [userPosts, setUserPosts] = useState<Deal[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  

  // Instagram-style loading: Show cache immediately, update in background
  const loadProfileData = async () => {
    try {
      // 1. IMMEDIATELY show cached data (if available)
      const cached = await ProfileCacheService.getCachedProfile();
      if (cached) {
        setProfile(cached.profile);
        setPhotoUrl(cached.photoUrl);
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
    loadProfileData();
  }, []);

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
      setDealCount(freshData.dealCount);
    }
  };

  // Add the new useFocusEffect here:
  useFocusEffect(
    React.useCallback(() => {
      // Force refresh the profile data when screen comes into focus
      refreshProfile();
    }, [])
  );

  const formatJoinDate = (profile: UserProfile | null) => {
    if (!profile) return 'Joined recently';
    
    const dateString = profile.created_at || profile.createdAt || profile.date_created || 
                      profile.inserted_at || profile.created || profile.registered_at || profile.signup_date;
    
    if (!dateString) return 'Joined recently';
    
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Joined recently';
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } catch (error) {
      return 'Joined recently';
    }
  };

  // Use userData for display instead of profile
  const getDisplayName = () => {
    return userData?.username || profile?.display_name || '';
  };

  const getUsernameFontSize = () => {
    const username = getDisplayName();
    const length = username.length;
    
    if (length <= 8) return 26;
    if (length <= 12) return 24;
    return 22;
  };

  
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
    Alert.alert(
      'Update Profile Photo',
      'Choose how you want to update your profile photo',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      
      // Use the session service sign out
      await signOut();
      
      // Clear profile cache
      await ProfileCacheService.clearCache();
      
      // Clear any remaining auth data
      await AsyncStorage.multiRemove(['userData', 'userDataTimestamp', 'supabase_auth_session']);
      
      // Force a second signOut to ensure auth state is cleared
      await supabase.auth.signOut();
      
      // Clear additional cache
      await AsyncStorage.multiRemove([
        'userData', 
        'userDataTimestamp', 
        'supabase_auth_session',
        'current_db_session_id',
        'db_session_start_time'
      ]);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? All your information is going to be deleted.',
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
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'User not found');
                return;
              }

      // Delete profile photo from storage if it exists
      if (profile?.profile_photo && profile.profile_photo !== 'default_avatar.png') {
        const photoPath = profile.profile_photo.startsWith('public/') 
          ? profile.profile_photo 
          : `public/${profile.profile_photo}`;
          
        const { error: deletePhotoError } = await supabase.storage
          .from('avatars')
          .remove([photoPath]);
        
        if (deletePhotoError) {
          console.error('Error deleting profile photo:', deletePhotoError);
        }
      }

      // Delete user from public.user table (if record exists)
      const { error: deleteUserError } = await supabase
        .from('user')
        .delete()
        .eq('user_id', user.id);

      if (deleteUserError) {
        console.error('Error deleting user from public.user:', deleteUserError);
        // Don't fail if user record doesn't exist in public.user table
      }

      // Note: User will remain in auth.users table - delete manually from Supabase dashboard
      console.log('User deleted from app. Manual deletion from auth.users required.');



      // Sign out the user (this will end their session)
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error signing out user:', signOutError);
        // Continue with deletion even if sign out fails
      }

              setShowDeleteModal(false);
              Alert.alert('Success', 'Account deleted successfully');
              
              // Navigate to login page
              (navigation as any).navigate('LogIn');
            } catch (error) {
              console.error('Error during account deletion:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          },
        },
      ]
    );
  };

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false);
  };

  const uploadPhoto = async (photoUri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
      const userEmail = user.email || 'unknown';
      const emailPrefix = userEmail.split('@')[0];
      const username = profile?.username || profile?.display_name || 'user';
      
      // Use the same filename format as onboarding
      const fileName = `user_${emailPrefix}_${username}_${Date.now()}.${fileExt}`;

      // Store reference to old photo before upload
      const oldPhotoPath = profile?.profile_photo && profile.profile_photo !== 'default_avatar.png' 
        ? (profile.profile_photo.startsWith('public/') ? profile.profile_photo : `public/${profile.profile_photo}`)
        : null;

      // Read the file as base64 and convert using toByteArray (same as onboarding)
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const byteArray = toByteArray(base64);

      // Upload new photo using the same pattern as onboarding
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`public/${fileName}`, byteArray, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false // Same as onboarding - timestamp prevents collisions
        });

      if (uploadError) throw uploadError;

      // The uploaded path will be `public/${fileName}`, which matches onboarding
      const uploadedPath = data?.path || `public/${fileName}`;

      // Update profile with new photo path
      await supabase.from('user').update({ profile_photo: uploadedPath }).eq('user_id', user.id);
      await supabase.auth.updateUser({ data: { profile_photo_url: uploadedPath } });

      // Clear ALL caches so everything updates
      await clearUserCache();
      await ProfileCacheService.clearCache();

      // Only delete old photo after successful upload and database update
      if (oldPhotoPath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([oldPhotoPath]);
        
        if (deleteError) {
          console.warn('Failed to delete old photo:', deleteError);
          // Don't throw here - the upload was successful, deletion is cleanup
        }
      }

      // Update UI with new URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadedPath);
      setPhotoUrl(urlData.publicUrl);
      
      // Force refresh to update everything including BottomNavigation
      await refreshProfile();
      
      // Add a small delay and trigger a re-render
      setTimeout(() => {
        setPhotoUrl(urlData.publicUrl + `?t=${Date.now()}`);
      }, 100);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
    }
  };

  const loadUserPosts = async () => {
    try {
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
    if (activeTab === 'posts' && hasData) {
      loadUserPosts();
    }
  }, [activeTab, hasData]);

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
      
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
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
        {/* Header Section with Profile Photo */}
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { fontSize: getUsernameFontSize() }]}>{getDisplayName()}</Text>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <MaterialCommunityIcons name="pencil" size={16} color="#000" />
              </TouchableOpacity>
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
              <TouchableOpacity 
                style={styles.profilePhotoContainer}
                onPress={handleProfilePhotoPress}
              >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
            ) : (
                  <Image source={require('../../../img/Default_pfp.svg.png')} style={styles.profilePhoto} />
                )}
              </TouchableOpacity>
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
              My Posts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, activeTab === 'settings' && styles.activeButton]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.actionButtonText, activeTab === 'settings' && styles.activeButtonText]}>
              Settings
            </Text>
          </TouchableOpacity>
          
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
                    Support the platform by posting food deals you see!
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
                        showDelete={true}
                        onDelete={handleDeletePost}
                        hideAuthor={true}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {activeTab === 'settings' && (
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
        photoUrl={photoUrl} 
        activeTab="profile"
        onTabPress={(tab) => {
          // Handle navigation to different tabs
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Inter',
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