import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, Image
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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <View style={styles.pagePad}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.title}>Instant Notifications</Text>
                <Text style={styles.subtitle}>
                    Get instant alerts when your favorite restaurants drop new offers, happy hours, or limited-time specials.
                </Text>
              </View>

              <View style={styles.imageSection}>
                <View style={styles.imagePlaceholder}>
                  <Image source={require('../../../../img/onboarding/notification.png')} style={styles.notificationIcon} />
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton, 
                    loading && { opacity: 0.7 }
                  ]}
                  onPress={handleGetNotified}
                  disabled={loading}
                >
                  <Text style={styles.continueButtonText}>
                    {loading ? 'Setting up...' : 'Get Notified'}
                  </Text>
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
    backgroundColor: 'white' 
  },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingVertical: 20 
  },

  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 40,
    height: 44
  },

  backButton: { paddingVertical: 8, paddingHorizontal: 4 },
  backButtonText: { 
    fontSize: 20, 
    color: '#000', 
    fontWeight: '500' 
  },

  skipLink: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { 
    fontSize: 16, 
    color: '#404040', 
    fontWeight: '400',
    fontFamily: 'Inter-Regular'
  },

  mainContainer: { 
    flex: 1, 
    alignItems: 'flex-start', 
    width: '100%'
  },

  titleSection: { 
    marginBottom: 40,
    maxWidth: 343,
    alignItems: 'flex-start'
  },
  title: { 
    fontSize: 24, 
    color: '#000', 
    fontWeight: 'bold', 
    marginBottom: 25,
    fontFamily: 'Inter-Bold',
    textAlign: 'left'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#404040', 
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },

  imageSection: { 
    alignItems: 'center', 
    marginBottom: 40,
    alignSelf: 'center'
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  notificationIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain'
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
});
