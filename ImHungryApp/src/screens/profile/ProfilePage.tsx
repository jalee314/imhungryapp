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
    (navigation as any).navigate('profileEdit', { profile });
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        Alert.alert('Error', 'Failed to log out. Please try again.');
        return;
      }
      
      // Clear profile cache on logout
      await ProfileCacheService.clearCache();
      
      setShowLogoutModal(false);
      // Navigate to login page
      (navigation as any).navigate('LogIn');
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
        .upload(`public/${fileName}`, byteArray.buffer, {
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

      // Clear the user cache so other components fetch fresh data
      await clearUserCache();

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

      // Update UI
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadedPath);
      setPhotoUrl(urlData.publicUrl);
      await refreshProfile();
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
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
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
        
        {/* Show skeleton bottom nav */}
        <View style={styles.skeletonBottomNav}>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={[styles.skeleton, styles.skeletonNavItem]} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
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
            <View style={styles.textContainer}>
          <Text style={styles.contentText}>
            Support the platform by posting food deals you see!
          </Text>
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
        
        {/* Bottom spacing to prevent content from being hidden behind navigation */}
        <View style={styles.bottomSpacing} />

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
    flex: 1,
    minHeight: 550,
    paddingHorizontal: 20,
    paddingVertical: 20,
    position: 'relative',
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
  bottomSpacing: {
    height: 100,
  },

  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFA05C',
    overflow: 'hidden',
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
});

export default ProfilePage;