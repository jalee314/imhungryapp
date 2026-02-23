import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';

import { BRAND, STATIC, GRAY } from '../../ui/alf';

export default function ProfilePhotoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;
  const existingProfilePhoto = (route.params as any)?.profilePhoto;

  const [profilePhoto, setProfilePhoto] = useState<string | null>(existingProfilePhoto || null);
  const [loading, setLoading] = useState(false);

  const handleCameraPress = () => {
    Alert.alert(
      'Add Profile Photo',
      'Choose how you want to add your profile photo',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo!');
        return;
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8, // Good quality but not too large
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a photo!');
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8, // Good quality but not too large
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSkip = async () => {
    // Submit with default profile picture without changing UI
    await submitUserDataWithDefault();
  };

  const handleContinue = async () => {
    if (!profilePhoto) {
      // If no photo is selected, trigger photo selection
      handleCameraPress();
      return;
    }
    await submitUserData();
  };

  const submitUserData = async () => {
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    // Navigate to location permissions page with user data
    (navigation as any).navigate('LocationPermissions', {
      userData: {
        ...userData,
        profile_photo_url: profilePhoto,
      },
    });
  };

  const submitUserDataWithDefault = async () => {
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    // Navigate to location permissions page with user data (default avatar)
    (navigation as any).navigate('LocationPermissions', {
      userData: {
        ...userData,
        profile_photo_url: 'default_avatar',
      },
    });
  };

  const handleGoBack = () => {
    // Navigate back to Username screen with the current profile photo preserved
    (navigation as any).navigate('Username', {
      userData,
      profilePhoto,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: STATIC.white }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Add a photo</Text>
                <Text style={styles.subtitle}>
                  Show off your style! Upload a photo so the community know it’s you when you share deals.
                </Text>
              </View>

              <View style={styles.photoSection}>
                <TouchableOpacity style={styles.photoPlaceholder} onPress={handleCameraPress}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Image source={require('../../../img/onboarding/camera.png')} style={styles.cameraIcon} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    loading && { opacity: 0.5 }
                  ]}
                  onPress={handleContinue}
                  disabled={loading}
                >
                  <Text style={styles.continueButtonText}>
                    {loading ? 'Creating Account...' : (profilePhoto ? 'Continue' : 'Choose Photo')}
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
    marginBottom: 40,
    maxWidth: 343
  },
  title: {
    fontSize: 24,
    color: STATIC.black,
    fontWeight: 'bold',
    marginBottom: 25,
    fontFamily: 'Inter-Bold',
    textAlign: 'left'
  },
  subtitle: {
    fontSize: 16,
    color: GRAY[800],
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },

  photoSection: {
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'center'
  },
  photoInfo: {
    marginTop: 12,
    fontSize: 14,
    color: GRAY[600],
    fontFamily: 'Inter-Regular'
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: STATIC.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  cameraIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    width: 120,
    height: 95,
    resizeMode: 'contain'
  },
  profileImage: {
    width: 194,
    height: 194,
    borderRadius: 97,
    resizeMode: 'cover'
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
});