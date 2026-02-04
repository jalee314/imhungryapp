import React, { useState } from 'react';
import {
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';

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
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
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
    await submitUserDataWithDefault();
  };

  const handleContinue = async () => {
    if (!profilePhoto) {
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

    (navigation as any).navigate('LocationPermissions', {
      userData: {
        ...userData,
        profile_photo_url: 'default_avatar',
      },
    });
  };

  const handleGoBack = () => {
    (navigation as any).navigate('Username', {
      userData,
      profilePhoto,
    });
  };

  const profileImageStyle = {
    width: 194,
    height: 194,
    borderRadius: 97,
    resizeMode: 'cover' as const,
  };

  const cameraIconStyle = {
    width: 120,
    height: 95,
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
              <Pressable py="m" px="xs" onPress={handleGoBack}>
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
              <Box alignStart mb="5xl" maxWidth={343}>
                <Text 
                  size="2xl" 
                  weight="bold" 
                  color="text" 
                  mb="3xl"
                  style={{ fontFamily: typography.fontFamily.bold, textAlign: 'left' }}
                >
                  Add a photo
                </Text>
                <Text 
                  size="base" 
                  color="textLight" 
                  lineHeight={24}
                  style={{ fontFamily: typography.fontFamily.regular, textAlign: 'left' }}
                >
                  Show off your style! Upload a photo so the community know it's you when you share deals.
                </Text>
              </Box>

              {/* Photo Section */}
              <Box alignCenter mb="5xl" style={{ alignSelf: 'center' }}>
                <Pressable 
                  onPress={handleCameraPress}
                  width={200}
                  height={200}
                  rounded="full"
                  center
                  style={{
                    backgroundColor: '#000',
                    overflow: 'hidden',
                  }}
                >
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={profileImageStyle} />
                  ) : (
                    <Box center>
                      <Image 
                        source={require('../../../img/onboarding/camera.png')} 
                        style={cameraIconStyle} 
                      />
                    </Box>
                  )}
                </Pressable>
              </Box>

              {/* Spacer */}
              <Box flex={1} />

              {/* Footer */}
              <Box width="100%" alignCenter style={{ alignSelf: 'center' }}>
                <Pressable
                  onPress={handleContinue}
                  disabled={loading}
                  width="100%"
                  maxWidth={343}
                  height={44}
                  rounded="full"
                  alignCenter
                  justifyCenter
                  bg="primaryDark"
                  style={loading ? { opacity: 0.5 } : undefined}
                >
                  <Text color="textInverse" size="base" weight="semiBold">
                    {loading ? 'Creating Account...' : (profilePhoto ? 'Continue' : 'Choose Photo')}
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
