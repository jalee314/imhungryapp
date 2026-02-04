/**
 * LocationModal - Location Selection Modal
 * 
 * A modal for selecting or searching for a location.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Box, Text, Pressable, Divider } from './atoms';
import { colors, spacing, borderRadius } from '../lib/theme';
import { 
  getCurrentUserLocation, 
  updateUserLocation, 
  getCityFromCoordinates, 
  getCityAndStateFromCoordinates, 
  getCoordinatesFromCity, 
  checkLocationPermission, 
  getLocationPermissionStatus 
} from '../services/locationService';

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

const sampleLocations: LocationItem[] = [
  { id: '1', city: 'Fullerton', state: 'CA' },
  { id: '2', city: 'Anaheim', state: 'CA' },
  { id: '3', city: 'Brea', state: 'CA' },
  { id: '4', city: 'Orange', state: 'CA' },
  { id: '5', city: 'Placentia', state: 'CA' },
  { id: '6', city: 'Yorba Linda', state: 'CA' },
  { id: '7', city: 'La Habra', state: 'CA' },
  { id: '8', city: 'Buena Park', state: 'CA' },
];

const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  onClose,
  onLocationUpdate,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleCurrentLocationRequest = async () => {
    const hasPermission = await checkLocationPermission();

    if (!hasPermission) {
      const permissionStatus = await getLocationPermissionStatus();

      if (permissionStatus.isDenied) {
        Alert.alert(
          'Location Access Required',
          'To use your current location, please enable location permissions for this app in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access Required',
          'To use your current location, please enable location permissions for this app in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }

    setSelectedLocation('current');
  };

  const requestCurrentLocation = async (): Promise<LocationItem | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 1,
      });
      const { latitude, longitude } = location.coords;
      const { city: cityName, stateAbbr } = await getCityAndStateFromCoordinates(latitude, longitude);

      const success = await updateUserLocation(latitude, longitude, cityName, stateAbbr);
      if (success) {
        return {
          id: 'current',
          city: cityName,
          state: stateAbbr || 'Current Location',
          coordinates: { lat: latitude, lng: longitude }
        };
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

    if (selectedLocation === 'current') {
      onClose();
      const currentLoc = await requestCurrentLocation();
      if (currentLoc) {
        onLocationUpdate(currentLoc);
      }
    } else {
      const selectedLocationItem = searchResults.find(loc => loc.id === selectedLocation);
      if (selectedLocationItem) {
        setIsUpdatingLocation(true);
        try {
          const coordinates = await getCoordinatesFromCity(selectedLocationItem.city, selectedLocationItem.state);
          const locationToUpdate = {
            ...selectedLocationItem,
            coordinates: coordinates || undefined
          };

          if (coordinates) {
            await updateUserLocation(coordinates.lat, coordinates.lng, selectedLocationItem.city, selectedLocationItem.state);
          }

          onLocationUpdate(locationToUpdate);
          onClose();
        } catch (error) {
          console.error('Error getting coordinates for city:', error);
          onLocationUpdate(selectedLocationItem);
          onClose();
        } finally {
          setIsUpdatingLocation(false);
        }
      }
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setSearchText('');
    onClose();
  };

  const renderCurrentLocationItem = () => (
    <Pressable
      onPress={handleCurrentLocationRequest}
      row
      alignCenter
      justifyBetween
      py="m"
      px="xs"
    >
      <Box row alignCenter flex={1}>
        <Text size="md" color="text">Use Current Location</Text>
        <Ionicons name="navigate" size={16} color={colors.primaryDark} style={{ marginLeft: 8 }} />
      </Box>
      {selectedLocation === 'current' ? (
        <Box
          width={20}
          height={20}
          rounded={10}
          bg="primaryDark"
          center
        >
          <Ionicons name="checkmark" size={16} color={colors.textInverse} />
        </Box>
      ) : (
        <Box width={20} height={20} />
      )}
    </Pressable>
  );

  const renderLocationItem = ({ item }: { item: LocationItem }) => (
    <Pressable
      onPress={() => handleSelectLocation(item.id)}
      row
      alignCenter
      justifyBetween
      py="m"
      px="xs"
    >
      <Box row alignCenter flex={1}>
        <Text size="md" color="text">{item.city}, {item.state}</Text>
      </Box>
      {selectedLocation === item.id ? (
        <Box
          width={20}
          height={20}
          rounded={10}
          bg="primaryDark"
          center
        >
          <Ionicons name="checkmark" size={16} color={colors.textInverse} />
        </Box>
      ) : (
        <Box width={20} height={20} />
      )}
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <Box
          row
          justifyBetween
          alignCenter
          px="l"
          py="m"
          borderBottom={0.5}
          borderColor="border"
        >
          <Pressable onPress={handleCancel}>
            <Text size="md" color="text">Cancel</Text>
          </Pressable>
          <Text size="md" weight="semibold" color="text">Search City</Text>
          <Pressable
            onPress={handleDone}
            disabled={!selectedLocation || isUpdatingLocation}
            style={{ opacity: (!selectedLocation || isUpdatingLocation) ? 0.5 : 1 }}
          >
            <Text size="md" weight="semibold" color="primaryDark">
              {isUpdatingLocation ? 'Updating...' : 'Done'}
            </Text>
          </Pressable>
        </Box>

        {/* Search Bar */}
        <Box
          row
          alignCenter
          bg="backgroundAlt"
          rounded="md"
          px="m"
          py="s"
          mx="m"
          my="s"
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 17,
              color: colors.text,
              marginLeft: spacing.s,
            }}
            placeholder="Search"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </Box>

        {/* Content */}
        <Box flex={1} px="m">
          {isSearching ? (
            <Box flex={1} center>
              <ActivityIndicator size="small" color={colors.primaryDark} />
            </Box>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderLocationItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider style={{ marginLeft: 4 }} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListHeaderComponent={
                !searchText.trim() ? (
                  <>
                    {renderCurrentLocationItem()}
                    <Divider style={{ marginLeft: 4 }} />
                  </>
                ) : null
              }
            />
          )}
        </Box>
      </SafeAreaView>
    </Modal>
  );
};

export default LocationModal;
