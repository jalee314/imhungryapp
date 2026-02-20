import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useDataCache } from '../../hooks/useDataCache';
import { BRAND, STATIC, GRAY } from '../../ui/alf';

export default function CuisinePreferencesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
  const userData = (route.params)?.userData;
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { completeSignup, completeSignupSkip } = useAuth();

  // Ref to synchronously track submission state and prevent duplicate submissions
  const isSubmittingRef = useRef(false);

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

  // Backend operations moved to onboardingService via store actions

  const handleFinish = async () => {
    // Synchronous check to prevent duplicate submissions
    if (isSubmittingRef.current) return;

    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    // Set ref immediately (synchronous) to block any subsequent clicks
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      try {
        await completeSignup(userData, selectedCuisines);
      } catch (error) {
        const message = error?.message || 'An unexpected error occurred.';
        if (typeof message === 'string' && (message.includes('duplicate key') || message.includes('unique constraint'))) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email, phone number, or username already exists. Please try logging in or use different information.',
            [{ text: 'Go Back', onPress: () => (navigation).navigate('SignUp', { userData }) }]
          );
        } else if (typeof message === 'string' && (message.includes('ST_GeogFromText') || message.includes('PostGIS'))) {
          Alert.alert('Location Error', 'There was an issue processing your location. Please try again.', [{ text: 'Go Back', onPress: () => navigation.goBack() }]);
        } else if (typeof message === 'string' && message.includes('User creation failed')) {
          Alert.alert('Database Error', `Account creation failed: ${message}. Please contact support if this continues.`, [{ text: 'Go Back', onPress: () => (navigation).navigate('SignUp', { userData }) }]);
        } else {
          Alert.alert('Account Creation Failed', 'An unexpected error occurred. Please try again or contact support.', [{ text: 'Go Back', onPress: () => (navigation).navigate('SignUp', { userData }) }]);
        }
        return;
      }

      // Let the authentication state change handle navigation
      // The app will automatically switch to OnboardingStack after signup
    } catch (error) {
      console.error('Setup failed:', error); // Log the full error
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Synchronous check to prevent duplicate submissions
    if (isSubmittingRef.current) return;

    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    // Set ref immediately (synchronous) to block any subsequent clicks
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      try {
        await completeSignupSkip(userData);
      } catch (error) {
        Alert.alert(
          'Account Creation Failed',
          'An account with this email, phone number, or username may already exist. Please go back and check your information.',
          [{ text: 'Go Back', onPress: () => (navigation).navigate('SignUp', { userData }) }]
        );
        return;
      }
      // Let the authentication state change handle navigation
      // The app will automatically switch to OnboardingStack after signup
    } catch (error) {
      console.error('Setup failed (skip):', error); // Log the full error
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const availableCuisines = cuisines.map(c => c.name);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.skipLink, loading && styles.loadingHalfOpacity]}
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Cuisine Preferences</Text>
                <Text style={styles.subtitle}>
                  What are your favorite cuisines? Choose up to 3.
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

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    loading && styles.loadingDimOpacity
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
    backgroundColor: STATIC.white
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
    color: STATIC.black,
    fontWeight: '500'
  },

  skipLink: { paddingVertical: 8, paddingHorizontal: 4 },
  loadingHalfOpacity: { opacity: 0.5 },
  loadingDimOpacity: { opacity: 0.7 },
  skipText: {
    fontSize: 16,
    color: GRAY[800],
    fontWeight: '400',
    fontFamily: 'Inter-Regular'
  },

  mainContainer: {
    flex: 1,
    alignItems: 'flex-start',
    width: '100%'
  },

  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 24,
    maxWidth: 343,
  },
  title: {
    fontSize: 24,
    color: STATIC.black,
    fontWeight: 'bold',
    marginBottom: 25,
    fontFamily: 'Inter-Bold',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: GRAY[800],
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
  },

  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    flex: 1,
    paddingBottom: 16,
  },
  cuisineButton: {
    width: '48%',
    height: 36,
    backgroundColor: GRAY[200],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cuisineButtonSelected: {
    backgroundColor: BRAND.primary,
  },
  cuisineButtonText: {
    color: STATIC.black,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  cuisineButtonTextSelected: {
    color: STATIC.black,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },

  continueButton: {
    width: '100%',
    maxWidth: 343,
    height: 44,
    backgroundColor: BRAND.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  continueButtonText: {
    color: STATIC.white,
    fontSize: 16,
    fontWeight: '600'
  },
  skeletonButton: {
    width: '48%',
    height: 36,
    backgroundColor: GRAY[300],
    borderRadius: 18,
    marginBottom: 8,
  },
});
