import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onLocationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLocationPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerBottomFrame}>
        <Text style={styles.appName}>ImHungri</Text>
        <TouchableOpacity onPress={onLocationPress} style={styles.locationIconContainer}>
          <Ionicons name="location-sharp" size={26} color="#1D1B20" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 110,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    justifyContent: 'flex-end',
    paddingBottom: 4, // Much smaller padding to get closer to bottom
  },
  headerBottomFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  appName: {
    fontFamily: 'MuseoModerno-Bold',
    fontWeight: '700',
    fontSize: 24,
    color: '#FF8C4C',
  },
  locationIconContainer: {
    padding: 4, // Reduced padding to make the icon container smaller
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Header;