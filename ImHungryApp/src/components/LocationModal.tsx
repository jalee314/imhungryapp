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
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getCurrentUserLocation, updateUserLocation, getCityFromCoordinates, getCityAndStateFromCoordinates, getCoordinatesFromCity, checkLocationPermission, getLocationPermissionStatus } from '../services/locationService';

interface LocationItem {
  id: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

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

      // Get city name and state abbreviation
      const { city: cityName, stateAbbr } = await getCityAndStateFromCoordinates(latitude, longitude);

      // Update user location in database
      const success = await updateUserLocation(latitude, longitude, cityName);
      if (success) {
        const newLocation: LocationItem = {
          id: 'current',
          city: cityName,
          state: stateAbbr || 'Current Location',
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
          <Text style={styles.locationText}>Use Current Location</Text>
          <Ionicons name="navigate" size={16} color="#FF8C4C" style={{ marginLeft: 8 }} />
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
              ListHeaderComponent={
                // Only show "Use Current Location" when not searching
                !searchText.trim() ? (
                  <>
                    {renderCurrentLocationItem()}
                    {renderSeparator()}
                  </>
                ) : null
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
  },
  headerButtonText: {
    fontSize: 16,
    color: '#000',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  doneButton: {
    color: '#FF8C4C',
    fontWeight: '600',
  },
  doneButtonDisabled: {
    color: 'rgba(255, 140, 76, 0.5)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 4,
  },
  locationTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#000',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF8C4C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkPlaceholder: {
    width: 20,
    height: 20,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#C6C6C8',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
});

export default LocationModal;