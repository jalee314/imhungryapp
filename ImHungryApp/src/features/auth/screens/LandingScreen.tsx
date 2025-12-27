import React from 'react';
import { Pressable, View, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { atoms as a, useTheme } from '#/ui';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * LandingScreen - Initial splash/landing screen
 * Displays the app logo and navigates to SignUp on tap.
 * Uses design tokens for consistent styling.
 */
export default function LandingScreen() {
  const navigation = useNavigation();
  const t = useTheme();

  // Calculate responsive logo size
  const logoSize = Math.min(screenWidth * 0.6, screenHeight * 0.3, 300);

  return (
    <View style={[a.flex_1, a.align_center, a.justify_center, t.atoms.bg]}>
      <StatusBar style="dark" />
      <Pressable
        style={[a.flex_1, a.align_center, a.justify_center, a.w_full]}
        onPress={() => navigation.navigate('SignUp' as never)}
        accessibilityRole="button"
        accessibilityLabel="Continue to sign up"
        hitSlop={8}
      >
        <Image 
          source={require('../../../../img/logo/hungri_logo.png')} 
          style={{ width: logoSize, height: logoSize, maxWidth: '80%', maxHeight: '40%' }}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}
