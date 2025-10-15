import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // CHANGED: Back to original
import { fetchUserData } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import DealCreationScreen from '../screens/contribution/DealCreationScreen';

interface BottomNavigationProps {
  photoUrl?: any;
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  photoUrl: propPhotoUrl, 
  activeTab = 'profile',
  onTabPress 
}) => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributePressed, setContributePressed] = useState(false);

  const loadUserData = async (): Promise<boolean> => {
    try {
      // Check if user is authenticated before fetching data
      if (!isAuthenticated) {
        setUserPhotoUrl(null);
        return false;
      }
      
      const userData = await fetchUserData();
      const hasProfilePicture = !!userData.profilePicture;
      setUserPhotoUrl(userData.profilePicture);
      return hasProfilePicture;
    } catch (error) {
      // Handle error silently
      setUserPhotoUrl(null);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const attemptLoadWithRetry = async () => {
      if (!isAuthenticated || !isMounted) return;
      
      // Initial load
      const hasPicture = await loadUserData();
      
      // If we already have a profile picture, no need to retry
      if (hasPicture) return;
      
      // Retry with increasing delays until we get a profile picture or timeout
      const refreshAttempts = [2000, 5000, 10000, 15000]; // Retry at 2s, 5s, 10s, 15s
      
      for (const delay of refreshAttempts) {
        if (!isMounted) return;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (!isAuthenticated || !isMounted) return;
        
        const hasPictureNow = await loadUserData();
        if (hasPictureNow) break; // Stop retrying once we have a profile picture
      }
    };
    
    attemptLoadWithRetry();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const navItems = [
    { id: 'feed', icon: 'view-grid-outline', label: 'Feed', screen: 'Feed' },
    { id: 'search', icon: 'magnify', label: 'Search', screen: 'DiscoverFeed' }, // CHANGED: Now routes to DiscoverFeed
    { id: 'contribute', icon: 'plus-circle-outline', label: 'Contribute', screen: 'DealCreationScreen' },
    { id: 'favorites', icon: 'heart-outline', label: 'Favorites', screen: 'FavoritesPage' },
    { id: 'profile', icon: 'account-circle-outline', label: 'Profile', screen: 'ProfilePage' },
  ];

  const handleTabPress = (screenName: string) => {
    if (screenName === 'DealCreationScreen') {
      setContributePressed(true);
      setShowContributeModal(true);
      // Reset opacity after a short delay
      setTimeout(() => setContributePressed(false), 150);
      // Don't call onTabPress for contribute to avoid tab state change
    } else {
      if (onTabPress) {
        const tab = navItems.find(item => item.screen === screenName);
        if (tab) {
          onTabPress(tab.id);
        }
      } else {
        // Fallback to navigation if onTabPress is not provided (for backward compatibility)
        navigation.navigate(screenName as never);
      }
    }
  };

  const renderNavItem = (item: { id: string; icon: any; label: string, screen: string }) => {
    // Contribute button should never be considered active
    const isActive = item.id !== 'contribute' && activeTab === item.id;
    const isContributePressed = item.id === 'contribute' && contributePressed;
    
    if (item.id === 'profile') {
      const displayPhotoUrl = propPhotoUrl || userPhotoUrl;
      
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.navItem, isActive && styles.activeNavItem]}
          onPress={() => handleTabPress(item.screen)}
        >
          {displayPhotoUrl && typeof displayPhotoUrl === 'string' ? (
            <Image source={{ uri: displayPhotoUrl }} style={[styles.navProfilePhoto, isActive && styles.activeNavProfilePhoto]} />
          ) : displayPhotoUrl ? (
            <Image source={displayPhotoUrl} style={[styles.navProfilePhoto, isActive && styles.activeNavProfilePhoto]} />
          ) : (
            <View style={styles.navProfilePlaceholder}>
              <Text style={styles.navPlaceholderText}>👤</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.navItem, 
          isActive && styles.activeNavItem,
          isContributePressed && { opacity: 0.5 }
        ]}
        onPress={() => handleTabPress(item.screen)}
      >
        <MaterialCommunityIcons  // CHANGED: Back to original
          name={item.icon} 
          size={28} 
          color={isActive ? '#FFA05C' : '#666'} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.bottomNav}>
        {navItems.map(renderNavItem)}
      </View>
      
      <DealCreationScreen
        visible={showContributeModal}
        onClose={() => {
          setShowContributeModal(false);
          setContributePressed(false); // Reset pressed state when modal closes
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 6, // CHANGED: Reduced from 6 to 3 to move icons up slightly
    paddingHorizontal: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom:16, // CHANGED: Increased from 34 to 44 for more space from bottom
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  activeNavItem: {
    // Add any active state styling here if needed
  },
  navIcon: {
    fontSize: 24,
    color: '#666',
  },
  activeNavIcon: {
    color: '#FF8C4C',
  },
  navProfilePhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  activeNavProfilePhoto: {
    borderWidth: 2,
    borderColor: '#FF8C4C',
  },
  navProfilePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navPlaceholderText: {
    fontSize: 12,
    color: '#999',
  },
});

export default BottomNavigation;
