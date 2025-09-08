import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
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

export default function UsernameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;

  const [username, setUsername] = useState(''); 
  const [displayUsername, setDisplayUsername] = useState('');  
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
      const { data, error: queryError } = await supabase
        .from('user')
        .select('display_name')
        .eq('display_name', name)
        .single();

      if (queryError && queryError.code !== 'PGRST116') { 
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
    (navigation as any).navigate('Profile Photo', {
      userData: { ...userData, username },
    });
  };

  return (
    <View style = {{flex:1}}>
      <LinearGradient
        colors={['rgba(255, 245, 171, 0.1)', 'rgba(255, 225, 0, 0.8)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <View style={styles.pagePad}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.mainContainer}>
                <View style={styles.formBlock}>
                <Text style={styles.usernameTitle}>Choose your username</Text>
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
                        background: 'transparent',
                        surface: 'transparent',
                        },
                    }}

                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={21}
                    onFocus={() => { setIsFocused(true); if (!displayUsername) setDisplayUsername('@'); }}
                    onBlur={() => { setIsFocused(false); if (!username) setDisplayUsername(''); }}
                    />
                    {isChecking && <ActivityIndicator size="small" color="#FFA05C" style={styles.feedbackArea} />}
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
</LinearGradient>
</View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 ,backgroundColor: 'rgba(255, 245, 171, 0.5)'},
  gradient: { flex: 1 },
  flex1: { flex: 1 },
  pagePad: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  mainContainer: { flex: 1, alignItems: 'center', width: '100%' },

  backButton: { alignSelf: 'flex-start', marginBottom: 20, paddingVertical: 8, paddingHorizontal: 4 },
  backButtonText: { fontSize: 16, color: '#000', fontWeight: '500' },

  usernameSection: { marginBottom: 40, alignSelf: 'stretch', alignItems: 'center' },
  usernameTitle: { fontSize: 24, color: '#000', fontWeight: 'bold', textAlign: 'center' },

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
  footer: { width: '100%', paddingBottom: 16 },

  continueButton: { width: '100%', height: 44, backgroundColor: '#FFA05C', borderRadius: 22, alignItems: 'center', justifyContent: 'center',marginBottom: 50 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 12,
  },
  feedbackArea: {
    marginTop: 12,
  }
});
