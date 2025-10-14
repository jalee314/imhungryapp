import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { processImageWithEdgeFunction } from '../../services/imageProcessingService';
import { useDataCache } from '../../context/DataCacheContext';

export default function CuisinePreferencesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
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
        .from('user_cuisine_preference')
        .insert(preferences);

      if (preferencesError) throw preferencesError;
    } catch (error) {
      console.error('Error inserting cuisine preferences:', error);
    }
  };

  const saveUserLocation = async (userId: string, locationData: any) => {
    if (!locationData || !locationData.latitude || !locationData.longitude) return;
    
    try {
      // Validate coordinates
      if (locationData.latitude < -90 || locationData.latitude > 90 ||
          locationData.longitude < -180 || locationData.longitude > 180) {
        console.error('Invalid coordinates:', locationData);
        return;
      }
  
      // Call the database function
      const { data, error } = await supabase.rpc('update_user_location', {
        user_uuid: userId,
        lat: locationData.latitude,
        lng: locationData.longitude,
        city: locationData.city
      });
  
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
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    setLoading(true);
    try {
      // Convert phone number to E.164 format (remove all non-digits, add +1 for US)
      const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
      const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`;
      
      // Note: We'll process the profile photo after user creation
      // During signup, the user isn't authenticated yet, so we can't use processImageWithEdgeFunction
      // We'll pass the photo URI and process it after successful signup

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
            profile_photo_metadata_id: null, // Will be updated after photo processing
            cuisine_preferences: selectedCuisines,
            // Include location data in auth metadata
            location_data: userData.locationData,
            display_name: userData.username  // Add this line
          },
        },
      });
      
      if (error) {
        console.error('Detailed signup error:', {
          message: error.message,
          status: error.status,
          userData: userData,
        });
        
        // Handle specific error types
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email, phone number, or username already exists. Please try logging in or use different information.',
            [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
          );
        } else if (error.message.includes('ST_GeogFromText') || error.message.includes('PostGIS')) {
          Alert.alert(
            'Location Error',
            'There was an issue processing your location. Please try again.',
            [{ text: 'Go Back', onPress: () => navigation.goBack() }]
          );
        } else if (error.message.includes('User creation failed')) {
          Alert.alert(
            'Database Error',
            `Account creation failed: ${error.message}. Please contact support if this continues.`,
            [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
          );
        } else {
          Alert.alert(
            'Account Creation Failed',
            'An unexpected error occurred. Please try again or contact support.',
            [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
          );
        }
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

        // Process profile photo after user creation
        if (userData.profile_photo_url && userData.profile_photo_url !== 'default_avatar') {
          console.log('Processing profile photo with Cloudinary...');
          try {
            // Wait for user record to be created by trigger with retry mechanism
            let userExists = false;
            let retries = 0;
            const maxRetries = 5;
            
            while (!userExists && retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
              
              const { data: userCheck, error: userCheckError } = await supabase
                .from('user')
                .select('user_id')
                .eq('user_id', signUpResult.user.id)
                .single();
              
              if (userCheckError) {
                console.error(`User record not found yet (attempt ${retries + 1}):`, userCheckError);
                retries++;
              } else {
                console.log('User record confirmed exists:', userCheck);
                userExists = true;
              }
            }
            
            if (!userExists) {
              throw new Error('User record was not created after multiple attempts');
            }
            
            const result = await processImageWithEdgeFunction(userData.profile_photo_url, 'profile_image');
            
            if (result.success && result.metadataId) {
              console.log('Profile photo processed successfully, metadataId:', result.metadataId);
              console.log('Updating user profile for user ID:', signUpResult.user.id);
              
              // Update user profile with the image metadata ID
              const { data: updateData, error: updateError } = await supabase
                .from('user')
                .update({ profile_photo_metadata_id: result.metadataId })
                .eq('user_id', signUpResult.user.id)
                .select();
              
              if (updateError) {
                console.error('Error updating profile photo metadata:', updateError);
                console.error('Update error details:', JSON.stringify(updateError, null, 2));
              } else {
                console.log('Profile photo metadata updated successfully:', updateData);
              }
            } else {
              console.error('Profile photo processing failed:', result.error);
            }
          } catch (photoError) {
            console.error('Error processing profile photo:', photoError);
            // Continue with signup even if photo processing fails
          }
        }
      }

      // Let the authentication state change handle navigation
      // The app will automatically switch to OnboardingStack after signup
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
      
      // Note: We'll process the profile photo after user creation
      // During signup, the user isn't authenticated yet, so we can't use processImageWithEdgeFunction

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
            profile_photo_metadata_id: null, // Will be updated after photo processing
            cuisine_preferences: [],
            // Include location data in auth metadata
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

      // Process profile photo after user creation
      if (signUpResult.user && userData.profile_photo_url && userData.profile_photo_url !== 'default_avatar') {
        console.log('Processing profile photo with Cloudinary...');
        try {
          // Wait for user record to be created by trigger with retry mechanism
          let userExists = false;
          let retries = 0;
          const maxRetries = 5;
          
          while (!userExists && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
            
            const { data: userCheck, error: userCheckError } = await supabase
              .from('user')
              .select('user_id')
              .eq('user_id', signUpResult.user.id)
              .single();
            
            if (userCheckError) {
              console.error(`User record not found yet (attempt ${retries + 1}):`, userCheckError);
              retries++;
            } else {
              console.log('User record confirmed exists:', userCheck);
              userExists = true;
            }
          }
          
          if (!userExists) {
            throw new Error('User record was not created after multiple attempts');
          }
          
          const result = await processImageWithEdgeFunction(userData.profile_photo_url, 'profile_image');
          
          if (result.success && result.metadataId) {
            console.log('Profile photo processed successfully, metadataId:', result.metadataId);
            console.log('Updating user profile for user ID:', signUpResult.user.id);
            
            // Update user profile with the image metadata ID
            const { data: updateData, error: updateError } = await supabase
              .from('user')
              .update({ profile_photo_metadata_id: result.metadataId })
              .eq('user_id', signUpResult.user.id)
              .select();
            
            if (updateError) {
              console.error('Error updating profile photo metadata:', updateError);
              console.error('Update error details:', JSON.stringify(updateError, null, 2));
            } else {
              console.log('Profile photo metadata updated successfully:', updateData);
            }
          } else {
            console.error('Profile photo processing failed:', result.error);
          }
        } catch (photoError) {
          console.error('Error processing profile photo:', photoError);
          // Continue with signup even if photo processing fails
        }
      }
      // Let the authentication state change handle navigation
      // The app will automatically switch to OnboardingStack after signup
    } catch (error) {
      console.error('Setup failed (skip):', error); // Log the full error
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableCuisines = cuisines.map(c => c.name);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
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
                <Text style={styles.title}>Cuisine Preferences</Text>
                <Text style={styles.subtitle}>
                  What are your favorite cuisines? Choose up to 3, or skip to continue.
                </Text>
              </View>

              <View style={styles.cuisineGrid}>
                {cuisinesLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 16 }).map((_, index) => (
                    <View key={index} style={styles.skeletonButton} />
                  ))
                ) : (
                  availableCuisines.map((cuisine) => {
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
                  })
                )}
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton, 
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleFinish}
                  disabled={loading}
                >
                  <Text style={styles.continueButtonText}>
                    {loading ? 'Creating Account...' : 'Finish'}
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
    backgroundColor: 'white' 
  },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingVertical: 20 
  },

  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 40,
    height: 44
  },

  backButton: { paddingVertical: 8, paddingHorizontal: 4 },
  backButtonText: { 
    fontSize: 20, 
    color: '#000', 
    fontWeight: '500' 
  },

  skipLink: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { 
    fontSize: 16, 
    color: '#404040', 
    fontWeight: '400',
    fontFamily: 'Inter-Regular'
  },

  mainContainer: { 
    flex: 1, 
    alignItems: 'flex-start', 
    width: '100%'
  },

  titleSection: { 
    marginBottom: 16,
    maxWidth: 343,
    alignItems: 'flex-start'
  },
  title: { 
    fontSize: 24, 
    color: '#000', 
    fontWeight: 'bold', 
    marginBottom: 25,
    fontFamily: 'Manrope-Bold',
    textAlign: 'left'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#404040', 
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },

  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 343,
    marginBottom: 30,
    alignSelf: 'center',
  },
  cuisineButton: {
    width: '48%',
    height: 40,
    backgroundColor: '#eaeaea',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  cuisineButtonSelected: {
    backgroundColor: '#FF8C4C',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cuisineButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  cuisineButtonTextSelected: {
    color: '#000',
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
    backgroundColor: '#FF8C4C', 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  continueButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  skeletonButton: {
    width: '48%',
    height: 40,
    backgroundColor: '#E1E9EE',
    borderRadius: 12,
    marginBottom: 8,
  },
});