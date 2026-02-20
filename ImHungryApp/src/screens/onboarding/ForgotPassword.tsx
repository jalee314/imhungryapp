import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';

import { sendPasswordResetEmail } from '../../services/authService';
import { BRAND, STATIC, SEMANTIC } from '../../ui/alf';

export default function ForgotPasswordScreen() {

  const navigation = useNavigation();
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

  const handleTermsPress = () => { };
  const handlePrivacyPress = () => { };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={[styles.pagePad, responsive.pagePad]}>
            <TouchableOpacity style={[styles.backButton, responsive.backButton]} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={STATIC.black} />
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={[styles.welcomeSection, responsive.welcomeSection, CONSTRAIN]}>
                <Text style={[styles.welcomeTitle, responsive.welcomeTitle]}>Welcome Back to ImHungri</Text>
                <Text style={[styles.welcomeSubtitle, responsive.welcomeSubtitle]}>
                  Reset Your Password
                </Text>
              </View>

              {/* Email Input */}
              <View style={[styles.formContainer, responsive.formContainer, CONSTRAIN]}>
                <View style={responsive.paperInput}>
                  <TextInput
                    label="Email address"
                    mode="outlined"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (successMessage) setSuccessMessage('');
                    }}
                    placeholder=""
                    outlineColor={BRAND.primary}
                    activeOutlineColor={BRAND.primary}
                    style={[styles.textInputStyle, { backgroundColor: STATIC.white }]}
                    theme={{
                      roundness: 12,
                      colors: {
                        background: 'white',
                      },
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="done"
                  />
                </View>
                {successMessage ? (
                  <Text style={styles.successText}>{successMessage}</Text>
                ) : null}
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity
                style={[styles.resetButton, responsive.resetButton, CONSTRAIN, loading && styles.loadingDimOpacity]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>Reset Password</Text>
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
  container: { flex: 1, backgroundColor: STATIC.white },
  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1 },
  mainContainer: { alignItems: 'center', justifyContent: 'flex-start' },
  loadingDimOpacity: { opacity: 0.7 },
  backButton: { alignSelf: 'flex-start' },
  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle: { fontSize: 20, color: STATIC.black, fontFamily: 'Inter-Bold' },
  welcomeSubtitle: { fontSize: 16, color: STATIC.black, lineHeight: 24, fontFamily: 'Inter-Regular' },
  formContainer: { width: '100%' },
  textInputStyle: {
    backgroundColor: STATIC.white,
    minHeight: 56,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },
  resetButton: {
    width: '100%',
    height: 44,
    backgroundColor: BRAND.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { color: STATIC.white, fontSize: 18, fontWeight: '600' },
  legalContainer: { alignItems: 'center' },
  legalText: { fontSize: 14, color: STATIC.black, textAlign: 'center', lineHeight: 20 },
  legalLink: { color: BRAND.accent, fontWeight: '500' },
  successText: {
    marginTop: 10,
    color: SEMANTIC.successAlt, // A shade of green
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
