import React, { useState, useRef } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Box, Text, Pressable, Skeleton } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';
import { useDataCache } from '../../hooks/useDataCache';
import { useAuth } from '../../hooks/useAuth';

export default function CuisinePreferencesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
  const userData = (route.params as any)?.userData;
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { completeSignup, completeSignupSkip } = useAuth();
  
  const isSubmittingRef = useRef(false);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      } else if (prev.length < 3) {
        return [...prev, cuisine];
      } else {
        return [prev[1], prev[2], cuisine];
      }
    });
  };

  const handleFinish = async () => {
    if (isSubmittingRef.current) return;
    
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      try {
        await completeSignup(userData, selectedCuisines);
      } catch (error: any) {
        const message = error?.message || 'An unexpected error occurred.';
        if (typeof message === 'string' && (message.includes('duplicate key') || message.includes('unique constraint'))) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email, phone number, or username already exists. Please try logging in or use different information.',
            [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
          );
        } else if (typeof message === 'string' && (message.includes('ST_GeogFromText') || message.includes('PostGIS'))) {
          Alert.alert('Location Error', 'There was an issue processing your location. Please try again.', [{ text: 'Go Back', onPress: () => navigation.goBack() }]);
        } else if (typeof message === 'string' && message.includes('User creation failed')) {
          Alert.alert('Database Error', `Account creation failed: ${message}. Please contact support if this continues.`, [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]);
        } else {
          Alert.alert('Account Creation Failed', 'An unexpected error occurred. Please try again or contact support.', [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]);
        }
        return;
      }
    } catch (error) {
      console.error('Setup failed:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (isSubmittingRef.current) return;
    
    if (!userData) {
      Alert.alert('Error', 'User data not found');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      try {
        await completeSignupSkip(userData);
      } catch (error: any) {
        Alert.alert(
          'Account Creation Failed',
          'An account with this email, phone number, or username may already exist. Please go back and check your information.',
          [{ text: 'Go Back', onPress: () => (navigation as any).navigate('SignUp', { userData }) }]
        );
        return;
      }
    } catch (error) {
      console.error('Setup failed (skip):', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const availableCuisines = cuisines.map(c => c.name);

  return (
    <Box flex={1} bg="background">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Box flex={1} px="2xl" py="2xl">
            {/* Header */}
            <Box row justifyBetween alignCenter mb="5xl" height={44}>
              <Pressable py="m" px="xs" onPress={() => navigation.goBack()}>
                <Text size="xl" weight="medium" color="text">←</Text>
              </Pressable>

              <Pressable 
                py="m" 
                px="xs" 
                onPress={handleSkip}
                disabled={loading}
                style={loading ? { opacity: 0.5 } : undefined}
              >
                <Text 
                  size="base" 
                  color="textLight"
                  style={{ fontFamily: typography.fontFamily.regular }}
                >
                  Skip
                </Text>
              </Pressable>
            </Box>

            {/* Main Content */}
            <Box flex={1} alignStart width="100%">
              {/* Title Section */}
              <Box alignStart mb="3xl" maxWidth={343}>
                <Text 
                  size="2xl" 
                  weight="bold" 
                  color="text" 
                  mb="3xl"
                  style={{ fontFamily: typography.fontFamily.bold, textAlign: 'left' }}
                >
                  Cuisine Preferences
                </Text>
                <Text 
                  size="base" 
                  color="textLight" 
                  lineHeight={24}
                  style={{ fontFamily: typography.fontFamily.regular, textAlign: 'left' }}
                >
                  What are your favorite cuisines? Choose up to 3.
                </Text>
              </Box>

              {/* Cuisine Grid */}
              <Box 
                row 
                style={{ 
                  flexWrap: 'wrap', 
                  justifyContent: 'space-between',
                  width: '100%',
                  flex: 1,
                  paddingBottom: 16,
                }}
              >
                {cuisinesLoading ? (
                  Array.from({ length: 16 }).map((_, index) => (
                    <Skeleton 
                      key={index} 
                      width="48%" 
                      height={36} 
                      rounded="lg"
                      style={{ marginBottom: 8 }}
                    />
                  ))
                ) : (
                  availableCuisines.map((cuisine) => {
                    const isSelected = selectedCuisines.includes(cuisine);
                    return (
                      <Pressable
                        key={cuisine}
                        onPress={() => toggleCuisine(cuisine)}
                        height={36}
                        rounded="md"
                        alignCenter
                        justifyCenter
                        mb="m"
                        style={{
                          width: '48%',
                          backgroundColor: isSelected ? colors.primaryDark : '#eaeaea',
                        }}
                      >
                        <Text 
                          size="md" 
                          color="text"
                          align="center"
                          style={{ fontFamily: typography.fontFamily.regular }}
                        >
                          {cuisine}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </Box>

              {/* Footer */}
              <Box width="100%" alignCenter>
                <Pressable
                  onPress={handleFinish}
                  disabled={loading}
                  width="100%"
                  maxWidth={343}
                  height={44}
                  rounded="full"
                  alignCenter
                  justifyCenter
                  bg="primaryDark"
                  style={loading ? { opacity: 0.7 } : undefined}
                >
                  <Text color="textInverse" size="base" weight="semiBold">
                    {loading ? 'Creating Account...' : 'Finish'}
                  </Text>
                </Pressable>
              </Box>
            </Box>
          </Box>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  );
}
