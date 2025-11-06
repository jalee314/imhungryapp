import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export default function LogInScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const { isLoading: authLoading } = useAuth();

  const H   = Math.max(16, Math.min(28, Math.round(width  * 0.06)));   // horizontal page padding
  const V   = Math.max(12, Math.min(24, Math.round(height * 0.02)));   // vertical rhythm
  const GAP = Math.max( 8, Math.min(16, Math.round(height * 0.012)));  // between inputs
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const responsive = {
    pagePad:        { paddingHorizontal: H, paddingVertical: V },
    backButton:     { marginBottom: Math.round(V * 0.2), marginTop: V  },
    welcomeSection: { marginBottom: Math.round(V * 1.5) },
    welcomeTitle:   { marginBottom: Math.round(V * 1.0) },
    welcomeSubtitle:{ marginBottom: -Math.round(V * 0.9) },
    formContainer:  { marginBottom: Math.round(V * 0.125) },
    paperInput:     { marginBottom: Math.round(GAP * 0.7) },
    continueButton: { marginTop: V, marginBottom: V },
    legalContainer: { marginTop: V * 2 },
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { signIn } = useAuth();

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
      await signIn(formData.email, formData.password);
      // Auth listeners will update navigation flow automatically
      console.log('Login successful, auth store will handle navigation');
    } catch (err: any) {
      Alert.alert('Error', 'An unexpected error occurred');
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

  const handleTermsPress = () => {};
  const handlePrivacyPress = () => {};

  const handleImTap = () => {
    // Increment tap count
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    // Clear existing timer
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // Check if 7 taps achieved
    if (newTapCount >= 7) {
      // Navigate to admin login
      (navigation as any).navigate('AdminLogin');
      // Reset counter
      setTapCount(0);
      return;
    }

    // Set new timer to reset counter after 5 seconds
    tapTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 5000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView
            style={[styles.pagePad, responsive.pagePad]}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={[styles.backButton, responsive.backButton]} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
  
            <View style={styles.mainContainer}>
              <View style={[styles.welcomeSection, responsive.welcomeSection, CONSTRAIN]}>
                <Text style={[styles.welcomeTitle, responsive.welcomeTitle]}>
                  Welcome back to <TouchableWithoutFeedback onPress={handleImTap}><Text suppressHighlighting={true}>Im</Text></TouchableWithoutFeedback>Hungri
                </Text>
                <Text style={[styles.welcomeSubtitle, responsive.welcomeSubtitle]}>
                  Sign in with your email address.
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
                    outlineColor="#FF8C4C"
                    activeOutlineColor="#FF8C4C"
                    style={[styles.textInputStyle, { backgroundColor: 'white' }]}
                    theme={{
                      roundness: 8,
                      colors: {
                        background: 'white',
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
                    outlineColor="#FF8C4C"
                    activeOutlineColor="#FF8C4C"
                    style={[styles.textInputStyle, { backgroundColor: 'white' }]}
                    theme={{
                      roundness: 8,
                      colors: {
                        background: 'white',
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
                disabled={loading || authLoading}
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
              <Text style={styles.legalText} numberOfLines={2}>
                By continuing, you agree to ImHungri's{' '}
                <Text style={styles.legalLink} onPress={handleTermsPress}>Terms & Conditions</Text>{' '}
                and{' '}
                <Text style={styles.legalLink} onPress={handlePrivacyPress}>Privacy Policy</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Set an opaque base to avoid any bleed-through if gradient ever uses alpha
  container: { flex: 1, backgroundColor: 'white' },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1 }, // responsive padding applied at runtime
  scrollContentContainer: {
    flexGrow: 1,
  },
  mainContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
  }, 

  backButton: { 
    alignSelf: 'flex-start' 
  },

  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle: {
    fontSize: 18,
    color: '#181619',
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    textAlign: 'left'
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#181619',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },

  formContainer: { width: '100%' },
  paperInput: {
    // Only spacing, no height
  },

  continueButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FF8C4C',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    lineHeight: 24
  },

  forgotPasswordContainer: { alignSelf: 'center', marginTop: 16 },
  forgotPasswordText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    textDecorationLine: 'underline'
  },

  legalContainer: { alignItems: 'center' },
  legalText: {
    fontSize: 12,
    color: '#181619',
    textAlign: 'left',
    lineHeight: 16,
    fontFamily: 'Manrope-Medium',
    fontWeight: '500'
  },
  legalLink: { color: '#FFA05C', fontWeight: '600', fontFamily: 'Manrope-SemiBold' },
  textInputStyle: {
    backgroundColor: 'white',
    minHeight: 56,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },
}); 