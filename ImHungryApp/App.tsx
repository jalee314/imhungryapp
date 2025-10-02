import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { supabase } from './lib/supabase';
import { initializeAuthSession, setupAppStateListener } from './src/services/sessionService';


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
import ProfileEdit from './src/screens/profile/ProfileEdit';
import BlockedUsersPage from './src/screens/profile/BlockedUsersPage';
import ContactUsPage from './src/screens/profile/ContactUsPage';
import FAQPage from './src/screens/profile/FAQPage';
import TermsConditionsPage from './src/screens/profile/TermsConditionsPage';
import PrivacyPolicyPage from './src/screens/profile/PrivacyPolicyPage';
import DealCreationScreen from './src/screens/contribution/DealCreationScreen';
import Feed from './src/screens/deal_feed/Feed';
import DiscoverFeed from './src/screens/discover_feed/DiscoverFeed';
import CommunityUploadedScreen from './src/screens/deal_feed/CommunityUploadedScreen';
import DealDetailScreen from './src/screens/deal_feed/DealDetailScreen';
import ReportContentScreen from './src/screens/deal_feed/ReportContentScreen';
import BlockUserScreen from './src/screens/deal_feed/BlockUserScreen';
import { DataCacheProvider } from './src/context/DataCacheContext';
import { DealUpdateProvider } from './src/context/DealUpdateContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import CuisineEdit from './src/screens/profile/CuisineEdit';
import RestaurantDetailScreen from './src/screens/discover_feed/RestaurantDetailScreen';
import FavoritesPage from './src/screens/favorites/FavoritesPage';


const Stack = createNativeStackNavigator();

const OnboardingStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="LogIn"
  >
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
    <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
    <Stack.Screen name="BlockedUsersPage" component={BlockedUsersPage} />
    <Stack.Screen name="ContactUsPage" component={ContactUsPage} />
    <Stack.Screen name="FAQPage" component={FAQPage} />
    <Stack.Screen name="TermsConditionsPage" component={TermsConditionsPage} />
    <Stack.Screen name="PrivacyPolicyPage" component={PrivacyPolicyPage} />
    <Stack.Screen name="DealCreationScreen" component={DealCreationScreen} />
    <Stack.Screen name="Feed" component={Feed} />
    <Stack.Screen name="DiscoverFeed" component={DiscoverFeed} />
    <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    <Stack.Screen name="CommunityUploaded" component={CommunityUploadedScreen} />
    <Stack.Screen name="DealDetail" component={DealDetailScreen} />
    <Stack.Screen name="ReportContent" component={ReportContentScreen} />
    <Stack.Screen name="BlockUser" component={BlockUserScreen} />
    <Stack.Screen name="CuisineEdit" component={CuisineEdit} />
    <Stack.Screen name="FavoritesPage" component={FavoritesPage} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Feed" component={Feed} />
    <Stack.Screen name="DiscoverFeed" component={DiscoverFeed} />
    <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    <Stack.Screen name="ProfilePage" component={ProfilePage} />
    <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
    <Stack.Screen name="BlockedUsersPage" component={BlockedUsersPage} />
    <Stack.Screen name="ContactUsPage" component={ContactUsPage} />
    <Stack.Screen name="FAQPage" component={FAQPage} />
    <Stack.Screen name="TermsConditionsPage" component={TermsConditionsPage} />
    <Stack.Screen name="PrivacyPolicyPage" component={PrivacyPolicyPage} />
    <Stack.Screen name="DealCreationScreen" component={DealCreationScreen} />
    <Stack.Screen name="CommunityUploaded" component={CommunityUploadedScreen} />
    <Stack.Screen name="DealDetail" component={DealDetailScreen} />
    <Stack.Screen name="ReportContent" component={ReportContentScreen} />
    <Stack.Screen name="BlockUser" component={BlockUserScreen} />
    <Stack.Screen name="CuisineEdit" component={CuisineEdit} />
    <Stack.Screen name="FavoritesPage" component={FavoritesPage} />
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
    'MuseoModerno-Bold': require('./assets/fonts/MuseoModerno-Bold.ttf'),
  }); 
  
  const [timeoutReached, setTimeoutReached] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 3000);

    if (fontsLoaded) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  // Initialize auth session and check login status
  React.useEffect(() => {
    const checkAndInitialize = async () => {
      try {
        const isAuth = await initializeAuthSession();
        setIsLoggedIn(isAuth);
      } catch (error) {
        console.error('Error initializing:', error);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAndInitialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newLoginState = !!session;
      
      // Force state update with a small delay to ensure it takes effect
      setTimeout(() => {
        setIsLoggedIn(newLoginState);
      }, 100);
      
      if (session && event === 'SIGNED_IN') {
        await initializeAuthSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Setup app state listener for session management
  React.useEffect(() => {
    const cleanup = setupAppStateListener();
    return cleanup;
  }, []);

  if (!fontsLoaded && !fontError && !timeoutReached) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }


  return (
    <DataCacheProvider>
      <DealUpdateProvider>
        <FavoritesProvider>
          <NavigationContainer 
            linking={linking}
            key={isLoggedIn ? 'app' : 'onboarding'} // Force remount when switching stacks
          >
            {isLoggedIn ? <AppStack /> : <OnboardingStack />}
          </NavigationContainer>
        </FavoritesProvider>
      </DealUpdateProvider>
    </DataCacheProvider>
  );
}