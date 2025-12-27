import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { atoms as a, tokens } from '#/ui';

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

  // Function to get city from coordinates using reverse geocoding
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
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      let locationData: LocationData | null = null;
      
      if (status === 'granted') {
        try {
          // Get current location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 seconds timeout
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
          // Continue without location data
        }
      }
      
      // Pass location data (or null) to next screen
      (navigation as any).navigate('InstantNotifications', { 
        userData: {
          ...userData,
          locationData
        }
      });
      
    } catch (error) {
      console.error('Location permission error:', error);
      // Continue without location data
      (navigation as any).navigate('InstantNotifications', { userData });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Continue without location data
    (navigation as any).navigate('InstantNotifications', { userData });
  };

  return (
    <View style={[a.flex_1, { backgroundColor: tokens.color.white }]}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Location Permissions</Text>
                <Text style={styles.subtitle}>
                  Enable location access so we can show you the best food deals, restaurants, and offers around you.
                </Text>
              </View>

              <View style={styles.imageSection}>
                <View style={styles.imagePlaceholder}>
                  <Image source={require('../../../../img/onboarding/location.png')} style={styles.locationIcon} />
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton, 
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleLocationPermission}
                  disabled={loading}
                >
                  <Text style={styles.continueButtonText}>
                    {loading ? 'Getting location...' : 'Location Permissions'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: tokens.color.white 
  },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { 
    flex: 1, 
    paddingHorizontal: tokens.space._2xl, 
    paddingVertical: tokens.space.xl 
  },

  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: tokens.space._4xl,
    height: 44
  },

  backButton: { paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.xs },
  backButtonText: { 
    fontSize: tokens.fontSize.xl, 
    color: tokens.color.black, 
    fontWeight: tokens.fontWeight.medium 
  },

  skipLink: { paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.xs },
  skipText: { 
    fontSize: tokens.fontSize.md, 
    color: tokens.color.gray_700, 
    fontWeight: tokens.fontWeight.normal,
    fontFamily: 'Inter-Regular'
  },

  mainContainer: { 
    flex: 1, 
    alignItems: 'flex-start', 
    width: '100%'
  },

  titleSection: { 
    marginBottom: tokens.space._4xl,
    maxWidth: 343,
    alignItems: 'flex-start'
  },
  title: { 
    fontSize: tokens.fontSize._2xl, 
    color: tokens.color.black, 
    fontWeight: tokens.fontWeight.bold, 
    marginBottom: 25,
    fontFamily: 'Inter-Bold',
    textAlign: 'left'
  },
  subtitle: { 
    fontSize: tokens.fontSize.md, 
    color: tokens.color.gray_700, 
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },

  imageSection: { 
    alignItems: 'center', 
    marginBottom: tokens.space._4xl,
    alignSelf: 'center'
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  locationIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain'
  },

  spacer: { flex: 1 },
  footer: { 
    width: '100%', 
    alignItems: 'center',
    alignSelf: 'center'
  },

  continueButton: { 
    width: '100%', 
    maxWidth: 343,
    height: 44, 
    backgroundColor: tokens.color.primary_600, 
    borderRadius: tokens.radius.xl, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  continueButtonText: { 
    color: tokens.color.white, 
    fontSize: tokens.fontSize.md, 
    fontWeight: tokens.fontWeight.semibold 
  },
});