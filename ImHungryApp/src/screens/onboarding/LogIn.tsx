import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

export default function LogInScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const H   = Math.max(16, Math.min(28, Math.round(width  * 0.06)));   // horizontal page padding
  const V   = Math.max(12, Math.min(24, Math.round(height * 0.02)));   // vertical rhythm
  const GAP = Math.max( 8, Math.min(16, Math.round(height * 0.012)));  // between inputs
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const responsive = {
    pagePad:        { paddingHorizontal: H, paddingVertical: V },
    backButton:     { marginBottom: Math.round(V * 1.5), marginTop: V  },
    welcomeSection: { marginBottom: Math.round(V * 1.5) },
    welcomeTitle:   { marginBottom: Math.round(V * 1) },
    welcomeSubtitle:{ marginBottom: -Math.round(V * 0.35) },
    formContainer:  { marginBottom: Math.round(V * 0.125) },
    paperInput:     { marginBottom: Math.round(GAP * 1.5)},
    continueButton: { marginTop: V, marginBottom: V },
    legalContainer: { marginTop: V * 2 },
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Navigate to main app or home screen
        (navigation as any).navigate('ProfilePage', { email: formData.email });
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    (navigation as any).navigate('SignUp');
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen or show forgot password modal
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented');
  };

  const handleTermsPress = () => {};
  const handlePrivacyPress = () => {};

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(255, 245, 171, 0.1)', 'rgba(255, 225, 0, 0.8)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={[styles.pagePad, responsive.pagePad]}>
            <TouchableOpacity style={[styles.backButton, responsive.backButton]} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={[styles.welcomeSection, responsive.welcomeSection, CONSTRAIN]}>
                <Text style={[styles.welcomeTitle, responsive.welcomeTitle]}>Welcome back to Hungri</Text>
                <Text style={[styles.welcomeSubtitle, responsive.welcomeSubtitle]}>
                  Sign in with your email address
                </Text>
              </View>

              {/* Form Fields */}
              <View style={[styles.formContainer, responsive.formContainer, CONSTRAIN]}>
                <View style={responsive.paperInput}>
                  <TextInput
                    label="Email address"
                    mode="outlined"
                    value={formData.email}
                    onChangeText={t => handleInputChange('email', t)}
                    placeholder=""
                    outlineColor="#FFA05C"
                    activeOutlineColor="#FFA05C"
                    dense
                    style={[styles.paperInput, { backgroundColor: '#FFF5AB' }]}
                    theme={{
                      roundness: 12,
                      colors: {
                        background: '#FFF5AB',
                      },
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                  />
                </View>

                <View style={responsive.paperInput}>
                  <TextInput
                    label="Password"
                    mode="outlined"
                    value={formData.password}
                    onChangeText={t => handleInputChange('password', t)}
                    placeholder=""
                    outlineColor="#FFA05C"
                    activeOutlineColor="#FFA05C"
                    dense
                    style={[styles.paperInput, { backgroundColor: '#FFF5AB' }]}
                    theme={{
                      roundness: 12,
                      colors: {
                        background: '#FFF5AB',
                      },
                    }}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    textContentType="password"
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.continueButton, responsive.continueButton, CONSTRAIN, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.continueButtonText}>Log in</Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Legal */}
            <View style={[styles.legalContainer, responsive.legalContainer, CONSTRAIN]}>
              <Text style={styles.legalText}>
                By continuing, you agree to Hungri's{' '}
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
  // Set an opaque base to avoid any bleed-through if gradient ever uses alpha
  container: { flex: 1, backgroundColor: 'rgba(255, 245, 171, 0.5)' },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1 }, // responsive padding applied at runtime

  mainContainer: { alignItems: 'center', justifyContent: 'flex-start' },

  backButton: { alignSelf: 'flex-start' },

  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle:   { fontSize: 20, color: '#000', fontFamily: 'Manrope-Bold' },
  welcomeSubtitle:{ fontSize: 16, color: '#000', lineHeight: 24, fontFamily: 'Manrope-Regular' },

  formContainer: { width: '100%' },
  paperInput:    { backgroundColor: 'rgba(255, 245, 171, 0.5)' }, // field bg; spacing added responsively

  forgotPasswordContainer: { alignSelf: 'center', marginTop: 16 },
  forgotPasswordText: { 
    fontSize: 14, 
    color: '#000', 
    fontWeight: '500',
    textDecorationLine: 'underline'
  },

  continueButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FFA05C',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  legalContainer: { alignItems: 'center' },
  legalText: { fontSize: 14, color: '#000', textAlign: 'center', lineHeight: 20 },
  legalLink: { color: '#FF9800', fontWeight: '500' },
});