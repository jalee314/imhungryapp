import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // CHANGED: Back to original
import { fetchUserData } from '../services/userService';
import { useAuth } from '../context/AuthContext';

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

  const loadUserData = async () => {
    try {
      // Check if user is authenticated before fetching data
      if (!isAuthenticated) {
        setUserPhotoUrl(null);
        return;
      }
      
      const userData = await fetchUserData();
      setUserPhotoUrl(userData.profilePicture);
    } catch (error) {
      // Handle error silently
      setUserPhotoUrl(null);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

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
    navigation.navigate(screenName as never);

    if (onTabPress) {
      const tab = navItems.find(item => item.screen === screenName);
      if (tab) {
        onTabPress(tab.id);
      }
    }
  };

  const renderNavItem = (item: { id: string; icon: any; label: string, screen: string }) => {
    const isActive = activeTab === item.id;
    
    if (item.id === 'profile') {
      const displayPhotoUrl = propPhotoUrl || userPhotoUrl;
      
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.navItem, isActive && styles.activeNavItem]}
          onPress={() => handleTabPress(item.screen)}
        >
          {displayPhotoUrl && typeof displayPhotoUrl === 'string' ? (
            <Image source={{ uri: displayPhotoUrl }} style={styles.navProfilePhoto} />
          ) : displayPhotoUrl ? (
            <Image source={displayPhotoUrl} style={styles.navProfilePhoto} />
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
        style={[styles.navItem, isActive && styles.activeNavItem]}
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
    <View style={styles.bottomNav}>
      {navItems.map(renderNavItem)}
    </View>
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
    color: '#FFA05C',
  },
  navProfilePhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
