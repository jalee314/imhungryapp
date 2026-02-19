import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';

import { BRAND, STATIC, GRAY } from '../../ui/alf';

const AdminLoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { enterAdminMode, exitAdminMode } = useAdmin();
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    // Enter admin mode BEFORE signing in to prevent flashing to AppStack
    enterAdminMode();

    try {
      // Sign in via centralized auth action
      await signIn(email, password);

      // Check if user is admin
      const isAdmin = await adminService.isAdmin();

      if (!isAdmin) {
        // Not an admin - sign out and exit admin mode
        await signOut();
        exitAdminMode();
        Alert.alert('Access Denied', 'You do not have admin privileges.');
        setLoading(false);
        return;
      }

      // Successfully logged in as admin
      setLoading(false);
    } catch (error: any) {
      // Login failed - exit admin mode
      exitAdminMode();
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to login screen
    (navigation as any).navigate('LogIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Admin Login" onBack={handleCancel} />

      <View style={styles.content}>
        <View style={styles.lockIcon}>
          <Ionicons name="shield-checkmark" size={60} color={BRAND.accent} />
        </View>

        <Text style={styles.subtitle}>Authorized Access Only</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@imhungri.com"
            placeholderTextColor={GRAY[475]}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={GRAY[475]}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={STATIC.white} />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY[100],
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  lockIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: GRAY[600],
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY[800],
    marginBottom: 8,
  },
  input: {
    backgroundColor: STATIC.white,
    borderWidth: 1,
    borderColor: GRAY[250],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: STATIC.black,
  },
  loginButton: {
    backgroundColor: BRAND.accent,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: STATIC.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AdminLoginScreen;

