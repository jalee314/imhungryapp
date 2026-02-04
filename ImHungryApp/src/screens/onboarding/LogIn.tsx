/**
 * LogInScreen - User Login
 * 
 * The login screen for existing users.
 * Uses atomic components for styling while preserving complex form logic.
 */

import React, { useState, useRef } from 'react';
import { 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  useWindowDimensions, 
  ScrollView,
  TouchableWithoutFeedback 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';

export default function LogInScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { isLoading: authLoading, signIn } = useAuth();

  // Responsive sizing
  const H = Math.max(16, Math.min(28, Math.round(width * 0.06)));
  const V = Math.max(12, Math.min(24, Math.round(height * 0.02)));
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('Invalid login credentials')) {
        setErrorMessage('Login credentials not recognized. Please check your email and password.');
      } else if (message.includes('Email not confirmed')) {
        setErrorMessage('Email not verified. Please verify your email address before logging in.');
      } else if (message.includes('Too many requests')) {
        setErrorMessage('Too many attempts. Please wait a moment before trying again.');
      } else {
        setErrorMessage(message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    (navigation as any).navigate('SignUp', { fromLogin: true });
  };

  const handleForgotPassword = () => {
    (navigation as any).navigate('ForgotPassword');
  };

  const handleImTap = () => {
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (newTapCount >= 7) {
      (navigation as any).navigate('AdminLogin');
      setTapCount(0);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 5000);
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Box>
              {/* Back Button */}
              <Pressable 
                onPress={handleBack}
                style={{ alignSelf: 'flex-start', marginBottom: V * 0.2, marginTop: V }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>

              <Box alignCenter justifyStart>
                {/* Welcome Section */}
                <Box 
                  style={[CONSTRAIN, { marginBottom: V * 1.5, paddingTop: height * 0.07 }]}
                >
                  <Text 
                    size="lg" 
                    weight="bold" 
                    color="text" 
                    style={{ marginBottom: V }}
                  >
                    Welcome back to{' '}
                    <TouchableWithoutFeedback onPress={handleImTap}>
                      <Text suppressHighlighting>Im</Text>
                    </TouchableWithoutFeedback>
                    Hungri
                  </Text>
                  <Text 
                    size="md" 
                    color="text" 
                    style={{ lineHeight: 24, marginBottom: -V * 0.9 }}
                  >
                    Sign in with your email address.
                  </Text>
                </Box>

                {/* Form Fields */}
                <Box width="100%" style={[CONSTRAIN, { marginBottom: V * 0.125 }]}>
                  <Box mb={GAP * 0.7}>
                    <TextInput
                      label="Email address"
                      mode="outlined"
                      value={formData.email}
                      onChangeText={t => handleInputChange('email', t)}
                      outlineColor={colors.primaryDark}
                      activeOutlineColor={colors.primaryDark}
                      style={{ backgroundColor: colors.background, minHeight: 56, fontSize: 16 }}
                      theme={{ roundness: 8, colors: { background: colors.background } }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                    />
                  </Box>

                  <Box mb={GAP * 0.7}>
                    <TextInput
                      label="Password"
                      mode="outlined"
                      value={formData.password}
                      onChangeText={t => handleInputChange('password', t)}
                      outlineColor={colors.primaryDark}
                      activeOutlineColor={colors.primaryDark}
                      style={{ backgroundColor: colors.background, minHeight: 56, fontSize: 16 }}
                      theme={{ roundness: 8, colors: { background: colors.background } }}
                      autoCapitalize="none"
                      autoComplete="current-password"
                      textContentType="password"
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                          forceTextInputFocus={false}
                        />
                      }
                    />
                  </Box>
                </Box>

                {/* Error Message */}
                {errorMessage && (
                  <Box style={[CONSTRAIN, { marginTop: 8, marginBottom: 4, paddingHorizontal: 4 }]}>
                    <Text size="sm" color="error" align="center" weight="medium">
                      {errorMessage}
                    </Text>
                  </Box>
                )}

                {/* Login Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={loading || authLoading}
                  bg="primaryDark"
                  rounded={25}
                  height={50}
                  center
                  style={[CONSTRAIN, { marginTop: V * 0.6, marginBottom: V, opacity: loading ? 0.7 : 1 }]}
                >
                  <Text size="md" color="textInverse">Log in</Text>
                </Pressable>

                {/* Forgot Password */}
                <Pressable onPress={handleForgotPassword} style={{ marginTop: 16 }}>
                  <Text size="sm" color="text" weight="medium" underline>
                    Forgot password?
                  </Text>
                </Pressable>
              </Box>
            </Box>

            {/* Legal */}
            <Box style={[CONSTRAIN, { marginTop: V * 2 }]} alignCenter>
              <Text size="xs" color="text" align="left" style={{ lineHeight: 16 }} numberOfLines={2}>
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
