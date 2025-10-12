import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onLocationPress?: () => void;
  currentLocation?: string;
}

const Header: React.FC<HeaderProps> = memo(({ onLocationPress, currentLocation }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerBottomFrame}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../img/hungri_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={onLocationPress} style={styles.locationContainer}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-sharp" size={16} color="#1D1B20" />
            <Text style={styles.locationText} numberOfLines={1}>
              {currentLocation || 'Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  headerBottomFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 19,
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
    fontSize: 14,
    color: '#333',
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