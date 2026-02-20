/**
 * OnboardingStack (PR-021)
 * 
 * Navigation stack for onboarding/authentication flow.
 * Includes landing, signup, login, and account setup screens.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Onboarding screens
import AdminLoginScreen from '../../../screens/admin/AdminLoginScreen';
import CuisinePreferences from '../../../screens/onboarding/CuisinePreferences';
import ForgotPassword from '../../../screens/onboarding/ForgotPassword';
import InstantNotifications from '../../../screens/onboarding/InstantNotifications';
import LandingScreen from '../../../screens/onboarding/LandingScreen';
import LocationPermissions from '../../../screens/onboarding/LocationPermissions';
import LogIn from '../../../screens/onboarding/LogIn';
import ProfilePhoto from '../../../screens/onboarding/ProfilePhoto';
import ResetPassword from '../../../screens/onboarding/ResetPassword';
import SignUp from '../../../screens/onboarding/SignUp';
import UsernameScreen from '../../../screens/onboarding/UsernameScreen';
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
        animation: (route.params)?.fromLogin ? 'slide_from_left' : 'slide_from_right'
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
