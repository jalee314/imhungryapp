import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';


import LandingScreen from './src/screens/onboarding/LandingScreen';
import SignUp from './src/screens/onboarding/SignUp';
import LogIn from './src/screens/onboarding/LogIn';
import ForgotPassword from './src/screens/onboarding/ForgotPassword';
import ResetPassword from './src/screens/onboarding/ResetPassword';
import UsernameScreen from './src/screens/onboarding/UsernameScreen';
import ProfilePhoto from './src/screens/onboarding/ProfilePhoto';
import LocationPermissions from './src/screens/onboarding/LocationPermissions';
import InstantNotifications from './src/screens/onboarding/InstantNotifications';
import CuisinePreferences from './src/screens/onboarding/CuisinePreferences';
import ProfilePage from './src/screens/profile/ProfilePage';

const Stack = createNativeStackNavigator();

const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={LandingScreen} />
    <Stack.Screen name="SignUp" component={SignUp} />
    <Stack.Screen name="LogIn" component={LogIn} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen name="ResetPassword" component={ResetPassword} />
    <Stack.Screen name="Username" component={UsernameScreen} />
    <Stack.Screen name="ProfilePhoto" component={ProfilePhoto} />
    <Stack.Screen name="LocationPermissions" component={LocationPermissions} />
    <Stack.Screen name="InstantNotifications" component={InstantNotifications} />
    <Stack.Screen name="CuisinePreferences" component={CuisinePreferences} />
    <Stack.Screen name="ProfilePage" component={ProfilePage} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfilePage" component={ProfilePage} />
    {/* Add other authenticated screens here */}
  </Stack.Navigator>
);

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'com.imhungri://', 'imhungri://'],
  config: {
    screens: {
      ResetPassword: 'reset-password'
      // Add other screens you want to deep link to here
      // 'ScreenName': 'path-in-url'
    },
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Mitr-Bold': require('./assets/fonts/Mitr-Bold.ttf'),
    'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
  }); 
  
  const [timeoutReached, setTimeoutReached] = React.useState(false);
  // This state will determine which stack to show. 
  // In a real app, you'd check for a token in AsyncStorage or a global state.
  const [isLoggedIn, setIsLoggedIn] = React.useState(false); 

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
      console.log('Loading timeout');
    }, 3000);

    if (fontsLoaded) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (fontError) {
    console.log('Font loading error:', fontError);
  }

  if (!fontsLoaded && !fontError && !timeoutReached) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {isLoggedIn ? <AppStack /> : <OnboardingStack />}
    </NavigationContainer>
  );
}