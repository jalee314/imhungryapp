import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../../lib/supabase';
import { toByteArray } from 'base64-js';

const cuisines = [
  'Italian', 'French', 'Spanish', 'Greek',
  'Japanese', 'Chinese', 'Thai', 'Indian',
  'Korean', 'Mexican', 'Brazilian', 'Peruvian',
  'Ethiopian', 'Nigerian', 'American', 'Middle Eastern'
];

export default function CuisinePreferencesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisine)) {
        // Remove if already selected
        return prev.filter(c => c !== cuisine);
      } else if (prev.length < 3) {
        // Add if less than 3 selected
        return [...prev, cuisine];
      } else {
        // Replace the first selected item if 3 already selected
        return [prev[1], prev[2], cuisine];
      }
    });
  };

  const insertUserCuisinePreferences = async (userId: string, cuisines: string[]) => {
    if (cuisines.length === 0) return;

    try {
      const { data: cuisineData, error: cuisineError } = await supabase
        .from('cuisine')
        .select('cuisine_id, cuisine_name')
        .in('cuisine_name', cuisines);

      if (cuisineError) throw cuisineError;

      const preferences = cuisineData.map(cuisine => ({
        user_id: userId,
        cuisine_id: cuisine.cuisine_id
      }));

      const { error: preferencesError } = await supabase
        .from('user_cuisine_preferences')
        .insert(preferences);

      if (preferencesError) throw preferencesError;
    } catch (error) {
      console.error('Error inserting cuisine preferences:', error);
    }
  };

  const saveUserLocation = async (userId: string, locationData: any) => {
    if (!locationData) return;
    
    try {
      // Update the user record with location data using PostGIS POINT
      const { error } = await supabase
        .from('user')
        .update({
          location_city: locationData.city,
          location: `POINT(${locationData.longitude} ${locationData.latitude})`
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving location:', error);
      } else {
        console.log('Location saved successfully');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleFinish = async () => {
    if (selectedCuisines.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one cuisine preference.');
      return;
    }

    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    setLoading(true);
    try {
      // Convert phone number to E.164 format (remove all non-digits, add +1 for US)
      const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
      const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`;
      
      // Upload profile photo
      let profilePhotoUrl = 'default_avatar.png';
      if (userData.profile_photo_url && userData.profile_photo_url !== 'default_avatar') {
        const fileExt = userData.profile_photo_url.split('.').pop() || 'jpg';
        const fileName = `user_${userData.email.split('@')[0]}_${userData.username}_${Date.now()}.${fileExt}`;
        
        const base64 = await FileSystem.readAsStringAsync(userData.profile_photo_url, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const byteArray = toByteArray(base64);
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`public/${fileName}`, byteArray.buffer, {
            contentType: `image/${fileExt}`,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          // It's good practice to log the specific storage error
          console.error('Supabase storage error:', error.message);
        } else if (data) {
          profilePhotoUrl = data.path;
        }
      }

      // Create new user account with all information
      const { data: signUpResult, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: e164Phone,
            username: userData.username,
            full_name: `${userData.firstName} ${userData.lastName}`,
            profile_photo_url: profilePhotoUrl,
            cuisine_preferences: selectedCuisines,
            // Include location data in auth metadata
            location_data: userData.locationData
          },
        },
      });
      
      if (error) {
        // A generic error for any conflicts (email, phone, username) that might occur.
        Alert.alert(
          'Account Creation Failed',
          'An account with this email, phone number, or username may already exist. Please go back and check your information.',
          [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
        );
        return;
      }
      
      // The database trigger will automatically create the user record
      // Insert cuisine preferences and location
      if (signUpResult.user) {
        await insertUserCuisinePreferences(signUpResult.user.id, selectedCuisines);
        
        // Save location data if available
        if (userData.locationData) {
          await saveUserLocation(signUpResult.user.id, userData.locationData);
        }
      }

      (navigation as any).navigate('LogIn');
    } catch (error) {
      console.error('Setup failed:', error); // Log the full error
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    setLoading(true);
    try {
      // Convert phone number to E.164 format
      const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
      const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`;
      
      // Upload profile photo
      let profilePhotoUrl = 'default_avatar.png';
      if (userData.profile_photo_url && userData.profile_photo_url !== 'default_avatar') {
        const fileExt = userData.profile_photo_url.split('.').pop() || 'jpg';
        const fileName = `user_${userData.email.split('@')[0]}_${userData.username}_${Date.now()}.${fileExt}`;
        
        const base64 = await FileSystem.readAsStringAsync(userData.profile_photo_url, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const byteArray = toByteArray(base64);
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`public/${fileName}`, byteArray.buffer, {
            contentType: `image/${fileExt}`,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Supabase storage error:', error.message);
        } else if (data) {
          profilePhotoUrl = data.path;
        }
      }

      // Create new user account with all information (no cuisine preferences)
      const { data: signUpResult, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: e164Phone,
            username: userData.username,
            full_name: `${userData.firstName} ${userData.lastName}`,
            profile_photo_url: profilePhotoUrl,
            cuisine_preferences: [],
            // Include location data in auth metadata
            location_data: userData.locationData
          },
        },
      });
      
      if (error) {
        // A generic error for any conflicts (email, phone, username) that might occur.
        Alert.alert(
          'Account Creation Failed',
          'An account with this email, phone number, or username may already exist. Please go back and check your information.',
          [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
        );
        return;
      }
      
      // The database trigger will automatically create the user record
      // Save location data if available
      if (signUpResult.user && userData.locationData) {
        await saveUserLocation(signUpResult.user.id, userData.locationData);
      }

      (navigation as any).navigate('LogIn');
    } catch (error) {
      console.error('Setup failed (skip):', error); // Log the full error
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
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
                <Text style={styles.title}>Cuisine Preferences</Text>
                <Text style={styles.subtitle}>
                  What's your favorite cuisines? Choose up to 3.
                </Text>
              </View>

              <View style={styles.cuisineGrid}>
                {cuisines.map((cuisine) => {
                  const isSelected = selectedCuisines.includes(cuisine);
                  return (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineButton,
                        isSelected && styles.cuisineButtonSelected
                      ]}
                      onPress={() => toggleCuisine(cuisine)}
                    >
                      <Text style={[
                        styles.cuisineButtonText,
                        isSelected && styles.cuisineButtonTextSelected
                      ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.finishButton, 
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleFinish}
                  disabled={loading}
                >
                  <Text style={styles.finishButtonText}>
                    {loading ? 'Creating Account...' : 'Complete Setup'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.skipButton, loading && { opacity: 0.7 }]}
                  onPress={handleSkip}
                  disabled={loading}
                >
                  <Text style={styles.skipButtonText}>
                    {loading ? 'Creating Account...' : 'Skip'}
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
    marginBottom: 30,
    maxWidth: 343,
    alignItems: 'center'
  },
  title: { 
    fontSize: 24, 
    color: '#000', 
    fontWeight: 'bold', 
    marginBottom: 16,
    fontFamily: 'Manrope-Bold',
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#000', 
    lineHeight: 24,
    fontFamily: 'Manrope-Regular',
    textAlign: 'center'
  },

  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 343,
    marginBottom: 30,
  },
  cuisineButton: {
    width: '48%',
    height: 48,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cuisineButtonSelected: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cuisineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Manrope-Regular',
  },
  cuisineButtonTextSelected: {
    color: '#000',
  },

  footer: { 
    width: '100%', 
    paddingBottom: 16,
    alignItems: 'center'
  },

  finishButton: { 
    width: '100%', 
    maxWidth: 343,
    height: 44, 
    backgroundColor: '#FFA05C', 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16
  },
  finishButtonText: { 
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