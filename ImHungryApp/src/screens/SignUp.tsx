import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};


export default function SignUpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const existingUserData = (route.params as any)?.userData;
  const { width, height } = useWindowDimensions();

  const H   = Math.max(16, Math.min(28, Math.round(width  * 0.06)));   // horizontal page padding
  const V   = Math.max(12, Math.min(24, Math.round(height * 0.02)));   // vertical rhythm
  const GAP = Math.max( 8, Math.min(16, Math.round(height * 0.012)));  // between inputs
  const MAX_W = Math.min(560, Math.round(width * 0.92));
  const CONSTRAIN: ViewStyle = { width: '100%', maxWidth: MAX_W, alignSelf: 'center' };

  const responsive = {
    pagePad:        { paddingHorizontal: H, paddingVertical: V },
    loginLink:      { marginBottom: Math.round(V * 1.5), marginTop: V  },
    welcomeSection: { marginBottom: Math.round(V * 1.5) },
    welcomeTitle:   { marginBottom: Math.round(V * 1) },
    welcomeSubtitle:{ marginBottom: -Math.round(V * 0.35) },
    formContainer:  { marginBottom: Math.round(V * 0.125) },
    paperInput:     { marginBottom: Math.round(GAP * 1.5)},
    continueButton: { marginTop: V, marginBottom: V },
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', phoneNumber: '' });
  const [isChecking, setIsChecking] = useState({ email: false, phoneNumber: false });

  const checkUniqueness = async (field: 'email' | 'phoneNumber', value: string) => {
    if (!value) return;

    setIsChecking(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    const dbField = field === 'phoneNumber' ? 'phone_number' : field;

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
      const { data, error } = await supabase
        .from('user') 
        .select(dbField)
        .eq(dbField, queryValue)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setErrors(prev => ({ ...prev, [field]: `${field === 'email' ? 'Email' : 'Phone number'} is already taken.` }));
      }
    } catch (err) {
      console.error(`Error checking ${field}:`, err);
    } finally {
      setIsChecking(prev => ({ ...prev, [field]: false }));
    }
  };

  const debouncedCheck = useCallback(debounce(checkUniqueness, 500), []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let formattedValue = value;
    if (field === 'phoneNumber') {
      const d = value.replace(/\D/g, '');
      if (d.length <= 3) formattedValue = d;
      else if (d.length <= 6) formattedValue = `(${d.slice(0,3)})${d.slice(3)}`;
      else formattedValue = `(${d.slice(0,3)})${d.slice(3,6)}-${d.slice(6,10)}`;
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
    (navigation as any).navigate('Username', {
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
    (navigation as any).navigate('LogIn');
  };
  
  const handleTermsPress = () => {};
  const handlePrivacyPress = () => {};

  return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors= {['rgba(255, 245, 171, 0.1)', 'rgba(255, 225, 0, 0.8)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={[styles.pagePad, responsive.pagePad]}>
            <TouchableOpacity style={[styles.loginLink, responsive.loginLink]} onPress={handleLogin}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={[styles.welcomeSection, responsive.welcomeSection, CONSTRAIN]}>
                <Text style={[styles.welcomeTitle, responsive.welcomeTitle]}>Welcome to Hungri</Text>
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
                      value={(formData as any)[cfg.field]}
                      onChangeText={t => handleInputChange(cfg.field, t)}
                      placeholder={cfg.placeholder}
                      outlineColor="#FFA05C"
                      activeOutlineColor="#FFA05C"
                      dense
                      style={[styles.paperInput, { backgroundColor: '#FFF5AB' }]}
                      theme={{
                        roundness: 12,
                        colors: {
                          background: '#FFF5AB',   // Paper uses this to paint the notch
                        },
                      }}
                      keyboardType={cfg.keyboardType}
                      autoCapitalize={cfg.autoCapitalize}
                      autoComplete={cfg.autoComplete}
                      textContentType={cfg.textContentType}
                      secureTextEntry={cfg.field === 'password'}
                      returnKeyType={i === fieldConfig.length - 1 ? 'done' : 'next'}
                    />
                    {isChecking[cfg.field as keyof typeof isChecking] && <ActivityIndicator size="small" color="#FFA05C" style={styles.errorText} />}
                    {errors[cfg.field as keyof typeof errors] ? <Text style={styles.errorText}>{errors[cfg.field as keyof typeof errors]}</Text> : null}
                  </View>
                ))}
              </View>

              {/* Continue */}
              <TouchableOpacity
                style={[styles.continueButton, responsive.continueButton, CONSTRAIN, loading && { opacity: 0.7 }]}
                onPress={handleContinue}
                disabled={loading}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
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

  loginLink: { alignSelf: 'flex-end' },
  loginText: { fontSize: 16, color: '#000', fontWeight: '500' },

  welcomeSection: { alignSelf: 'stretch' },
  welcomeTitle:   { fontSize: 20, color: '#000', fontFamily: 'Manrope-Bold' },
  welcomeSubtitle:{ fontSize: 16, color: '#000', lineHeight: 24, fontFamily: 'Manrope-Regular' },

  formContainer: { width: '100%' },
  paperInput:    { backgroundColor: 'rgba(255, 245, 171, 0.5)' }, // field bg; spacing added responsively

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
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginTop: 4,    
    marginBottom: -12,
  }
});
