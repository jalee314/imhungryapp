import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { isUsernameAvailable } from '#/services/onboardingService';
import { atoms as a, tokens } from '#/ui';

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
      return;
    }
    if (name.length > 20) {
      setError('Username must be less than 20 characters.');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const available = await isUsernameAvailable(name);
      if (!available) {
        setError('Username is already taken.');
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setError('Error checking username. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const debouncedCheck = useCallback(debounce(checkUsernameUniqueness, 500), []);

  const handleUsernameChange = (text: string) => {
    const withAt = text.startsWith('@') ? text : '@' + text.replace(/^@+/, '');
    const body = withAt.slice(1).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(body);
    setDisplayUsername('@' + body);
    debouncedCheck(body);
  };

  const handleContinue = async () => {
    if (isChecking) return;
    if (error) return Alert.alert('Error', error);
    if (!username.trim()) return Alert.alert('Error', 'Please enter a username');
    if (username.length < 3) return Alert.alert('Error', 'Username must be at least 3 characters long');
    if (username.length > 20) return Alert.alert('Error', 'Username must be less than 20 characters');
    if (!userData) return;

    // Navigate to ProfilePhoto screen with user data including username
    (navigation as any).navigate('ProfilePhoto', {
      userData: { ...userData, username },
      profilePhoto: existingProfilePhoto,
    });
  };

  return (
    <View style={[a.flex_1, { backgroundColor: tokens.color.white }]}>
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
                    placeholder="@ImHungri"
                    placeholderTextColor={tokens.color.gray_600}

                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    style={styles.usernameInput}

                    contentStyle={{ color: tokens.color.gray_800 }} 
                    theme={{
                        colors: {
                        onSurface: tokens.color.gray_800,          
                        onSurfaceVariant: tokens.color.gray_600,
                        background: tokens.color.white,
                        surface: tokens.color.white,
                        },
                    }}

                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={21}
                    onFocus={() => { setIsFocused(true); if (!displayUsername) setDisplayUsername('@'); }}
                    onBlur={() => { setIsFocused(false); if (!username) setDisplayUsername(''); }}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                </View>
              <View style={styles.spacer} />
              <View style={styles.footer}>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
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
  container: { flex: 1, backgroundColor: tokens.color.white },
  flex1: { flex: 1 },
  pagePad: { flex: 1, paddingHorizontal: tokens.space._2xl, paddingVertical: tokens.space.xl },
  
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: tokens.space._4xl,
    height: 44
  },
  
  mainContainer: { flex: 1, alignItems: 'flex-start', width: '100%' },

  backButton: { paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.xs, width: 44 },

  titleSection: { 
    marginBottom: tokens.space._4xl,
    maxWidth: 343,
    alignItems: 'center',
    alignSelf: 'center'
  },
  usernameTitle: { 
    fontSize: tokens.fontSize._2xl, 
    color: tokens.color.black, 
    fontWeight: tokens.fontWeight.bold, 
    textAlign: 'center',
    fontFamily: 'Inter-Bold'
  },

  inputContainer: { width: '100%', alignItems: 'center', marginBottom: 30 },
  usernameInput: {
    backgroundColor: 'transparent',
    fontSize: tokens.fontSize._4xl,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: '100%',
    marginTop: tokens.space._4xl,
    
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
    backgroundColor: tokens.color.primary_600, 
    borderRadius: tokens.radius.xl, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  continueButtonText: { 
    color: tokens.color.white, 
    fontSize: tokens.fontSize.md, 
    fontWeight: tokens.fontWeight.semibold 
  },
  errorText: {
    color: tokens.color.error_500,
    textAlign: 'center',
    marginTop: 6,
  },
});
