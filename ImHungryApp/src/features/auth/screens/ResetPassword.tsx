import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { atoms as a, tokens } from '#/ui';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();
  const { setPasswordResetMode } = useAuth();

  const H = Math.max(16, Math.min(28, Math.round(width * 0.06)));
  const V = Math.max(12, Math.min(24, Math.round(height * 0.02)));
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const responsive = {
    pagePad: { paddingHorizontal: H, paddingVertical: V },
    backButton: { marginBottom: Math.round(V * 1.5), marginTop: V },
    welcomeSection: { marginBottom: Math.round(V * 1.5) },
    welcomeTitle: { marginBottom: Math.round(V * 1) },
    welcomeSubtitle: { marginBottom: -Math.round(V * 0.35) },
    formContainer: { marginBottom: Math.round(V * 0.125) },
    paperInput: { marginBottom: Math.round(GAP * 1.5) },
    resetButton: { marginTop: V, marginBottom: V },
    legalContainer: { marginTop: V * 2 },
  };

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
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log('ResetPassword: Already initialized, skipping');
      return;
    }
    
    hasInitializedRef.current = true;
    
    // Enable password reset mode FIRST to prevent AuthContext from reacting to session changes
    console.log('ResetPassword: Enabling password reset mode');
    setPasswordResetMode(true);

    // React Navigation passes the URL query params to the route.
    // We can access them directly here.
    const params = route.params as { access_token?: string; refresh_token?: string };
    const accessToken = params?.access_token;
    const refreshToken = params?.refresh_token;

    if (accessToken && refreshToken) {
      // For password reset, we validate the tokens without establishing a persistent session
      // We'll store them temporarily for the password update process
      try {
        // Basic token validation - check if they exist and have the right format
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
      // If no tokens, the link is invalid.
      setSessionReady(false);
    }

    // Cleanup: disable password reset mode when component unmounts
    // But only if we're not in the middle of a password update
    return () => {
      // Only disable password reset mode if not currently updating
      if (!isUpdatingRef.current) {
        console.log('ResetPassword: Component unmounting, disabling password reset mode');
        setPasswordResetMode(false);
        hasInitializedRef.current = false; // Reset for potential remount
      } else {
        console.log('ResetPassword: Component unmounting but update in progress, keeping password reset mode active');
      }
    };
  }, []); // Empty dependency array - only run once on mount

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
      // Get the reset tokens
      const params = route.params as { access_token?: string; refresh_token?: string };
      const accessToken = params?.access_token;
      const refreshToken = params?.refresh_token;

      if (!accessToken || !refreshToken) {
        Alert.alert('Error', 'Invalid reset link');
        isUpdatingRef.current = false;
        return;
      }

      // Use store-backed helper to set session, update password, and sign out locally
      const { resetPasswordWithTokens } = useAuth();
      const result = await resetPasswordWithTokens(accessToken, refreshToken, formData.newPassword);
      if ((result as any).error) {
        Alert.alert('Error', 'This password reset link is invalid or has expired.');
        isUpdatingRef.current = false;
      } else {
        // Success - sign out FIRST (synchronously), then disable password reset mode, then navigate
        console.log('Password updated successfully, signing out...');
        
        // Wait a moment for the sign out to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Disabling password reset mode...');
        setPasswordResetMode(false);
        isUpdatingRef.current = false;
        
        // Wait another moment before navigation to ensure clean state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Navigating to login screen...');
        (navigation as any).navigate('LogIn');
        
        // Show success message after navigation
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

  const handleTermsPress = () => {};
  const handlePrivacyPress = () => {};

  return (
    <View style={[a.flex_1, { backgroundColor: tokens.color.white }]}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={[styles.pagePad, responsive.pagePad]}>
            <TouchableOpacity style={[styles.backButton, responsive.backButton]} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={tokens.color.black} />
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={[styles.welcomeSection, responsive.welcomeSection, CONSTRAIN]}>
                <Text style={[styles.welcomeTitle, responsive.welcomeTitle]}>Welcome Back to ImHungri</Text>
                <Text style={[styles.welcomeSubtitle, responsive.welcomeSubtitle]}>
                  Create a New Password
                </Text>
              </View>

              {/* Form Fields */}
              <View style={[styles.formContainer, responsive.formContainer, CONSTRAIN]}>
                <View style={responsive.paperInput}>
                  <TextInput
                    label="New Password"
                    mode="outlined"
                    value={formData.newPassword}
                    onChangeText={t => handleInputChange('newPassword', t)}
                    placeholder=""
                    outlineColor={tokens.color.primary_600}
                    activeOutlineColor={tokens.color.primary_600}
                    style={[styles.textInputStyle, { backgroundColor: tokens.color.white }]}
                    theme={{
                      roundness: tokens.radius.md,
                      colors: {
                        background: tokens.color.white,
                      },
                    }}
                    secureTextEntry={!showNewPassword}
                    returnKeyType="next"
                    onFocus={() => setIsNewPasswordFocused(true)}
                    onBlur={() => setIsNewPasswordFocused(false)}
                    right={(
                      <TextInput.Icon
                        icon={() => (
                          <Ionicons
                            name={showNewPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={tokens.color.gray_600}
                            style={{ opacity: isNewPasswordFocused ? 1 : 0 }}
                          />
                        )}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={{ opacity: isNewPasswordFocused ? 1 : 0 }}
                      />
                    )}
                  />
                </View>

                <View style={responsive.paperInput}>
                  <TextInput
                    label="Confirm New Password"
                    mode="outlined"
                    value={formData.confirmPassword}
                    onChangeText={t => handleInputChange('confirmPassword', t)}
                    placeholder=""
                    outlineColor={tokens.color.primary_600}
                    activeOutlineColor={tokens.color.primary_600}
                    style={[styles.textInputStyle, { backgroundColor: tokens.color.white }]}
                    theme={{
                      roundness: tokens.radius.md,
                      colors: {
                        background: tokens.color.white,
                      },
                    }}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    right={(
                      <TextInput.Icon
                        icon={() => (
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={tokens.color.gray_600}
                            style={{ opacity: isConfirmPasswordFocused ? 1 : 0 }}
                          />
                        )}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ opacity: isConfirmPasswordFocused ? 1 : 0 }}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Update Password Button */}
              <TouchableOpacity
                style={[styles.resetButton, responsive.resetButton, CONSTRAIN, (!sessionReady || loading) && { opacity: 0.7 }]}
                onPress={handleUpdatePassword}
                disabled={!sessionReady || loading}
              >
                <Text style={styles.resetButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>

            {/* Legal */}
            <View style={[styles.legalContainer, responsive.legalContainer, CONSTRAIN]}>
              <Text style={styles.legalText}>
                By continuing, you agree to ImHungri's{' '}
                <Text style={styles.legalLink} onPress={handleTermsPress}>Terms & Conditions</Text>{' '}
                and{' '}
                <Text style={styles.legalLink} onPress={handlePrivacyPress}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.white },
  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1 },
  mainContainer: { alignItems: 'center', justifyContent: 'flex-start' },
  backButton: { alignSelf: 'flex-start' },
  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle: { fontSize: tokens.fontSize.xl, color: tokens.color.black, fontFamily: 'Inter-Bold' },
  welcomeSubtitle: { fontSize: tokens.fontSize.md, color: tokens.color.black, lineHeight: 24, fontFamily: 'Inter-Regular' },
  formContainer: { width: '100%' },
  paperInput: { backgroundColor: tokens.color.white },
  textInputStyle: {
    backgroundColor: tokens.color.white,
    minHeight: 56,
    fontSize: tokens.fontSize.md,
    lineHeight: 22,
    paddingVertical: 0,
  },
  resetButton: {
    width: '100%',
    height: 44,
    backgroundColor: tokens.color.primary_600,
    borderRadius: tokens.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { color: tokens.color.white, fontSize: tokens.fontSize.lg, fontWeight: tokens.fontWeight.semibold },
  legalContainer: { alignItems: 'center' },
  legalText: { fontSize: tokens.fontSize.sm, color: tokens.color.black, textAlign: 'center', lineHeight: 20 },
  legalLink: { color: tokens.color.warning_500, fontWeight: tokens.fontWeight.medium },
});