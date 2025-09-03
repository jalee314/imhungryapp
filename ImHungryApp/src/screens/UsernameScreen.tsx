import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function UsernameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;

  const [username, setUsername] = useState(''); 
  const [displayUsername, setDisplayUsername] = useState('');  
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!userData) {
      Alert.alert('Error', 'Please complete the signup process first', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    }
  }, [userData, navigation]);

  const handleUsernameChange = (text: string) => {
    const withAt = text.startsWith('@') ? text : '@' + text.replace(/^@+/, '');
    const body = withAt.slice(1).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    setUsername(body);
    setDisplayUsername('@' + body);
  };

  const handleContinue = async () => {
    if (!username.trim()) return Alert.alert('Error', 'Please enter a username');
    if (username.length < 3) return Alert.alert('Error', 'Username must be at least 3 characters long');
    if (username.length > 20) return Alert.alert('Error', 'Username must be less than 20 characters');
    if (!userData) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: userData.phoneNumber,
            username, 
            full_name: `${userData.firstName} ${userData.lastName}`,
          },
        },
      });
      if (error) throw error;
      if (data.user) {
        Alert.alert('Success', `Welcome to Hungri, ${username}!`, [
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['rgba(255, 245, 171, 0.5)', 'rgba(255, 225, 0, 0.5)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      >
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

                </View>
              <View style={styles.spacer} />
              <View style={styles.footer}>
                <TouchableOpacity style={[styles.continueButton, loading && { opacity: 0.7 }]} onPress={handleContinue} disabled={loading}>
                  <Text style={styles.continueButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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

  continueButton: { width: '100%', height: 44, backgroundColor: '#FFA05C', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
