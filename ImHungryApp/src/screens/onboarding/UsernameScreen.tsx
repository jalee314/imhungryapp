import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { isUsernameAvailable } from '../../services/onboardingService';

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function UsernameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;
  const existingProfilePhoto = (route.params as any)?.profilePhoto;

  const [username, setUsername] = useState(userData?.username || ''); 
  const [displayUsername, setDisplayUsername] = useState(userData?.username ? '@' + userData.username : '');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isValidated, setIsValidated] = useState(false); // Track if current username has been validated as available
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  useEffect(() => {
    if (!userData) {
      Alert.alert('Error', 'Please complete the signup process first', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    }
  }, [userData, navigation]);

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

    setIsChecking(true);
    setError('');
    setIsValidated(false);

    try {
      const available = await isUsernameAvailable(name);
      if (!available) {
        setError('Username is already taken.');
        setIsValidated(false);
      } else {
        setIsValidated(true); // Username is confirmed available
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setError('Error checking username. Please try again.');
      setIsValidated(false);
    } finally {
      setIsChecking(false);
    }
  };

  const debouncedCheck = useCallback(debounce(checkUsernameUniqueness, 500), []);

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
  const handleSelectionChange = (e: any) => {
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
    (navigation as any).navigate('ProfilePhoto', {
      userData: { ...userData, username },
      profilePhoto: existingProfilePhoto,
    });
  };

  return (
    <View style = {{flex:1, backgroundColor: 'white'}}>
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
                      placeholderTextColor="#636363"
                      selection={isFocused ? selection : undefined}
                      onSelectionChange={isFocused ? handleSelectionChange : undefined}

                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      style={styles.usernameInput}

                      contentStyle={{ color: '#333' }} 
                      theme={{
                          colors: {
                          onSurface: '#333',          
                          onSurfaceVariant: '#636363',
                          background: 'white',
                          surface: 'white',
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
  container: { flex: 1 ,backgroundColor: 'white'},
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
    color: '#000', 
    fontWeight: 'bold', 
    textAlign: 'center',
    fontFamily: 'Inter-Bold'
  },

  inputContainer: { width: '100%', alignItems: 'center', marginBottom: 30 },
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
    backgroundColor: '#FF8C4C', 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 6,
  },
});
