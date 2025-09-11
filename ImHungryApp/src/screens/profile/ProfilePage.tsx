import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, Image, 
  TouchableOpacity, SafeAreaView, ScrollView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import BottomNavigation from '../../components/BottomNavigation';

interface ProfilePageProps {
  route?: {
    params?: {
      user_id?: string;
      email?: string;
    };
  };
}

interface UserProfile {
  [key: string]: any; // Flexible interface to handle any column names
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

const ProfilePage: React.FC<ProfilePageProps> = ({ route }) => {
  const navigation = useNavigation();
  const user_id = route?.params?.user_id;
  const email = route?.params?.email;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings' | 'share'>('posts');

  const fetchProfile = async () => {
    // Get current user from Supabase Auth if no user_id provided
    let currentUserId = user_id;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
    }
    
    // If we have an email but no user_id, try to find user by email
    if (!currentUserId && email) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user')
          .select('*')
          .eq('email', email)
          .single();

        if (error) {
          console.error('Error fetching profile by email:', error);
          setProfile(null);
        } else if (data) {
          setProfile(data);
          // If a profile photo path exists, get its public URL
          if (data.profile_photo && data.profile_photo !== 'default_avatar.png') {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.profile_photo);
            
            setPhotoUrl(urlData.publicUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching profile by email:', error);
        setProfile(null);
      }
      setLoading(false);
      return;
    }
    
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (data) {
        setProfile(data);
        // If a profile photo path exists, get its public URL
        if (data.profile_photo && data.profile_photo !== 'default_avatar.png') {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.profile_photo);
          
          setPhotoUrl(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user_id, email]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [user_id, email])
  );

  const formatJoinDate = (profile: UserProfile | null) => {
    if (!profile) return 'Joined recently';
    
    // Try different possible date field names
    const dateString = profile.created_at || profile.createdAt || profile.date_created || profile.inserted_at || profile.created || profile.registered_at || profile.signup_date;
    
    if (!dateString) {
      console.log('Available profile fields:', Object.keys(profile));
      return 'Joined recently';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateString);
        return 'Joined recently';
      }
      return `Joined ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } catch (error) {
      console.log('Error parsing date:', error, 'Date string:', dateString);
      return 'Joined recently';
    }
  };

  const getDisplayName = () => {
    // Try different possible column names for username
    return profile?.username || profile?.user_name || profile?.display_name || profile?.name || '';
  };

  const getUsernameFontSize = () => {
    const username = getDisplayName();
    const length = username.length;
    
    // Adjust font size based on username length
    if (length <= 8) return 24;      // Normal size for short usernames
    if (length <= 12) return 22;     // Medium size for medium usernames
    if (length <= 15) return 20;     
  };

  
  const handleEditProfile = () => {
    (navigation as any).navigate('profileEdit', { profile });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header Section with Profile Photo */}
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { fontSize: getUsernameFontSize() }]}>{getDisplayName()}</Text>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.joinDate}>{formatJoinDate(profile)}</Text>
            <Text style={styles.location}>Fullerton, CA</Text>
          </View>
          
          <View style={styles.rightSection}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.placeholderText}>👤</Text>
              </View>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Deals Posted</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Deals Redeemed</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
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
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => setActiveTab('share')}
          >
            <Text style={styles.shareButtonText}>Share</Text>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <Text style={styles.contentText}>
            Support the platform by posting food deals you see!
          </Text>
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
          console.log('Navigate to:', tab);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  editButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },

  // Profile Photo
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFA05C',
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA05C',
  },
  placeholderText: {
    fontSize: 32,
    color: '#999',
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFA05C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FFA05C',
    borderColor: '#FFA05C',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  activeButtonText: {
    color: '#fff',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  shareIcon: {
    fontSize: 12,
    color: '#000',
  },

  // Content Area
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 100, // Space to prevent content from being hidden behind bottom navigation
  },

});

export default ProfilePage;