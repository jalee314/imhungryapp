import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();

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

  useEffect(() => {
    // React Navigation passes the URL query params to the route.
    // We can access them directly here.
    const params = route.params as { access_token?: string; refresh_token?: string };
    const accessToken = params?.access_token;
    const refreshToken = params?.refresh_token;

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          Alert.alert('Error', 'This password reset link is invalid or has expired.');
          setSessionReady(false);
        } else {
          setSessionReady(true);
        }
      });
    } else {
      // If no tokens, the link is invalid.
      setSessionReady(false);
    }
  }, [route.params]); // Re-run if the route params change.

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
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success',
          'Your password has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => (navigation as any).navigate('LogIn'),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
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
                    dense
                    style={[styles.paperInput, { backgroundColor: 'white' }]}
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
                    dense
                    style={[styles.paperInput, { backgroundColor: 'white' }]}
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