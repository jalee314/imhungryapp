import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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

      // Set session temporarily for password update
      // AuthContext won't react because password reset mode is enabled
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        Alert.alert('Error', 'This password reset link is invalid or has expired.');
        isUpdatingRef.current = false;
        return;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        Alert.alert('Error', error.message);
        // Sign out even on error to ensure clean state
        await supabase.auth.signOut({ scope: 'local' });
        isUpdatingRef.current = false;
      } else {
        // Success - sign out FIRST (synchronously), then disable password reset mode, then navigate
        console.log('Password updated successfully, signing out...');
        
        // Clear the session completely - use signOut with scope: 'local'
        await supabase.auth.signOut({ scope: 'local' });
        
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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={[styles.pagePad, responsive.pagePad]}>
            <TouchableOpacity style={[styles.backButton, responsive.backButton]} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#000" />
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
                    outlineColor="#FF8C4C"
                    activeOutlineColor="#FF8C4C"
                    style={[styles.textInputStyle, { backgroundColor: 'white' }]}
                    theme={{
                      roundness: 12,
                      colors: {
                        background: 'white',
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
                            color="#666"
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
                    outlineColor="#FF8C4C"
                    activeOutlineColor="#FF8C4C"
                    style={[styles.textInputStyle, { backgroundColor: 'white' }]}
                    theme={{
                      roundness: 12,
                      colors: {
                        background: 'white',
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
                            color="#666"
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
  container: { flex: 1, backgroundColor: 'white' },
  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1 },
  mainContainer: { alignItems: 'center', justifyContent: 'flex-start' },
  backButton: { alignSelf: 'flex-start' },
  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle: { fontSize: 20, color: '#000', fontFamily: 'Manrope-Bold' },
  welcomeSubtitle: { fontSize: 16, color: '#000', lineHeight: 24, fontFamily: 'Manrope-Regular' },
  formContainer: { width: '100%' },
  paperInput: { backgroundColor: 'white' },
  textInputStyle: {
    backgroundColor: 'white',
    minHeight: 56,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },
  resetButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FF8C4C',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  legalContainer: { alignItems: 'center' },
  legalText: { fontSize: 14, color: '#000', textAlign: 'center', lineHeight: 20 },
  legalLink: { color: '#FF9800', fontWeight: '500' },
});