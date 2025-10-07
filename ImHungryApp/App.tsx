import * as React from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthGuard from './src/components/AuthGuard';


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
import { 
  FeedWithNav, 
  DiscoverFeedWithNav, 
  DealCreationWithNav, 
  FavoritesWithNav, 
  ProfileWithNav 
} from './src/components/ScreenWrappers';
import CommunityUploadedScreen from './src/screens/deal_feed/CommunityUploadedScreen';
import DealDetailScreen from './src/screens/deal_feed/DealDetailScreen';
import ReportContentScreen from './src/screens/deal_feed/ReportContentScreen';
import BlockUserScreen from './src/screens/deal_feed/BlockUserScreen';
import { DataCacheProvider } from './src/context/DataCacheContext';
import { DealUpdateProvider } from './src/context/DealUpdateContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { LocationProvider } from './src/context/LocationContext';
import CuisineEdit from './src/screens/profile/CuisineEdit';
import RestaurantDetailScreen from './src/screens/discover_feed/RestaurantDetailScreen';
import ImageCacheService from './src/services/imageCacheService';


const Stack = createNativeStackNavigator();

const OnboardingStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: false
    }}
    initialRouteName="Landing"
  >
    <Stack.Screen name="Landing" component={LandingScreen}  />
    <Stack.Screen 
      name="SignUp" 
      component={SignUp} 
      options={({ route }) => ({
        animation: (route.params as any)?.fromLogin ? 'slide_from_left' : 'slide_from_right'
      })}
    />
    <Stack.Screen name="LogIn" component={LogIn}  />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen name="ResetPassword" component={ResetPassword} />
    <Stack.Screen name="Username" component={UsernameScreen} />
    <Stack.Screen name="ProfilePhoto" component={ProfilePhoto} />
    <Stack.Screen name="LocationPermissions" component={LocationPermissions} />
    <Stack.Screen name="InstantNotifications" component={InstantNotifications} />
    <Stack.Screen name="CuisinePreferences" component={CuisinePreferences} />
  </Stack.Navigator>
);

const AppStack = () => (
  <AuthGuard>
    <Stack.Navigator screenOptions={{ 
      headerShown: false
    }}>
      <Stack.Screen 
        name="Feed" 
        component={FeedWithNav} 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="DiscoverFeed" 
        component={DiscoverFeedWithNav} 
        options={{ animation: 'none' }}
      />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen 
        name="ProfilePage" 
        component={ProfileWithNav} 
        options={{ animation: 'none' }}
      />
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
      <Stack.Screen name="BlockedUsersPage" component={BlockedUsersPage} />
      <Stack.Screen name="ContactUsPage" component={ContactUsPage} />
      <Stack.Screen name="FAQPage" component={FAQPage} />
      <Stack.Screen name="TermsConditionsPage" component={TermsConditionsPage} />
      <Stack.Screen name="PrivacyPolicyPage" component={PrivacyPolicyPage} />
      <Stack.Screen 
        name="DealCreationScreen" 
        component={DealCreationWithNav} 
        options={{ animation: 'none' }}
      />
      <Stack.Screen name="CommunityUploaded" component={CommunityUploadedScreen} />
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="ReportContent" component={ReportContentScreen} />
      <Stack.Screen name="BlockUser" component={BlockUserScreen} />
      <Stack.Screen name="CuisineEdit" component={CuisineEdit} />
      <Stack.Screen 
        name="FavoritesPage" 
        component={FavoritesWithNav} 
        options={{ animation: 'none' }}
      />
    </Stack.Navigator>
  </AuthGuard>
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

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  return (
    <NavigationContainer 
      linking={linking}
      key={isAuthenticated ? 'app' : 'onboarding'} // Force remount when switching stacks
    >
      {isAuthenticated ? <AppStack /> : <OnboardingStack />}
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Mitr-Bold': require('./assets/fonts/Mitr-Bold.ttf'),
    'Manrope-Regular': require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
    'MuseoModerno-Bold': require('./assets/fonts/MuseoModerno-Bold.ttf'),
  }); 
  
  const [timeoutReached, setTimeoutReached] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 3000);

    if (fontsLoaded) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded && !fontError && !timeoutReached) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <DataCacheProvider>
        <DealUpdateProvider>
          <FavoritesProvider>
            <LocationProvider>
              <AppContent />
            </LocationProvider>
          </FavoritesProvider>
        </DealUpdateProvider>
      </DataCacheProvider>
    </AuthProvider>
  );
}