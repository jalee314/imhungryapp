import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let formattedValue = value;
    
    if (field === 'phoneNumber') {
      const digits = value.replace(/\D/g, '');
      
      if (digits.length <= 3) {
        formattedValue = digits;
      } else if (digits.length <= 6) {
        formattedValue = `(${digits.slice(0, 3)})${digits.slice(3)}`;
      } else {
        formattedValue = `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleContinue = () => {
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }
    
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Error', 'Please enter a complete phone number: (xxx)xxx-xxxx');
      return;
    }

    // Navigate to username screen with form data
    // We'll create the account after username selection
    (navigation as any).navigate('Username', {
      userData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password
      }
    });
  };

  const fieldConfig = [
    { label: 'First name', field: 'firstName' as const, keyboardType: 'default' as const, autoComplete: 'given-name' as const, textContentType: 'givenName' as const, autoCapitalize: 'words' as const, placeholder: '' },
    { label: 'Last name', field: 'lastName' as const, keyboardType: 'default' as const, autoComplete: 'family-name' as const, textContentType: 'familyName' as const, autoCapitalize: 'words' as const, placeholder: '' },
    { label: 'Phone number', field: 'phoneNumber' as const, keyboardType: 'phone-pad' as const, autoComplete: 'tel' as const, textContentType: 'telephoneNumber' as const, autoCapitalize: 'none' as const, placeholder: '' },
    { label: 'Email address', field: 'email' as const, keyboardType: 'email-address' as const, autoComplete: 'email' as const, textContentType: 'emailAddress' as const, autoCapitalize: 'none' as const, placeholder: '' },
    { label: 'Password (8+ characters)', field: 'password' as const, keyboardType: 'default' as const, autoComplete: 'new-password' as const, textContentType: 'newPassword' as const, autoCapitalize: 'none' as const, placeholder: '' },
  ];


  
  const handleLogin = () => {
    // TODO: Navigate to login screen
  };
  
  const handleTermsPress = () => {
    // TODO: Navigate to Terms & Conditions
  };
  
  const handlePrivacyPress = () => {
    // TODO: Navigate to Privacy Policy
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['rgba(255, 245, 171, 0.5)', 'rgba(255, 225, 0, 0.5)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* All padding lives here so the gradient can be full-bleed */}
          <View style={styles.pagePad}>
            {/* Login Link */}
            <TouchableOpacity style={styles.loginLink} onPress={handleLogin}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>

            {/* Main Content Container */}
            <View style={styles.mainContainer}>
              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Welcome to Hungri</Text>
                <Text style={styles.welcomeSubtitle}>
                  Create an account to get curated deals from local restaurants, food franchises and more!
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {fieldConfig.map((config, index) => (
                  <TextInput
                    key={config.field}
                    label={config.label}
                    mode="outlined"
                    value={formData[config.field]}
                    onChangeText={text => handleInputChange(config.field, text)}
                    placeholder={config.placeholder}
                    outlineColor="#FFA05C"
                    activeOutlineColor="#FFA05C"
                    dense
                    style={styles.paperInput}
                    theme={{ roundness: 12, colors: { background: '#FFF5AB' } }}
                    keyboardType={config.keyboardType}
                    autoCapitalize={config.autoCapitalize}
                    autoComplete={config.autoComplete}
                    textContentType={config.textContentType}
                    secureTextEntry={config.field === 'password'}
                    returnKeyType={index === fieldConfig.length - 1 ? 'done' : 'next'}
                  />
                ))}
              </View>

              {/* Continue Button */}
              <TouchableOpacity 
                style={[styles.continueButton, loading && { opacity: 0.7 }]} 
                onPress={handleContinue}
                disabled={loading}
              >
                <Text style={styles.continueButtonText}>
                  Continue
                </Text>
              </TouchableOpacity>


            </View>

            {/* Legal Text */}
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                By continuing, you agree to Hungri's{' '}
                <Text style={styles.legalLink} onPress={handleTermsPress}>
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text style={styles.legalLink} onPress={handlePrivacyPress}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  gradient: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  mainContainer: { alignItems: 'center', justifyContent: 'flex-start' },
  loginLink: { alignSelf: 'flex-end', marginBottom: 20 },
  loginText: { fontSize: 16, color: '#000', fontWeight: '500' },
  welcomeSection: { marginBottom: 32, alignSelf: 'stretch' },
  welcomeTitle: { fontSize: 18, color: '#000', marginBottom: 12, fontFamily: 'Manrope-Bold' },
  welcomeSubtitle: { fontSize: 16, color: '#000', lineHeight: 24, fontFamily: 'Manrope-Regular', marginBottom: -7 },
  formContainer: { width: '100%', marginBottom: 4 },
  paperInput: { marginBottom: 10, backgroundColor: '#FFF5AB' },
  continueButton: { width: '100%', height: 44, backgroundColor: '#FFA05C', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 12 },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  legalContainer: { marginTop: 20, alignItems: 'center' },
  legalText: { fontSize: 14, color: '#000', textAlign: 'center', lineHeight: 20 },
  legalLink: { color: '#FF9800', fontWeight: '500' },
});
