import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';

export default function ProfilePhotoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
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
      Alert.alert('Error', 'Please add a profile photo or skip');
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

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Add a photo</Text>
                <Text style={styles.subtitle}>
                  Show off your style! Upload a photo so friends know it's you when you share deals.
                </Text>
              </View>

              <View style={styles.photoSection}>
                <TouchableOpacity style={styles.photoPlaceholder} onPress={handleCameraPress}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Image source={require('../../../img/gallery.jpg')} style={styles.cameraIcon} />
                    </View>
                  )}
                </TouchableOpacity>
                  <Text style={styles.photoInfo}>Tap Icon to add photo</Text>
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton, 
                    (!profilePhoto || loading) && { opacity: 0.5 }
                  ]}
                  onPress={handleContinue}
                  disabled={!profilePhoto || loading}
                >
                  <Text style={styles.continueButtonText}>
                    {loading ? 'Creating Account...' : 'Continue'}
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
    backgroundColor: 'white' 
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
    alignItems: 'left',
    marginBottom: 40,
    maxWidth: 300
  },
  title: { 
    fontSize: 24, 
    color: '#000', 
    fontWeight: 'bold', 
    marginBottom: 16,
    fontFamily: 'Manrope-Bold'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#000', 
    lineHeight: 24,
    fontFamily: 'Manrope-Regular'
  },

  photoSection: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  photoInfo: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Manrope-Regular'
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#000',
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
    paddingBottom: 16,
    alignItems: 'center'
  },

  continueButton: { 
    width: '100%', 
    maxWidth: 343,
    height: 44, 
    backgroundColor: '#FF8C4C', 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16
  },
  continueButtonText: { 
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