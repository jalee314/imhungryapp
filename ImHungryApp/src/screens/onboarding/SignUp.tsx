import React, { useState, useCallback } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';
import { checkPhoneExists } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

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
  const { validateEmail } = useAuth();

  const H = Math.max(16, Math.min(28, Math.round(width * 0.06)));
  const V = Math.max(12, Math.min(24, Math.round(height * 0.02)));
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));
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
  const [showPassword, setShowPassword] = useState(false);

  const checkUniqueness = async (field: 'email' | 'phoneNumber', value: string) => {
    if (!value) return;

    setIsChecking(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    let queryValue = value;
    if (field === 'phoneNumber') {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 10) {
        queryValue = `+1${digits.slice(0, 10)}`;
      } else {
        setIsChecking(prev => ({ ...prev, [field]: false }));
        return;
      }
    }

    try {
      let exists = false;

      if (field === 'email') {
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

  const handleTermsPress = () => { };
  const handlePrivacyPress = () => { };

  return (
    <Box flex={1} bg="background">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            style={[{ flex: 1 }, responsive.pagePad]}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable 
              onPress={handleLogin}
              style={[{ alignSelf: 'flex-end' }, responsive.loginLink]}
            >
              <Text 
                size="base" 
                weight="bold" 
                color="textLight"
                style={{ fontFamily: typography.fontFamily.bold }}
              >
                Log in
              </Text>
            </Pressable>

            <Box alignCenter justifyStart>
              <Box style={[responsive.welcomeSection, CONSTRAIN]}>
                <Text 
                  size="lg" 
                  weight="bold" 
                  color="text"
                  style={[{ fontFamily: typography.fontFamily.bold, textAlign: 'left' }, responsive.welcomeTitle]}
                >
                  Welcome to ImHungri
                </Text>
                <Text 
                  size="base" 
                  color="text" 
                  lineHeight={24}
                  style={[{ fontFamily: typography.fontFamily.regular, textAlign: 'left' }, responsive.welcomeSubtitle]}
                >
                  Create an account to get curated deals from local restaurants, food franchises and more!
                </Text>
              </Box>

              {/* Form Fields */}
              <Box style={[responsive.formContainer, CONSTRAIN]}>
                {fieldConfig.map((cfg, i) => (
                  <Box key={cfg.field} style={responsive.paperInput}>
                    <TextInput
                      label={cfg.label}
                      mode="outlined"
                      value={(formData as any)[cfg.field]}
                      onChangeText={t => handleInputChange(cfg.field, t)}
                      placeholder={cfg.placeholder}
                      outlineColor="#FFA05C"
                      activeOutlineColor="#FFA05C"
                      style={{
                        backgroundColor: 'white',
                        minHeight: 56,
                        fontSize: 16,
                        lineHeight: 22,
                        paddingVertical: 0,
                      }}
                      theme={{
                        roundness: 8,
                        colors: {
                          background: 'white',
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
                    {errors[cfg.field as keyof typeof errors] ? (
                      <Text 
                        color="error" 
                        style={{ alignSelf: 'flex-start', marginLeft: 12, marginTop: 4, marginBottom: -12 }}
                      >
                        {errors[cfg.field as keyof typeof errors]}
                      </Text>
                    ) : null}
                  </Box>
                ))}
              </Box>

              {/* Continue */}
              <Pressable
                onPress={handleContinue}
                disabled={loading}
                style={[
                  {
                    width: '100%',
                    height: 50,
                    backgroundColor: colors.primaryDark,
                    borderRadius: 25,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  responsive.continueButton,
                  CONSTRAIN,
                  loading && { opacity: 0.7 }
                ]}
              >
                <Text 
                  color="textInverse" 
                  size="base"
                  style={{ fontFamily: typography.fontFamily.regular, lineHeight: 24 }}
                >
                  Continue
                </Text>
              </Pressable>
            </Box>

            {/* Legal */}
            <Box style={[responsive.legalContainer, CONSTRAIN]} alignCenter>
              <Text 
                size="xs" 
                color="text" 
                lineHeight={16}
                style={{ fontFamily: typography.fontFamily.medium, textAlign: 'left' }}
              >
                By continuing, you agree to ImHungri's{' '}
                <Text 
                  color="primaryDark" 
                  weight="semiBold"
                  onPress={handleTermsPress}
                  style={{ fontFamily: typography.fontFamily.semiBold }}
                >
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text 
                  color="primaryDark" 
                  weight="semiBold"
                  onPress={handlePrivacyPress}
                  style={{ fontFamily: typography.fontFamily.semiBold }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </Box>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  );
}
