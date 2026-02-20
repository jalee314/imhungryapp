import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, ScrollView } from 'react-native';
import type { ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';

import { useAuth } from '../../hooks/useAuth';
import { checkPhoneExists } from '../../services/userService';
import { BRAND, STATIC, GRAY, SEMANTIC } from '../../ui/alf';

const debounce = (func: (...args: unknown[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};


export default function SignUpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existingUserData = (route.params)?.userData;
  const { width, height } = useWindowDimensions();
  const { validateEmail } = useAuth();

  const H = Math.max(16, Math.min(28, Math.round(width * 0.06)));   // horizontal page padding
  const V = Math.max(12, Math.min(24, Math.round(height * 0.02)));   // vertical rhythm
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));  // between inputs
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const responsive = {
    pagePad: { paddingHorizontal: H, paddingVertical: V },
    loginLink: { marginBottom: Math.round(V * 0.2), marginTop: V },
    welcomeSection: { marginBottom: Math.round(V * 1.5) },
    welcomeTitle: { marginBottom: Math.round(V * 1) },
    welcomeSubtitle: { marginBottom: -Math.round(V * 0.9) },
    formContainer: { marginBottom: Math.round(V * 0.125) },
    paperInput: { marginBottom: Math.round(GAP * 0.7) },
    continueButton: { marginTop: Math.round(V * 0.6), marginBottom: V },
    legalContainer: { marginTop: V * 2 },
  };
  // ----------------------------

  const [formData, setFormData] = useState({
    firstName: existingUserData?.firstName || '',
    lastName: existingUserData?.lastName || '',
    phoneNumber: existingUserData?.phoneNumber || '',
    email: existingUserData?.email || '',
    password: existingUserData?.password || '',
  });
  const [loading] = useState(false);
  const [errors, setErrors] = useState({ email: '', phoneNumber: '' });
  const [, setIsChecking] = useState({ email: false, phoneNumber: false });
  const [showPassword, setShowPassword] = useState(false);

  const checkUniqueness = async (field: 'email' | 'phoneNumber', value: string) => {
    if (!value) return;

    setIsChecking(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    // format value for DB query
    let queryValue = value;
    if (field === 'phoneNumber') {
      const digits = value.replace(/\D/g, '');
      // format to +1xxxxxxxxxx for DB query
      if (digits.length >= 10) {
        queryValue = `+1${digits.slice(0, 10)}`;
      } else {
        // don't run a query for an incomplete number
        setIsChecking(prev => ({ ...prev, [field]: false }));
        return;
      }
    }

    try {
      // Use database functions that can be called by anonymous users
      let exists = false;

      if (field === 'email') {
        // Use the auth hook's email validation to keep logic centralized
        exists = await validateEmail(queryValue);
      } else if (field === 'phoneNumber') {
        exists = await checkPhoneExists(queryValue);
      }

      if (exists) {
        setErrors(prev => ({ ...prev, [field]: `${field === 'email' ? 'Email' : 'Phone number'} is already taken.` }));
      }
    } catch (err) {
      console.error(`Error checking ${field}:`, err);
    } finally {
      setIsChecking(prev => ({ ...prev, [field]: false }));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheck = useCallback(debounce(checkUniqueness, 500), []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let formattedValue = value;
    if (field === 'phoneNumber') {
      const d = value.replace(/\D/g, '');
      if (d.length <= 3) formattedValue = d;
      else if (d.length <= 6) formattedValue = `(${d.slice(0, 3)})${d.slice(3)}`;
      else formattedValue = `(${d.slice(0, 3)})${d.slice(3, 6)}-${d.slice(6, 10)}`;
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));

    if (field === 'email' || field === 'phoneNumber') {
      debouncedCheck(field, formattedValue);
    }
  };

  const handleContinue = () => {
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields'); return;
    }

    const emailRegex = /^[^@\s]+@(gmail\.com|yahoo\.com|outlook\.com)$/i;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please use a Gmail, Yahoo, or Outlook email address.');
      return;
    }

    if (errors.email || errors.phoneNumber) {
      Alert.alert('Error', 'Please fix the errors before continuing.'); return;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long'); return;
    }
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Error', 'Please enter a complete phone number: (xxx)xxx-xxxx'); return;
    }
    (navigation).navigate('Username', {
      userData: { ...formData },
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
    (navigation).navigate('LogIn');
  };

  const handleTermsPress = () => { };
  const handlePrivacyPress = () => { };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView
            style={[styles.pagePad, responsive.pagePad]}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={[styles.loginLink, responsive.loginLink]} onPress={handleLogin}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={[styles.welcomeSection, responsive.welcomeSection, CONSTRAIN]}>
                <Text style={[styles.welcomeTitle, responsive.welcomeTitle]}>Welcome to ImHungri</Text>
                <Text style={[styles.welcomeSubtitle, responsive.welcomeSubtitle]}>
                  Create an account to get curated deals from local restaurants, food franchises and more!
                </Text>
              </View>

              {/* Form Fields */}
              <View style={[styles.formContainer, responsive.formContainer, CONSTRAIN]}>
                {fieldConfig.map((cfg, i) => (
                  <View key={cfg.field} style={responsive.paperInput}>
                    <TextInput
                      label={cfg.label}
                      mode="outlined"
                      value={(formData)[cfg.field]}
                      onChangeText={t => handleInputChange(cfg.field, t)}
                      placeholder={cfg.placeholder}
                      outlineColor={BRAND.accent}
                      activeOutlineColor={BRAND.accent}
                      style={[styles.textInputStyle, { backgroundColor: STATIC.white }]}
                      theme={{
                        roundness: 8,
                        colors: {
                          background: 'white',   // Paper uses this to paint the notch
                          outline: '#FFA05C',
                        },
                      }}
                      keyboardType={cfg.keyboardType}
                      autoCapitalize={cfg.autoCapitalize}
                      autoComplete={cfg.autoComplete}
                      textContentType={cfg.textContentType}
                      secureTextEntry={cfg.field === 'password' ? !showPassword : false}
                      returnKeyType={i === fieldConfig.length - 1 ? 'done' : 'next'}

                      right={cfg.field === 'password' ? (
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                          forceTextInputFocus={false}
                        />
                      ) : undefined}
                    />
                    {errors[cfg.field as keyof typeof errors] ? <Text style={styles.errorText}>{errors[cfg.field as keyof typeof errors]}</Text> : null}
                  </View>
                ))}
              </View>

              {/* Continue */}
              <TouchableOpacity
                style={[styles.continueButton, responsive.continueButton, CONSTRAIN, loading && styles.loadingDimOpacity]}
                onPress={handleContinue}
                disabled={loading}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Set an opaque base to avoid any bleed-through if gradient ever uses alpha
  container: { flex: 1, backgroundColor: STATIC.white },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { flex: 1 }, // responsive padding applied at runtime
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  mainContainer: { alignItems: 'center', justifyContent: 'flex-start' },

  loginLink: { alignSelf: 'flex-end' },
  loginText: {
    fontSize: 16,
    color: STATIC.black,
    fontWeight: '700',
    fontFamily: 'Inter-Bold'
  },

  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle: {
    fontSize: 18,
    color: GRAY[950],
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    textAlign: 'left'
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: GRAY[950],
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },
  loadingDimOpacity: { opacity: 0.7 },

  formContainer: { width: '100%' },
  textInputStyle: {
    backgroundColor: STATIC.white,
    minHeight: 56,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
  },

  continueButton: {
    width: '100%',
    height: 50,
    backgroundColor: BRAND.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: STATIC.white,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    lineHeight: 24
  },

  legalContainer: { alignItems: 'center' },
  legalText: {
    fontSize: 12,
    color: GRAY[950],
    textAlign: 'left',
    lineHeight: 16,
    fontFamily: 'Inter-Medium',
    fontWeight: '500'
  },
  legalLink: {
    color: BRAND.accent,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
  errorText: {
    color: SEMANTIC.error,
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginTop: 4,
    marginBottom: -12,
  }
});
