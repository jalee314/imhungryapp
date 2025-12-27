import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from '#/services/authService';
import { atoms as a, tokens } from '#/ui';

export default function ForgotPasswordScreen() {
  
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const H   = Math.max(16, Math.min(28, Math.round(width  * 0.06)));
  const V   = Math.max(12, Math.min(24, Math.round(height * 0.02)));
  const GAP = Math.max( 8, Math.min(16, Math.round(height * 0.012)));
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
                    outlineColor={tokens.color.primary_600}
                    activeOutlineColor={tokens.color.primary_600}
                    style={[styles.textInputStyle, { backgroundColor: tokens.color.white }]}
                    theme={{
                      roundness: tokens.radius.md,
                      colors: {
                        background: tokens.color.white,
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
                style={[styles.resetButton, responsive.resetButton, CONSTRAIN, loading && { opacity: 0.7 }]}
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
  successText: {
    marginTop: tokens.space.sm,
    color: tokens.color.success_600,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});