import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // CHANGED: Back to original
import { fetchUserData } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
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
    { id: 'feed', icon: 'view-grid', activeIcon: 'view-grid', label: 'Feed', screen: 'Feed' },
    { id: 'search', icon: 'magnify', activeIcon: 'magnify', label: 'Explore', screen: 'ExploreFeed' },
    { id: 'contribute', icon: 'plus-circle-outline', activeIcon: 'plus-circle', label: 'Contribute', screen: 'DealCreationScreen' },
    { id: 'favorites', icon: 'heart-outline', activeIcon: 'heart', label: 'Favorites', screen: 'FavoritesPage' },
    { id: 'profile', icon: 'account-circle-outline', activeIcon: 'account-circle', label: 'Profile', screen: 'ProfilePage' },
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

  const renderNavItem = (item: { id: string; icon: any; activeIcon: any; label: string; screen: string }) => {
    // Contribute button should never be considered active
    const isActive = item.id !== 'contribute' && activeTab === item.id;
    const isContributePressed = item.id === 'contribute' && contributePressed;
    
    if (item.id === 'profile') {
      const displayPhotoUrl = propPhotoUrl || userPhotoUrl;
      
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.navItem}
          onPress={() => handleTabPress(item.screen)}
        >
          <View style={styles.iconContainer}>
            {displayPhotoUrl && typeof displayPhotoUrl === 'string' ? (
              <Image source={{ uri: displayPhotoUrl }} style={[styles.navProfilePhoto, isActive && styles.activeNavProfilePhoto]} />
            ) : displayPhotoUrl ? (
              <Image source={displayPhotoUrl} style={[styles.navProfilePhoto, isActive && styles.activeNavProfilePhoto]} />
            ) : (
              <View style={[styles.navProfilePlaceholder, isActive && styles.activeNavProfilePhoto]}>
                <Text style={styles.navPlaceholderText}>👤</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>{item.label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.navItem, 
          isContributePressed && { opacity: 0.5 }
        ]}
        onPress={() => handleTabPress(item.screen)}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isActive ? item.activeIcon : item.icon} 
            size={25} 
            color={isActive ? '#000000' : '#757575'} 
          />
        </View>
        <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>{item.label}</Text>
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
    backgroundColor: '#fdfdfd',
    borderTopWidth: 0.5,
    borderTopColor: '#bcbcbc',
    paddingTop: 4,
    paddingBottom: 32,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 65,
    paddingHorizontal: 4,
  },
  iconContainer: {
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  activeNavLabel: {
    color: '#000000',
    fontWeight: '400',
  },
  navProfilePhoto: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activeNavProfilePhoto: {
    borderColor: '#000000',
  },
  navProfilePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 13,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  navPlaceholderText: {
    fontSize: 12,
    color: '#999',
  },
});

export default BottomNavigation;
