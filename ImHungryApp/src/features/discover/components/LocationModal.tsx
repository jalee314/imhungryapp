import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { tokens, atoms as a } from '#/ui';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getCurrentUserLocation, updateUserLocation, getCityFromCoordinates, getCoordinatesFromCity, checkLocationPermission, getLocationPermissionStatus } from '#/services/locationService';
import { LocationItem } from '#/types';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationUpdate: (location: LocationItem) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  onClose,
  onLocationUpdate,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationItem | null>(null);
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Sample data - in production, you'd want to search through a real location database
  const sampleLocations: LocationItem[] = [
    { id: '1', city: 'Fullerton', state: 'California' },
    { id: '2', city: 'Anaheim', state: 'California' },
    { id: '3', city: 'Brea', state: 'California' },
    { id: '4', city: 'Orange', state: 'California' },
    { id: '5', city: 'Placentia', state: 'California' },
    { id: '6', city: 'Yorba Linda', state: 'California' },
    { id: '7', city: 'La Habra', state: 'California' },
    { id: '8', city: 'Buena Park', state: 'California' },
  ];

  useEffect(() => {
    if (visible) {
      setSearchResults(sampleLocations);
      setSelectedLocation(null);
      setSearchText('');
    }
  }, [visible]);

  useEffect(() => {
    if (searchText.trim()) {
      setIsSearching(true);
      // Simulate search delay
      const timeoutId = setTimeout(() => {
        const filtered = sampleLocations.filter(location =>
          location.city.toLowerCase().includes(searchText.toLowerCase()) ||
          location.state.toLowerCase().includes(searchText.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults(sampleLocations);
      setIsSearching(false);
    }
  }, [searchText]);

  const loadCurrentLocation = async () => {
    try {
      const location = await getCurrentUserLocation();
      if (location) {
        const cityName = location.city || await getCityFromCoordinates(location.lat, location.lng);
        setCurrentLocation({
          id: 'current',
          city: cityName,
          state: 'Current Location',
          coordinates: { lat: location.lat, lng: location.lng }
        });
      }
    } catch (error) {
      console.error('Error loading current location:', error);
    }
  };

  const handleCurrentLocationRequest = async () => {
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      // Get detailed permission status
      const permissionStatus = await getLocationPermissionStatus();
      
      if (permissionStatus.isDenied) {
        // User has already denied permission before, go straight to settings guidance
        Alert.alert(
          'Location Access Required',
          'To use your current location, please enable location permissions for this app in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
      
      // First time asking (status is likely 'undetermined') - request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // User denied it for the first time, explain how to re-enable
        Alert.alert(
          'Location Access Required',
          'To use your current location, please enable location permissions for this app in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
    }
    
    // Permission granted, proceed with location request
    setSelectedLocation('current');
  };

  const requestCurrentLocation = async (): Promise<LocationItem | null> => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return null;
      }

      // Get current position with higher accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 1,
      });
      const { latitude, longitude } = location.coords;

      // Get city name
      const cityName = await getCityFromCoordinates(latitude, longitude);

      // Update user location in database
      const success = await updateUserLocation(latitude, longitude, cityName);
      if (success) {
        const newLocation: LocationItem = {
          id: 'current',
          city: cityName,
          state: 'Current Location',
          coordinates: { lat: latitude, lng: longitude }
        };
        return newLocation;
      }
      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const handleSelectLocation = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const handleDone = async () => {
    if (!selectedLocation) return;

    let locationToUpdate: LocationItem | null = null;

    if (selectedLocation === 'current') {
      // Close modal immediately for current location
      onClose();
      
      // Get current location in the background
      const currentLoc = await requestCurrentLocation();
      if (currentLoc) {
        onLocationUpdate(currentLoc);
      }
    } else {
      // Get the selected location from search results
      const selectedLocationItem = searchResults.find(loc => loc.id === selectedLocation);
      if (selectedLocationItem) {
        // Get coordinates for the selected city
        setIsUpdatingLocation(true);
        try {
          const coordinates = await getCoordinatesFromCity(selectedLocationItem.city, selectedLocationItem.state);
          locationToUpdate = {
            ...selectedLocationItem,
            coordinates: coordinates || undefined
          };
          
          // Save the selected location to the database
          if (coordinates) {
            console.log('💾 Saving manual location to database:', coordinates);
            const success = await updateUserLocation(coordinates.lat, coordinates.lng, selectedLocationItem.city);
            if (success) {
              console.log('✅ Manual location saved to database successfully');
            } else {
              console.log('❌ Failed to save manual location to database');
            }
          }
        } catch (error) {
          console.error('Error getting coordinates for city:', error);
          locationToUpdate = selectedLocationItem;
        } finally {
          setIsUpdatingLocation(false);
        }
      }

      if (locationToUpdate) {
        onLocationUpdate(locationToUpdate);
        onClose();
      }
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setSearchText('');
    onClose();
  };

  const renderCurrentLocationItem = () => {
    return (
      <TouchableOpacity 
        style={styles.locationItem}
        onPress={handleCurrentLocationRequest}
      >
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>Current Location</Text>
        </View>
        {selectedLocation === 'current' ? (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        ) : (
          <View style={styles.checkmarkPlaceholder} />
        )}
      </TouchableOpacity>
    );
  };

  const renderLocationItem = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity 
      style={styles.locationItem}
      onPress={() => handleSelectLocation(item.id)}
    >
      <View style={styles.locationTextContainer}>
        <Text style={styles.locationText}>{item.city}, {item.state}</Text>
      </View>
      {selectedLocation === item.id ? (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      ) : (
        <View style={styles.checkmarkPlaceholder} />
      )}
    </TouchableOpacity>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search City</Text>
          <TouchableOpacity 
            onPress={handleDone}
            disabled={!selectedLocation || isUpdatingLocation}
          >
            <Text style={[
              styles.headerButtonText,
              styles.doneButton,
              (!selectedLocation || isUpdatingLocation) && styles.doneButtonDisabled
            ]}>
              {isUpdatingLocation ? 'Updating...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Current Location */}
          {renderCurrentLocationItem()}
          {renderSeparator()}

          {/* Search Results */}
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF8C4C" />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderLocationItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={renderSeparator}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContentContainer}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    ...a.flex_1,
    ...a.bg_white,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.px_xl,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.color.gray_200,
  },
  headerButtonText: {
    ...a.text_md,
    ...a.text_black,
  },
  headerTitle: {
    ...a.font_semibold,
    ...a.text_black,
    fontSize: 17,
  },
  doneButton: {
    ...a.font_semibold,
    ...a.text_primary_600,
  },
  doneButtonDisabled: {
    ...a.opacity_50,
  },
  searchContainer: {
    ...a.flex_row,
    ...a.align_center,
    ...a.px_md,
    ...a.py_sm,
    ...a.mx_lg,
    ...a.rounded_md,
    backgroundColor: '#F2F2F7',
    marginVertical: 10,
  },
  searchInput: {
    ...a.flex_1,
    ...a.ml_sm,
    ...a.text_black,
    fontSize: 17,
  },
  content: {
    ...a.flex_1,
    ...a.px_lg,
  },
  locationItem: {
    ...a.flex_row,
    ...a.align_center,
    ...a.justify_between,
    ...a.px_xs,
    paddingVertical: 15,
  },
  locationTextContainer: {
    ...a.flex_1,
  },
  locationText: {
    ...a.text_md,
    ...a.text_black,
  },
  checkmark: {
    ...a.justify_center,
    ...a.align_center,
    ...a.bg_primary_600,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  checkmarkPlaceholder: {
    width: 20,
    height: 20,
  },
  separator: {
    ...a.ml_xs,
    height: 0.5,
    backgroundColor: tokens.color.gray_400,
  },
  loadingContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
  },
  listContentContainer: {
    ...a.pb_xl,
  },
});

export default LocationModal;
