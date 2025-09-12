import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BottomNavigationProps {
  photoUrl?: string | null;
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  photoUrl, 
  activeTab = 'profile',
  onTabPress 
}) => {
  const navigation = useNavigation();

  const navItems = [
    { id: 'home', icon: 'home-outline', label: 'Home' },
    { id: 'search', icon: 'magnify', label: 'Search' },
    { id: 'contribute', icon: 'plus-circle-outline', label: 'Contribute' },
    { id: 'favorites', icon: 'heart-outline', label: 'Favorites' },
    { id: 'profile', icon: 'profile', label: 'Profile' },
  ];

  const handleTabPress = (tabId: string) => {
    if (tabId === 'contribute') {
      navigation.navigate('DealCreationScreen' as never);
      return;
    }
     if (tabId === 'contribute') {
      navigation.navigate('ProfilePage' as never);
      return;
    }

    if (onTabPress) {
      onTabPress(tabId);
    }
  };

  const renderNavItem = (item: { id: string; icon: any; label: string }) => {
    const isActive = activeTab === item.id;
    
    if (item.id === 'profile') {
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.navItem, isActive && styles.activeNavItem]}
          onPress={() => handleTabPress(item.id)}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.navProfilePhoto} />
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
        onPress={() => handleTabPress(item.id)}
      >
        <MaterialCommunityIcons 
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
    paddingVertical: 6,
    paddingHorizontal: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    // Add safe area padding for devices with home indicators
    paddingBottom: 34, // Adjust this value based on your device's safe area
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
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  navProfilePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
