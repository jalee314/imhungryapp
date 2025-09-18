import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';

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
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(255, 245, 171, 0.1)', 'rgba(255, 225, 0, 0.8)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Location Permissions</Text>
                <Text style={styles.subtitle}>
                  Enable location access so we can show you the best food deals, restaurants, and offers around you.
                </Text>
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.locationButton, 
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleLocationPermission}
                  disabled={loading}
                >
                  <Text style={styles.locationButtonText}>
                    {loading ? 'Getting location...' : 'Allow Location Access'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  disabled={loading}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
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
    backgroundColor: 'rgba(255, 245, 171, 0.5)' 
  },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingVertical: 20 
  },

  backButton: { 
    alignSelf: 'flex-start', 
    marginBottom: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 4 
  },
  backButtonText: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: '500' 
  },

  mainContainer: { 
    flex: 1, 
    alignItems: 'center', 
    width: '100%' 
  },

  titleSection: { 
    marginBottom: 40,
    maxWidth: 300
  },
  title: { 
    fontSize: 24, 
    color: '#000', 
    fontWeight: 'bold', 
    marginBottom: 25,
    fontFamily: 'Manrope-Bold'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#000', 
    lineHeight: 24,
    fontFamily: 'Manrope-Regular'
  },

  spacer: { flex: 1 },
  footer: { 
    width: '100%', 
    paddingBottom: 16,
    alignItems: 'center'
  },

  locationButton: { 
    width: '100%', 
    maxWidth: 343,
    height: 44, 
    backgroundColor: '#FFA05C', 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16
  },
  locationButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },

  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  skipButtonText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: '500' 
  },
});