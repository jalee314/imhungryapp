import React, { useState } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
}

export default function LocationPermissionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;
  
  const [loading, setLoading] = useState(false);

  const getCityFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        return location.city || location.subregion || location.region || 'Unknown City';
      }
    } catch (error) {
      console.warn('Failed to get city from coordinates:', error);
    }
    return 'Unknown City';
  };

  const handleLocationPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      let locationData: LocationData | null = null;
      
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
          });
          
          const { latitude, longitude } = location.coords;
          const city = await getCityFromCoordinates(latitude, longitude);
          
          locationData = {
            latitude,
            longitude,
            city,
          };
          
          console.log('Location captured:', locationData);
        } catch (locationError) {
          console.warn('Failed to get location:', locationError);
        }
      }
      
      (navigation as any).navigate('InstantNotifications', { 
        userData: {
          ...userData,
          locationData
        }
      });
      
    } catch (error) {
      console.error('Location permission error:', error);
      (navigation as any).navigate('InstantNotifications', { userData });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    (navigation as any).navigate('InstantNotifications', { userData });
  };

  const locationIconStyle = {
    width: 120,
    height: 120,
    resizeMode: 'contain' as const,
  };

  return (
    <Box flex={1} bg="background">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Box flex={1} px="2xl" py="2xl">
            {/* Header */}
            <Box row justifyBetween alignCenter mb="5xl" height={44}>
              <Pressable py="m" px="xs" onPress={() => navigation.goBack()}>
                <Text size="xl" weight="medium" color="text">←</Text>
              </Pressable>

              <Pressable py="m" px="xs" onPress={handleSkip}>
                <Text 
                  size="base" 
                  color="textLight"
                  style={{ fontFamily: typography.fontFamily.regular }}
                >
                  Skip
                </Text>
              </Pressable>
            </Box>

            {/* Main Content */}
            <Box flex={1} alignStart width="100%">
              {/* Title Section */}
              <Box mb="5xl" maxWidth={343} alignStart>
                <Text 
                  size="2xl" 
                  weight="bold" 
                  color="text" 
                  mb="3xl"
                  style={{ fontFamily: typography.fontFamily.bold, textAlign: 'left' }}
                >
                  Location Permissions
                </Text>
                <Text 
                  size="base" 
                  color="textLight" 
                  lineHeight={24}
                  style={{ fontFamily: typography.fontFamily.regular, textAlign: 'left' }}
                >
                  Enable location access so we can show you the best food deals, restaurants, and offers around you.
                </Text>
              </Box>

              {/* Image Section */}
              <Box alignCenter mb="5xl" style={{ alignSelf: 'center' }}>
                <Box
                  width={200}
                  height={200}
                  rounded="full"
                  center
                  style={{
                    backgroundColor: '#000',
                    overflow: 'hidden',
                  }}
                >
                  <Image source={require('../../../img/onboarding/location.png')} style={locationIconStyle} />
                </Box>
              </Box>

              {/* Spacer */}
              <Box flex={1} />

              {/* Footer */}
              <Box width="100%" alignCenter style={{ alignSelf: 'center' }}>
                <Pressable
                  onPress={handleLocationPermission}
                  disabled={loading}
                  width="100%"
                  maxWidth={343}
                  height={44}
                  rounded="full"
                  alignCenter
                  justifyCenter
                  bg="primaryDark"
                  style={loading ? { opacity: 0.7 } : undefined}
                >
                  <Text color="textInverse" size="base" weight="semiBold">
                    {loading ? 'Getting location...' : 'Location Permissions'}
                  </Text>
                </Pressable>
              </Box>
            </Box>
          </Box>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  );
}
