import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';

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
      // Use database function that can be called by anonymous users
      const { data, error: queryError } = await supabase.rpc('check_username_exists', { username_input: name });

      if (queryError) { 
        throw queryError;
      }

      if (data) {
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
    <View style = {{flex:1, backgroundColor: 'white'}}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <View style={styles.pagePad}>
            <View style={styles.headerContainer}>
              <View style={styles.backButton} />

              <TouchableOpacity style={styles.skipLink} onPress={() => (navigation as any).navigate('ProfilePhoto', { userData, profilePhoto: existingProfilePhoto })}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
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
                    placeholderTextColor="#636363"

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

  skipLink: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { 
    fontSize: 16, 
    color: '#404040', 
    fontWeight: '400',
    fontFamily: 'Inter-Regular'
  },

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
    fontFamily: 'Manrope-Bold'
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
