import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as tokens from '#/ui/tokens';

interface HeaderProps {
  onLocationPress?: () => void;
  currentLocation?: string;
  paddingHorizontal?: number;
}

const Header: React.FC<HeaderProps> = memo(({ onLocationPress, currentLocation, paddingHorizontal }) => {
  // Calculate dynamic padding based on screen width
  const screenWidth = Dimensions.get('window').width;
  const dynamicPadding = paddingHorizontal || Math.max(10, screenWidth * 0.025); // 2.5% of screen width, minimum 10
  return (
    <View style={styles.header}>
      <View style={[styles.headerBottomFrame, { paddingHorizontal: dynamicPadding }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../img/logo/hungri_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={onLocationPress} style={styles.locationContainer}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-sharp" size={16} color={tokens.color.text_dark} />
            <Text style={styles.locationText} numberOfLines={1}>
              {currentLocation || 'Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={tokens.color.gray_600} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to reduce unnecessary re-renders
  // Only re-render if the currentLocation actually changed meaningfully
  return prevProps.currentLocation === nextProps.currentLocation && 
         prevProps.onLocationPress === nextProps.onLocationPress;
});

// Add display name for debugging
Header.displayName = 'Header';

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 100,
    backgroundColor: tokens.color.white,
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.color.gray_200,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  headerBottomFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    height: 40,
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    // Remove height constraint to let it scale naturally
  },
  locationContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.color.gray_800,
    fontWeight: '500',
    maxWidth: 120,
  },
  locationIconContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Header;