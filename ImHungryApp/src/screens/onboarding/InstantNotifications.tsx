import React, { useState } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';

export default function InstantNotificationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;
  const [loading, setLoading] = useState(false);

  const handleGetNotified = async () => {
    setLoading(true);
    try {
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      // Permission request failed, continue anyway
    }
    (navigation as any).navigate('CuisinePreferences', { userData });
    setLoading(false);
  };

  const handleSkip = () => {
    (navigation as any).navigate('CuisinePreferences', { userData });
  };

  const notificationIconStyle = {
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
                  Instant Notifications
                </Text>
                <Text 
                  size="base" 
                  color="textLight" 
                  lineHeight={24}
                  style={{ fontFamily: typography.fontFamily.regular, textAlign: 'left' }}
                >
                  Get instant alerts when your favorite restaurants drop new offers, happy hours, or limited-time specials.
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
                  <Image source={require('../../../img/onboarding/notification.png')} style={notificationIconStyle} />
                </Box>
              </Box>

              {/* Spacer */}
              <Box flex={1} />

              {/* Footer */}
              <Box width="100%" alignCenter style={{ alignSelf: 'center' }}>
                <Pressable
                  onPress={handleGetNotified}
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
                    {loading ? 'Setting up...' : 'Get Notified'}
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
