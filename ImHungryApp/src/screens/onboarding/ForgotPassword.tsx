/**
 * ForgotPasswordScreen - Password Reset Request
 * 
 * Allows users to request a password reset email.
 * Uses atomic components for styling.
 */

import React, { useState } from 'react';
import { 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  useWindowDimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors } from '../../lib/theme';
import { sendPasswordResetEmail } from '../../services/authService';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const H = Math.max(16, Math.min(28, Math.round(width * 0.06)));
  const V = Math.max(12, Math.min(24, Math.round(height * 0.02)));
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setSuccessMessage('');
    setLoading(true);
    
    try {
      const result = await sendPasswordResetEmail(email);
      
      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
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
          <Box flex={1} px={H} py={V}>
            {/* Back Button */}
            <Pressable 
              onPress={handleBack} 
              style={{ alignSelf: 'flex-start', marginBottom: V * 1.5, marginTop: V }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>

            <Box alignCenter justifyStart>
              {/* Welcome Section */}
              <Box style={[CONSTRAIN, { marginBottom: V * 1.5 }]}>
                <Text 
                  size="xl" 
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
                  Reset Your Password
                </Text>
              </Box>

              {/* Email Input */}
              <Box width="100%" style={[CONSTRAIN, { marginBottom: V * 0.125 }]}>
                <Box mb={GAP * 1.5}>
                  <TextInput
                    label="Email address"
                    mode="outlined"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (successMessage) setSuccessMessage('');
                    }}
                    outlineColor={colors.primaryDark}
                    activeOutlineColor={colors.primaryDark}
                    style={{ backgroundColor: colors.background, minHeight: 56, fontSize: 16 }}
                    theme={{ roundness: 12, colors: { background: colors.background } }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="done"
                  />
                </Box>
                {successMessage ? (
                  <Text size="sm" color="success" align="center" style={{ marginTop: 10 }}>
                    {successMessage}
                  </Text>
                ) : null}
              </Box>

              {/* Reset Password Button */}
              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                bg="primaryDark"
                rounded={22}
                height={44}
                center
                style={[CONSTRAIN, { marginTop: V, marginBottom: V, opacity: loading ? 0.7 : 1 }]}
              >
                <Text size="lg" weight="semiBold" color="textInverse">
                  Reset Password
                </Text>
              </Pressable>
            </Box>

            {/* Legal */}
            <Box style={[CONSTRAIN, { marginTop: V * 2 }]} alignCenter>
              <Text size="sm" color="text" align="center" style={{ lineHeight: 20 }}>
                By continuing, you agree to ImHungri's{' '}
                <Text size="sm" color="warning" weight="medium">Terms & Conditions</Text>{' '}
                and{' '}
                <Text size="sm" color="warning" weight="medium">Privacy Policy</Text>
              </Text>
            </Box>
          </Box>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  );
}
