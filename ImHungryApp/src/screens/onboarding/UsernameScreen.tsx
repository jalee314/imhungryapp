import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';
import { isUsernameAvailable } from '../../services/onboardingService';

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
  const [isValidated, setIsValidated] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  useEffect(() => {
    if (!userData) {
      Alert.alert('Error', 'Please complete the signup process first', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    }
  }, [userData, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
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
      setIsValidated(false);
      return;
    }
    if (name.length > 20) {
      setError('Username must be less than 20 characters.');
      setIsChecking(false);
      setIsValidated(false);
      return;
    }

    setIsChecking(true);
    setError('');
    setIsValidated(false);

    try {
      const available = await isUsernameAvailable(name);
      if (!available) {
        setError('Username is already taken.');
        setIsValidated(false);
      } else {
        setIsValidated(true);
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setError('Error checking username. Please try again.');
      setIsValidated(false);
    } finally {
      setIsChecking(false);
    }
  };

  const debouncedCheck = useCallback(debounce(checkUsernameUniqueness, 500), []);

  const handleUsernameChange = (text: string) => {
    const withAt = text.startsWith('@') ? text : '@' + text.replace(/^@+/, '');
    const body = withAt.slice(1).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const newValue = '@' + body;
    
    setDisplayUsername(newValue);
    setUsername(body);
    setIsValidated(false);
    
    if (body) {
      debouncedCheck(body);
    } else {
      setIsChecking(false);
      setError('');
    }
  };

  const handleSelectionChange = (e: any) => {
    const { start, end } = e.nativeEvent.selection;
    if (start < 1 || end < 1) {
      setSelection({ start: 1, end: 1 });
    } else {
      setSelection({ start, end });
    }
  };

  const canContinue = isValidated && !isChecking && !error && username.length >= 3 && username.length <= 20;

  const handleContinue = async () => {
    if (!canContinue) return;
    if (!userData) return;

    (navigation as any).navigate('ProfilePhoto', {
      userData: { ...userData, username },
      profilePhoto: existingProfilePhoto,
    });
  };

  return (
    <Box flex={1} bg="background">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Box flex={1} px="2xl" py="2xl">
            {/* Header */}
            <Box row justifyBetween alignCenter mb="5xl" height={44}>
              <Box py="m" px="xs" width={44} />
            </Box>

            {/* Main Content */}
            <Box flex={1} alignStart width="100%">
              {/* Title */}
              <Box mb="5xl" maxWidth={343} alignCenter style={{ alignSelf: 'center' }}>
                <Text 
                  size="2xl" 
                  weight="bold" 
                  color="text" 
                  align="center"
                  style={{ fontFamily: typography.fontFamily.bold }}
                >
                  Choose your username
                </Text>
              </Box>

              {/* Form */}
              <Box width="100%" maxWidth={338} style={{ alignSelf: 'center' }} alignCenter>
                <TextInput
                  mode="flat"
                  value={displayUsername}
                  onChangeText={handleUsernameChange}
                  placeholder={isFocused ? '' : '@ImHungri'}
                  placeholderTextColor="#636363"
                  selection={isFocused ? selection : undefined}
                  onSelectionChange={isFocused ? handleSelectionChange : undefined}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  style={{
                    backgroundColor: 'transparent',
                    fontSize: 32,
                    textAlign: 'center',
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    width: '100%',
                    marginTop: 40,
                  }}
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
                  onFocus={() => { 
                    setIsFocused(true); 
                    setDisplayUsername(username ? '@' + username : '@');
                    setSelection({ start: 1, end: 1 });
                  }}
                  onBlur={() => { 
                    setIsFocused(false); 
                    setSelection(undefined);
                    if (!username) setDisplayUsername(''); 
                  }}
                />
                {error ? (
                  <Text color="error" align="center" mt="m">
                    {error}
                  </Text>
                ) : null}
              </Box>

              {/* Spacer */}
              <Box flex={1} />

              {/* Footer */}
              <Box width="100%" alignCenter style={{ alignSelf: 'center' }}>
                <Pressable 
                  onPress={handleContinue}
                  disabled={!canContinue}
                  width="100%"
                  maxWidth={343}
                  height={44}
                  rounded="full"
                  alignCenter
                  justifyCenter
                  bg={canContinue ? 'primaryDark' : undefined}
                  style={{ backgroundColor: canContinue ? colors.primaryDark : '#ccc' }}
                >
                  <Text color="textInverse" size="base" weight="semiBold">
                    Continue
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
