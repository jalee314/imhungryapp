import React from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// Main app screens and components
import FeedTabNavigator from './src/components/FeedTabNavigator';
import FavoritesPage from './src/screens/favorites/FavoritesPage';
import ProfilePage from './src/screens/profile/ProfilePage';
import BottomNavigation from './src/components/BottomNavigation';

// Modal/detail screens
import ProfileEdit from './src/screens/profile/ProfileEdit';
import BlockedUsersPage from './src/screens/profile/BlockedUsersPage';
import ContactUsPage from './src/screens/profile/ContactUsPage';
import FAQPage from './src/screens/profile/FAQPage';
import TermsConditionsPage from './src/screens/profile/TermsConditionsPage';
import PrivacyPolicyPage from './src/screens/profile/PrivacyPolicyPage';
import CuisineEdit from './src/screens/profile/CuisineEdit';
import RestaurantDetailScreen from './src/screens/discover_feed/RestaurantDetailScreen';
import CommunityUploadedScreen from './src/screens/deal_feed/CommunityUploadedScreen';
import DealDetailScreen from './src/screens/deal_feed/DealDetailScreen';
import ReportContentScreen from './src/screens/deal_feed/ReportContentScreen';
import BlockUserScreen from './src/screens/deal_feed/BlockUserScreen';

import { DataCacheProvider } from './src/context/DataCacheContext';
import { DealUpdateProvider } from './src/context/DealUpdateContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { LocationProvider } from './src/context/LocationContext';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Component functions to avoid inline function warnings
const DiscoverMainScreen = () => <FeedTabNavigator currentTab="discover" />;

// Stack navigators for each tab - only containing tab-specific screens
const FeedStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FeedMain" component={FeedTabNavigator} />
    <Stack.Screen name="CommunityUploaded" component={CommunityUploadedScreen} />
  </Stack.Navigator>
);

const DiscoverStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen 
      name="DiscoverMain" 
      component={DiscoverMainScreen} 
    />
  </Stack.Navigator>
);

// For contribute tab, we'll handle it specially since it's a modal
const ContributeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen 
      name="ContributeMain" 
      component={FeedTabNavigator} // Show feed as fallback when contribute tab is "active"
    />
  </Stack.Navigator>
);

const FavoritesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FavoritesMain" component={FavoritesPage} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfilePage} />
    <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
    <Stack.Screen name="BlockedUsersPage" component={BlockedUsersPage} />
    <Stack.Screen name="ContactUsPage" component={ContactUsPage} />
    <Stack.Screen name="FAQPage" component={FAQPage} />
    <Stack.Screen name="TermsConditionsPage" component={TermsConditionsPage} />
    <Stack.Screen name="PrivacyPolicyPage" component={PrivacyPolicyPage} />
    <Stack.Screen name="CuisineEdit" component={CuisineEdit} />
  </Stack.Navigator>
);

// Tab Navigator with persistent bottom navigation
const MainTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
    initialRouteName="Feed"
  >
    <Tab.Screen name="Feed" component={FeedStack} />
    <Tab.Screen name="DiscoverFeed" component={DiscoverStack} />
    <Tab.Screen name="DealCreationScreen" component={ContributeStack} />
    <Tab.Screen name="FavoritesPage" component={FavoritesStack} />
    <Tab.Screen name="ProfilePage" component={ProfileStack} />
  </Tab.Navigator>
);

// Custom tab bar component using existing BottomNavigation
const CustomTabBar = ({ state, navigation }: any) => {
  const tabMapping = ['feed', 'search', 'contribute', 'favorites', 'profile'];
  // Don't change activeTab if user is on contribute tab (which is index 2)
  const actualActiveTab = state.index === 2 ? 'feed' : tabMapping[state.index];
  const [lastActiveTab, setLastActiveTab] = React.useState('feed');
  
  // Update last active tab when navigating to non-contribute tabs
  React.useEffect(() => {
    if (state.index !== 2) { // Not contribute tab
      setLastActiveTab(tabMapping[state.index]);
    }
  }, [state.index]);

  const handleTabPress = (tab: string) => {
    const tabIndex = tabMapping.indexOf(tab);
    if (tab === 'contribute') {
      // For contribute, don't change navigation state, just show modal
      // The BottomNavigation component will handle showing the modal
      return;
    }
    if (tabIndex !== -1 && tabIndex !== state.index) {
      navigation.navigate(state.routeNames[tabIndex]);
    }
  };

  return (
    <BottomNavigation 
      activeTab={state.index === 2 ? lastActiveTab : actualActiveTab}
      onTabPress={handleTabPress}
    />
  );
};

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
    <Stack.Screen 
      name="Username" 
      component={UsernameScreen} 
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen name="ProfilePhoto" component={ProfilePhoto} />
    <Stack.Screen name="LocationPermissions" component={LocationPermissions} />
    <Stack.Screen name="InstantNotifications" component={InstantNotifications} />
    <Stack.Screen name="CuisinePreferences" component={CuisinePreferences} />
  </Stack.Navigator>
);

const AppStack = () => (
  <AuthGuard>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tab navigator with persistent bottom navigation */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      
      {/* Shared screens accessible from any tab */}
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="ReportContent" component={ReportContentScreen} />
      <Stack.Screen name="BlockUser" component={BlockUserScreen} />
    </Stack.Navigator>
  </AuthGuard>
);

const prefix = Linking.createURL('/', { scheme: 'imhungri' });

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
  const { isAuthenticated, isLoading, isPasswordResetMode } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE5B4' }}>
        <ActivityIndicator size="large" color="#FFA05C" />
      </View>
    );
  }

  // Always show onboarding stack during password reset mode, even if authenticated
  const shouldShowAppStack = isAuthenticated && !isPasswordResetMode;
  
  // Debug logging
  console.log('App navigation decision:', {
    isAuthenticated,
    isPasswordResetMode,
    shouldShowAppStack
  });

  return (
    <NavigationContainer 
      linking={linking}
    >
      {shouldShowAppStack ? <AppStack /> : <OnboardingStack />}
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