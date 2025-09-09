import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

export default function InstantNotificationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userData = (route.params as any)?.userData;
  const [loading, setLoading] = useState(false);

  const handleGetNotified = async () => {
    setLoading(true);
    try {
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      // Permission request failed, continue anyway
    }
    (navigation as any).navigate('CuisinePreferences', { userData });
    setLoading(false);
  };

  const handleSkip = () => {
    (navigation as any).navigate('CuisinePreferences', { userData });
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(255, 245, 171, 0.1)', 'rgba(255, 225, 0, 0.8)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Instant Notifications</Text>
                <Text style={styles.subtitle}>
                    Get instant alerts when your favorite restaurants drop new offers, happy hours, or limited-time specials.
                </Text>
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.notifyButton, 
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleGetNotified}
                  disabled={loading}
                >
                  <Text style={styles.notifyButtonText}>
                    {loading ? 'Setting up...' : 'Get Notified'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  disabled={loading}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(255, 245, 171, 0.5)' 
  },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingVertical: 20 
  },

  backButton: { 
    alignSelf: 'flex-start', 
    marginBottom: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 4 
  },
  backButtonText: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: '500' 
  },

  mainContainer: { 
    flex: 1, 
    alignItems: 'center', 
    width: '100%' 
  },

  titleSection: { 
    marginBottom: 40,
    maxWidth: 343
  },
  title: { 
    fontSize: 24, 
    color: '#000', 
    fontWeight: 'bold', 
    marginBottom: 25,
    fontFamily: 'Manrope-Bold'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#000', 
    lineHeight: 24,
    fontFamily: 'Manrope-Regular'
  },

  spacer: { flex: 1 },
  footer: { 
    width: '100%', 
    paddingBottom: 16,
    alignItems: 'center'
  },

  notifyButton: { 
    width: '100%', 
    maxWidth: 343,
    height: 44, 
    backgroundColor: '#FFA05C', 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16
  },
  notifyButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },

  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  skipButtonText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: '500' 
  },
});
