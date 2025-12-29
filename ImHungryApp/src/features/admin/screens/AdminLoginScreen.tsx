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
import { tokens, atoms as a } from '#/ui';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '#/services/adminService';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '#/features/auth/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Login</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.lockIcon}>
          <Ionicons name="shield-checkmark" size={60} color="#FFA05C" />
        </View>

        <Text style={styles.subtitle}>Authorized Access Only</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@imhungri.com"
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
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
    ...a.flex_1,
    ...a.bg_gray_100,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.lg,
    ...a.bg_white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    ...a.flex_1,
    paddingHorizontal: tokens.space._2xl,
    paddingTop: tokens.space._4xl,
  },
  lockIcon: {
    ...a.align_center,
    marginBottom: tokens.space._2xl,
  },
  subtitle: {
    fontSize: tokens.fontSize.md,
    ...a.text_center,
    ...a.text_gray_500,
    marginBottom: tokens.space._3xl,
  },
  inputContainer: {
    marginBottom: tokens.space.xl,
  },
  label: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: '#333',
    marginBottom: tokens.space.sm,
  },
  input: {
    ...a.bg_white,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    fontSize: tokens.fontSize.md,
    ...a.text_black,
  },
  loginButton: {
    ...a.bg_primary_500,
    borderRadius: tokens.space.sm,
    paddingVertical: tokens.space.lg,
    ...a.align_center,
    marginTop: tokens.space.xl,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
  },
});

export default AdminLoginScreen;

