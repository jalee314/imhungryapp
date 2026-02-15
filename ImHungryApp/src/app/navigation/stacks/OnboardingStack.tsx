/**
 * OnboardingStack (PR-021)
 * 
 * Navigation stack for onboarding/authentication flow.
 * Includes landing, signup, login, and account setup screens.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Onboarding screens
import LandingScreen from '../../../screens/onboarding/LandingScreen';
import SignUp from '../../../screens/onboarding/SignUp';
import LogIn from '../../../screens/onboarding/LogIn';
import ForgotPassword from '../../../screens/onboarding/ForgotPassword';
import ResetPassword from '../../../screens/onboarding/ResetPassword';
import UsernameScreen from '../../../screens/onboarding/UsernameScreen';
import ProfilePhoto from '../../../screens/onboarding/ProfilePhoto';
import LocationPermissions from '../../../screens/onboarding/LocationPermissions';
import InstantNotifications from '../../../screens/onboarding/InstantNotifications';
import CuisinePreferences from '../../../screens/onboarding/CuisinePreferences';

// Admin login accessible from onboarding
import AdminLoginScreen from '../../../screens/admin/AdminLoginScreen';

import type { OnboardingStackParamList } from '../types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * OnboardingStack - Authentication and account setup flow
 */
export const OnboardingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: false
    }}
    initialRouteName="Landing"
  >
    <Stack.Screen name="Landing" component={LandingScreen} />
    <Stack.Screen
      name="SignUp"
      component={SignUp}
      options={({ route }) => ({
        animation: (route.params as any)?.fromLogin ? 'slide_from_left' : 'slide_from_right'
      })}
    />
    <Stack.Screen name="LogIn" component={LogIn} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen name="ResetPassword" component={ResetPassword} />
    <Stack.Screen
      name="Username"
      component={UsernameScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen name="ProfilePhoto" component={ProfilePhoto} />
    <Stack.Screen name="LocationPermissions" component={LocationPermissions} />
    <Stack.Screen name="InstantNotifications" component={InstantNotifications} />
    <Stack.Screen name="CuisinePreferences" component={CuisinePreferences} />

    {/* Admin login accessible from login screen */}
    <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
  </Stack.Navigator>
);

export default OnboardingStack;
