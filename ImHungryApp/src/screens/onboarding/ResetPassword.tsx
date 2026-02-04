/**
 * ResetPasswordScreen - Create New Password
 * 
 * Allows users to create a new password after clicking reset link.
 * Uses atomic components for styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  useWindowDimensions, 
  ScrollView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();
  const { setPasswordResetMode, resetPasswordWithTokens } = useAuth();

  const H = Math.max(16, Math.min(28, Math.round(width * 0.06)));
  const V = Math.max(12, Math.min(24, Math.round(height * 0.02)));
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const isUpdatingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    setPasswordResetMode(true);

    const params = route.params as { access_token?: string; refresh_token?: string };
    const accessToken = params?.access_token;
    const refreshToken = params?.refresh_token;

    if (accessToken && refreshToken) {
      try {
        if (accessToken.length > 0 && refreshToken.length > 0) {
          setSessionReady(true);
        } else {
          Alert.alert('Error', 'This password reset link is invalid or has expired.');
          setSessionReady(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        Alert.alert('Error', 'This password reset link is invalid or has expired.');
        setSessionReady(false);
      }
    } else {
      setSessionReady(false);
    }

    return () => {
      if (!isUpdatingRef.current) {
        setPasswordResetMode(false);
        hasInitializedRef.current = false;
      }
    };
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async () => {
    if (!sessionReady) {
      Alert.alert('Error', 'Session not ready. Please try again.');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    isUpdatingRef.current = true;
    try {
      const params = route.params as { access_token?: string; refresh_token?: string };
      const accessToken = params?.access_token;
      const refreshToken = params?.refresh_token;

      if (!accessToken || !refreshToken) {
        Alert.alert('Error', 'Invalid reset link');
        isUpdatingRef.current = false;
        return;
      }

      const result = await resetPasswordWithTokens(accessToken, refreshToken, formData.newPassword);
      if ((result as any).error) {
        Alert.alert('Error', 'This password reset link is invalid or has expired.');
        isUpdatingRef.current = false;
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setPasswordResetMode(false);
        isUpdatingRef.current = false;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        (navigation as any).navigate('LogIn');
        
        setTimeout(() => {
          Alert.alert(
            'Success',
            'Your password has been updated successfully! Please log in with your new password.'
          );
        }, 300);
      }
    } catch (err) {
      console.error('Password update error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
      isUpdatingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <Box flex={1} bg="background">
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: H, paddingVertical: V }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Box>
              {/* Back Button */}
              <Pressable 
                onPress={handleBack} 
                style={{ alignSelf: 'flex-start', marginBottom: V * 1.5, marginTop: V }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>

              <Box alignCenter justifyStart style={{ paddingTop: 30 }}>
                {/* Welcome Section */}
                <Box style={[CONSTRAIN, { marginBottom: V * 1.5 }]}>
                  <Text 
                    size="lg" 
                    weight="bold" 
                    color="text" 
                    style={{ marginBottom: V }}
                  >
                    Welcome Back to ImHungri
                  </Text>
                  <Text 
                    size="md" 
                    color="text" 
                    style={{ lineHeight: 24, marginBottom: -V * 0.35 }}
                  >
                    Create a New Password
                  </Text>
                </Box>

                {/* Form Fields */}
                <Box width="100%" style={[CONSTRAIN, { marginBottom: V * 0.125 }]}>
                  <Box mb={GAP * 1.5}>
                    <TextInput
                      label="New Password"
                      mode="outlined"
                      value={formData.newPassword}
                      onChangeText={t => handleInputChange('newPassword', t)}
                      outlineColor={colors.primaryDark}
                      activeOutlineColor={colors.primaryDark}
                      style={{ backgroundColor: colors.background, minHeight: 56, fontSize: 16 }}
                      theme={{ roundness: 12, colors: { background: colors.background } }}
                      secureTextEntry={!showNewPassword}
                      returnKeyType="next"
                      onFocus={() => setIsNewPasswordFocused(true)}
                      onBlur={() => setIsNewPasswordFocused(false)}
                      right={
                        <TextInput.Icon
                          icon={() => (
                            <Ionicons
                              name={showNewPassword ? 'eye-off' : 'eye'}
                              size={20}
                              color={colors.textLight}
                              style={{ opacity: isNewPasswordFocused ? 1 : 0 }}
                            />
                          )}
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={{ opacity: isNewPasswordFocused ? 1 : 0 }}
                        />
                      }
                    />
                  </Box>

                  <Box mb={GAP * 1.5}>
                    <TextInput
                      label="Confirm New Password"
                      mode="outlined"
                      value={formData.confirmPassword}
                      onChangeText={t => handleInputChange('confirmPassword', t)}
                      outlineColor={colors.primaryDark}
                      activeOutlineColor={colors.primaryDark}
                      style={{ backgroundColor: colors.background, minHeight: 56, fontSize: 16 }}
                      theme={{ roundness: 12, colors: { background: colors.background } }}
                      secureTextEntry={!showConfirmPassword}
                      returnKeyType="done"
                      onFocus={() => setIsConfirmPasswordFocused(true)}
                      onBlur={() => setIsConfirmPasswordFocused(false)}
                      right={
                        <TextInput.Icon
                          icon={() => (
                            <Ionicons
                              name={showConfirmPassword ? 'eye-off' : 'eye'}
                              size={20}
                              color={colors.textLight}
                              style={{ opacity: isConfirmPasswordFocused ? 1 : 0 }}
                            />
                          )}
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ opacity: isConfirmPasswordFocused ? 1 : 0 }}
                        />
                      }
                    />
                  </Box>
                </Box>

                {/* Update Password Button */}
                <Pressable
                  onPress={handleUpdatePassword}
                  disabled={!sessionReady || loading}
                  bg="primaryDark"
                  rounded={22}
                  height={44}
                  center
                  style={[CONSTRAIN, { 
                    marginTop: V, 
                    marginBottom: V, 
                    opacity: (!sessionReady || loading) ? 0.7 : 1 
                  }]}
                >
                  <Text size="md" color="textInverse">
                    Update Password
                  </Text>
                </Pressable>
              </Box>
            </Box>

            {/* Spacer */}
            <Box flex={1} minHeight={20} />

            {/* Legal */}
            <Box style={CONSTRAIN} alignCenter>
              <Text size="xs" color="text" style={{ lineHeight: 16 }} numberOfLines={2}>
                By continuing, you agree to ImHungri's{' '}
                <Text size="xs" color="primary" weight="semiBold">Terms & Conditions</Text>{' '}
                and{' '}
                <Text size="xs" color="primary" weight="semiBold">Privacy Policy</Text>
              </Text>
            </Box>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  );
}
