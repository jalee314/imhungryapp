import React from 'react';
import { View, ActivityIndicator, Image, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as Linking from 'expo-linking';
import { useAuth } from './src/hooks/useAuth';
import { useInitializeAuth } from './src/stores/AuthStore';
import { useAdmin } from './src/hooks/useAdmin';
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
import DealEditScreen from './src/screens/contribution/DealEditScreen';

// Admin screens
import AdminLoginScreen from './src/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminReportsScreen from './src/screens/admin/AdminReportsScreen';
import AdminDealsScreen from './src/screens/admin/AdminDealsScreen';
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen';
import AdminMassUploadScreen from './src/screens/admin/AdminMassUploadScreen';

import { useInitializeDataCache } from './src/stores/DataCacheStore';
import { useInitializeLocation } from './src/stores/LocationStore';
import { useInitializeAdmin } from './src/stores/AdminStore';

// Navigation constants - exported for testability
import {
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  APP_STACK_ROUTES,
  TAB_ROUTES,
  FEED_STACK_ROUTES,
  DISCOVER_STACK_ROUTES,
  CONTRIBUTE_STACK_ROUTES,
  FAVORITES_STACK_ROUTES,
  PROFILE_STACK_ROUTES,
  DEEP_LINK_CONFIG,
} from './src/app/navigation';

// Re-export route constants for external consumers
export {
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  APP_STACK_ROUTES,
  TAB_ROUTES,
  FEED_STACK_ROUTES,
  DISCOVER_STACK_ROUTES,
  CONTRIBUTE_STACK_ROUTES,
  FAVORITES_STACK_ROUTES,
  PROFILE_STACK_ROUTES,
  DEEP_LINK_CONFIG,
} from './src/app/navigation';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Component functions to avoid inline function warnings
const DiscoverMainScreen = () => <FeedTabNavigator currentTab="discover" />;

// Stack navigators for each tab - only containing tab-specific screens
const FeedStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Feed Main" component={FeedTabNavigator} />
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
const MainTabNavigator = () => {
  const { navigateToProfileSettings } = useAdmin();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={navigateToProfileSettings ? "ProfilePage" : "Feed"}
    >
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="DiscoverFeed" component={DiscoverStack} />
      <Tab.Screen name="DealCreationScreen" component={ContributeStack} />
      <Tab.Screen name="FavoritesPage" component={FavoritesStack} />
      <Tab.Screen name="ProfilePage" component={ProfileStack} />
    </Tab.Navigator>
  );
};


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
    
    // Special handling for Profile tab - always reset to own profile
    if (tab === 'profile') {
      // Reset the ProfileStack to ProfileMain with no params (shows own profile)
      navigation.navigate('ProfilePage', {
        screen: 'ProfileMain',
        params: { viewUser: false, userId: undefined },
      });
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
    <Stack.Screen name="Landing" component={LandingScreen} />
    <Stack.Screen
      name="SignUp"
      component={SignUp}
      options={({ route }) => ({
        animation: (route.params as any)?.fromLogin ? 'slide_from_left' : 'slide_from_right'
      })}
    />
    <Stack.Screen name="LogIn" component={LogIn} />
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

    {/* Admin login accessible from login screen */}
    <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
    <Stack.Screen name="AdminDeals" component={AdminDealsScreen} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Stack.Screen name="AdminMassUpload" component={AdminMassUploadScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <AuthGuard>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tab navigator with persistent bottom navigation */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Shared screens accessible from any tab */}
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="DealEdit" component={DealEditScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="ReportContent" component={ReportContentScreen} />
      <Stack.Screen name="BlockUser" component={BlockUserScreen} />
      {/* UserProfile screen for viewing other users (separate from Profile tab) */}
      <Stack.Screen name="UserProfile" component={ProfilePage} />
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
  const { isAdminMode } = useAdmin();

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [isSplashVisible, setSplashVisible] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }
  }, [isLoading]);

  // Determine which stack to show
  let currentStack;

  if (isAdminMode) {
    // Admin mode - show admin stack regardless of auth status
    currentStack = <AdminStack />;
  } else if (isAuthenticated && !isPasswordResetMode) {
    // Regular authenticated user - show app stack
    currentStack = <AppStack />;
  } else {
    // Not authenticated or in password reset - show onboarding
    currentStack = <OnboardingStack />;
  }

  // Debug logging
  console.log('App navigation decision:', {
    isAuthenticated,
    isPasswordResetMode,
    isAdminMode,
    showing: isAdminMode ? 'AdminStack' : (isAuthenticated && !isPasswordResetMode ? 'AppStack' : 'OnboardingStack')
  });

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        {currentStack}
      </NavigationContainer>

      {isSplashVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FFE5B4',
            opacity: fadeAnim,
            zIndex: 999
          }}
        >
          <Image
            source={require('./assets/images/icon_splash.png')}
            style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
        </Animated.View>
      )}
    </View>
  );
};



export default function App() {
  // Initialize Zustand auth store once at app start
  useInitializeAuth();
  // Initialize admin store once at app start
  useInitializeAdmin();
  // Initialize data cache store once at app start
  useInitializeDataCache();
  // Initialize location store once at app start
  useInitializeLocation();
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Map aliases for easier use
    'Inter': Inter_400Regular,
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
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
        <Image
          source={require('./assets/images/icon_splash.png')}
          style={{ width: 200, height: 200, resizeMode: 'contain' }}
        />
      </View>
    );
  }

  return (
    <AppContent />
  );
}



