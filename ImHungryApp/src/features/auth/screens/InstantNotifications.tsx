import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { atoms as a, tokens } from '#/ui';

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
    <View style={[a.flex_1, { backgroundColor: tokens.color.white }]}>
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
    backgroundColor: tokens.color.white 
  },

  keyboardAvoidingView: { flex: 1 },
  pagePad: { 
    flex: 1, 
    paddingHorizontal: tokens.space._2xl, 
    paddingVertical: tokens.space.xl 
  },

  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: tokens.space._4xl,
    height: 44
  },

  backButton: { paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.xs },
  backButtonText: { 
    fontSize: tokens.fontSize.xl, 
    color: tokens.color.black, 
    fontWeight: tokens.fontWeight.medium 
  },

  skipLink: { paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.xs },
  skipText: { 
    fontSize: tokens.fontSize.md, 
    color: tokens.color.gray_700, 
    fontWeight: tokens.fontWeight.normal,
    fontFamily: 'Inter-Regular'
  },

  mainContainer: { 
    flex: 1, 
    alignItems: 'flex-start', 
    width: '100%'
  },

  titleSection: { 
    marginBottom: tokens.space._4xl,
    maxWidth: 343,
    alignItems: 'flex-start'
  },
  title: { 
    fontSize: tokens.fontSize._2xl, 
    color: tokens.color.black, 
    fontWeight: tokens.fontWeight.bold, 
    marginBottom: 25,
    fontFamily: 'Inter-Bold',
    textAlign: 'left'
  },
  subtitle: { 
    fontSize: tokens.fontSize.md, 
    color: tokens.color.gray_700, 
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'left'
  },

  imageSection: { 
    alignItems: 'center', 
    marginBottom: tokens.space._4xl,
    alignSelf: 'center'
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.black,
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
});
