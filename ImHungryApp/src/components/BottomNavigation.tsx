/**
 * BottomNavigation - Main app navigation bar
 */

import React, { useEffect, useState } from 'react';
import { Image, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text, Pressable } from './atoms';
import { fetchUserData } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import DealCreationScreen from '../screens/contribution/DealCreationScreen';
import { colors } from '../lib/theme';

const { width: screenWidth } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;
const ICON_SIZE = Math.round(scale(25));
const PROFILE_SIZE = Math.round(scale(25));

interface BottomNavigationProps {
  photoUrl?: any;
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

const navItems = [
  { id: 'feed', icon: 'view-grid', activeIcon: 'view-grid', label: 'Feed', screen: 'Feed' },
  { id: 'search', icon: 'magnify', activeIcon: 'magnify', label: 'Explore', screen: 'ExploreFeed' },
  { id: 'contribute', icon: 'plus-circle-outline', activeIcon: 'plus-circle', label: 'Contribute', screen: 'DealCreationScreen' },
  { id: 'favorites', icon: 'heart-outline', activeIcon: 'heart', label: 'Favorites', screen: 'FavoritesPage' },
  { id: 'profile', icon: 'account-circle-outline', activeIcon: 'account-circle', label: 'Profile', screen: 'ProfilePage' },
];

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
      if (!isAuthenticated) {
        setUserPhotoUrl(null);
        return false;
      }
      const userData = await fetchUserData();
      const hasProfilePicture = !!userData.profilePicture;
      setUserPhotoUrl(userData.profilePicture);
      return hasProfilePicture;
    } catch (error) {
      setUserPhotoUrl(null);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const attemptLoadWithRetry = async () => {
      if (!isAuthenticated || !isMounted) return;
      
      const hasPicture = await loadUserData();
      if (hasPicture) return;
      
      const refreshAttempts = [2000, 5000, 10000, 15000];
      
      for (const delay of refreshAttempts) {
        if (!isMounted) return;
        await new Promise(resolve => setTimeout(resolve, delay));
        if (!isAuthenticated || !isMounted) return;
        const hasPictureNow = await loadUserData();
        if (hasPictureNow) break;
      }
    };
    
    attemptLoadWithRetry();
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleTabPress = (screenName: string) => {
    if (screenName === 'DealCreationScreen') {
      setContributePressed(true);
      setShowContributeModal(true);
      setTimeout(() => setContributePressed(false), 150);
    } else {
      if (onTabPress) {
        const tab = navItems.find(item => item.screen === screenName);
        if (tab) {
          onTabPress(tab.id);
        }
      } else {
        navigation.navigate(screenName as never);
      }
    }
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = item.id !== 'contribute' && activeTab === item.id;
    const isContributePressed = item.id === 'contribute' && contributePressed;
    
    const navItemStyle = {
      minWidth: scale(65),
    };

    const iconContainerStyle = {
      height: ICON_SIZE,
      width: ICON_SIZE,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };

    const profilePhotoStyle = {
      width: PROFILE_SIZE,
      height: PROFILE_SIZE,
      borderRadius: PROFILE_SIZE / 2,
      borderWidth: 1.5,
      borderColor: isActive ? colors.text : 'transparent',
    };

    const placeholderStyle = {
      width: PROFILE_SIZE,
      height: PROFILE_SIZE,
      borderRadius: PROFILE_SIZE / 2,
      backgroundColor: '#E0E0E0',
      borderWidth: 1.5,
      borderColor: isActive ? colors.text : 'transparent',
    };
    
    if (item.id === 'profile') {
      const displayPhotoUrl = propPhotoUrl || userPhotoUrl;
      
      return (
        <Pressable
          key={item.id}
          onPress={() => handleTabPress(item.screen)}
          alignCenter
          justifyStart
          flex={1}
          px="s1"
          style={navItemStyle}
        >
          <Box style={iconContainerStyle}>
            {displayPhotoUrl && typeof displayPhotoUrl === 'string' ? (
              <Image 
                source={{ uri: displayPhotoUrl }} 
                style={profilePhotoStyle} 
              />
            ) : displayPhotoUrl ? (
              <Image 
                source={displayPhotoUrl} 
                style={profilePhotoStyle} 
              />
            ) : (
              <Box style={placeholderStyle} center>
                <Text variant="caption" color="textMuted">👤</Text>
              </Box>
            )}
          </Box>
          <Text 
            variant="caption" 
            color={isActive ? 'text' : 'textMuted'}
            textAlign="center"
            mt="s1"
          >
            {item.label}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={item.id}
        onPress={() => handleTabPress(item.screen)}
        alignCenter
        justifyStart
        flex={1}
        px="s1"
        style={[navItemStyle, isContributePressed && { opacity: 0.5 }]}
      >
        <Box style={iconContainerStyle}>
          <MaterialCommunityIcons
            name={isActive ? item.activeIcon : item.icon} 
            size={ICON_SIZE} 
            color={isActive ? colors.text : colors.textMuted} 
          />
        </Box>
        <Text 
          variant="caption" 
          color={isActive ? 'text' : 'textMuted'}
          textAlign="center"
          mt="s1"
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      <Box
        row
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fdfdfd',
          borderTopWidth: 0.5,
          borderTopColor: '#bcbcbc',
          paddingTop: scale(4),
          paddingBottom: scale(32),
          paddingHorizontal: scale(8),
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {navItems.map(renderNavItem)}
      </Box>
      
      <DealCreationScreen
        visible={showContributeModal}
        onClose={() => {
          setShowContributeModal(false);
          setContributePressed(false);
        }}
      />
    </>
  );
};

export default BottomNavigation;
