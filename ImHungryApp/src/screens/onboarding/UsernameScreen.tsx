import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { TextInput } from 'react-native-paper';

import { isUsernameAvailable } from '../../services/onboardingService';
import { BRAND, STATIC, GRAY, SEMANTIC } from '../../ui/alf';

export default function UsernameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params)?.userData;
  const existingProfilePhoto = (route.params)?.profilePhoto;

  const [username, setUsername] = useState(userData?.username || '');
  const [displayUsername, setDisplayUsername] = useState(userData?.username ? '@' + userData.username : '');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isValidated, setIsValidated] = useState(false); // Track if current username has been validated as available
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  // Track which username is currently being validated to prevent race conditions
  const validatingUsernameRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userData) {
      Alert.alert('Error', 'Please complete the signup process first', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    }
  }, [userData, navigation]);

  // Auto-validate pre-existing username when returning to this screen
  useEffect(() => {
    if (userData?.username && username === userData.username && !isValidated && !isChecking) {
      // We have a pre-filled username from navigation, validate it
      checkUsernameUniqueness(userData.username);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Prevent hardware back button (Android) from going back
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back action
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const checkUsernameUniqueness = async (name: string) => {
    if (!name || name.length < 3) {
      setError(name.length > 0 ? 'Username must be at least 3 characters.' : '');
      setIsChecking(false);
      setIsValidated(false);
      return;
    }
    if (name.length > 20) {
      setError('Username must be less than 20 characters.');
      setIsChecking(false);
      setIsValidated(false);
      return;
    }

    // Track which username we're validating to prevent race conditions
    validatingUsernameRef.current = name;

    setIsChecking(true);
    setError('');
    setIsValidated(false);

    try {
      const available = await isUsernameAvailable(name);

      // Only apply result if this is still the username we're validating
      // (prevents race condition when user types while API call is in flight)
      if (validatingUsernameRef.current !== name) {
        return; // Stale response, ignore it
      }

      if (!available) {
        setError('Username is already taken.');
        setIsValidated(false);
      } else {
        setIsValidated(true); // Username is confirmed available
      }
    } catch (err) {
      // Only apply error if this is still the username we're validating
      if (validatingUsernameRef.current === name) {
        console.error('Error checking username:', err);
        setError('Error checking username. Please try again.');
        setIsValidated(false);
      }
    } finally {
      // Only clear checking state if this is still the username we're validating
      if (validatingUsernameRef.current === name) {
        setIsChecking(false);
      }
    }
  };

  // Debounced check that properly cancels previous timeouts
  const debouncedCheck = useCallback((name: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      checkUsernameUniqueness(name);
    }, 500);
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleUsernameChange = (text: string) => {
    // Ensure @ prefix
    const withAt = text.startsWith('@') ? text : '@' + text.replace(/^@+/, '');
    const body = withAt.slice(1).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const newValue = '@' + body;

    setDisplayUsername(newValue);
    setUsername(body);
    setIsValidated(false);

    if (body) {
      debouncedCheck(body);
    } else {
      setIsChecking(false);
      setError('');
    }
  };

  // Prevent cursor from being before the @ symbol
  const handleSelectionChange = (e) => {
    const { start, end } = e.nativeEvent.selection;
    // Force cursor to always be at position 1 or later (after @)
    if (start < 1 || end < 1) {
      setSelection({ start: 1, end: 1 });
    } else {
      setSelection({ start, end });
    }
  };

  // Button is only enabled when username is validated and available
  const canContinue = isValidated && !isChecking && !error && username.length >= 3 && username.length <= 20;

  const handleContinue = async () => {
    if (!canContinue) return;
    if (!userData) return;

    // Navigate to ProfilePhoto screen with user data including username
    (navigation).navigate('ProfilePhoto', {
      userData: { ...userData, username },
      profilePhoto: existingProfilePhoto,
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <View style={styles.pagePad}>
            <View style={styles.headerContainer}>
              <View style={styles.backButton} />
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.usernameTitle}>Choose your username</Text>
              </View>
              <View style={styles.formBlock}>
                <TextInput
                  mode="flat"
                  value={displayUsername}
                  onChangeText={handleUsernameChange}
                  placeholder={isFocused ? '' : '@ImHungri'}
                  placeholderTextColor={GRAY[600]}
                  selection={isFocused ? selection : undefined}
                  onSelectionChange={isFocused ? handleSelectionChange : undefined}

                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  style={styles.usernameInput}

                  contentStyle={{ color: GRAY[800] }}
                  theme={{
                    colors: {
                      onSurface: GRAY[800],
                      onSurfaceVariant: GRAY[600],
                      background: STATIC.white,
                      surface: STATIC.white,
                    },
                  }}

                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={21}
                  onFocus={() => {
                    setIsFocused(true);
                    setDisplayUsername(username ? '@' + username : '@');
                    setSelection({ start: 1, end: 1 });
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    setSelection(undefined);
                    if (!username) setDisplayUsername('');
                  }}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

              </View>
              <View style={styles.spacer} />
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
                  onPress={handleContinue}
                  disabled={!canContinue}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: STATIC.white },
  flex1: { flex: 1 },
  pagePad: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    height: 44
  },

  mainContainer: { flex: 1, alignItems: 'flex-start', width: '100%' },

  backButton: { paddingVertical: 8, paddingHorizontal: 4, width: 44 },

  titleSection: {
    marginBottom: 40,
    maxWidth: 343,
    alignItems: 'center',
    alignSelf: 'center'
  },
  usernameTitle: {
    fontSize: 24,
    color: STATIC.black,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Inter-Bold'
  },
  usernameInput: {
    backgroundColor: 'transparent',
    fontSize: 32,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: '100%',
    marginTop: 40,
  },
  formBlock: {
    width: '100%',
    maxWidth: 338,
    alignSelf: 'center',
    alignItems: 'center',
  },

  spacer: { flex: 1 },
  footer: {
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center'
  },

  continueButton: {
    width: '100%',
    maxWidth: 343,
    height: 44,
    backgroundColor: BRAND.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  continueButtonDisabled: {
    backgroundColor: GRAY[350],
  },
  continueButtonText: {
    color: STATIC.white,
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: SEMANTIC.error,
    textAlign: 'center',
    marginTop: 6,
  },
});
