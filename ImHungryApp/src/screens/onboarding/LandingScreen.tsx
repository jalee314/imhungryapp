/**
 * LandingScreen - App Entry Point
 * 
 * The initial landing screen showing the app logo.
 * Tapping anywhere navigates to the sign up flow.
 */

import React from 'react';
import { Image, Dimensions, Pressable as RNPressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Box } from '../../components/atoms';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const logoSize = Math.min(screenWidth * 0.6, screenHeight * 0.3, 300);

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <Box flex={1} center bg="background">
      <StatusBar style="dark" />
      <RNPressable
        onPress={() => navigation.navigate('SignUp' as never)}
        accessibilityRole="button"
        accessibilityLabel="Continue to sign up"
        hitSlop={8}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Image 
          source={require('../../../img/logo/hungri_logo.png')} 
          style={{
            width: logoSize,
            height: logoSize,
            maxWidth: '80%',
            maxHeight: '40%',
          }}
          resizeMode="contain"
        />
      </RNPressable>
    </Box>
  );
}
