/**
 * Navigation.tsx
 * 
 * Main navigation configuration following Bluesky's pattern.
 * All navigation logic is centralized here, extracted from App.tsx.
 */

import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigatorProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';

// Screen imports - Auth/Onboarding (from features/auth)
import {
  LandingScreen,
  SignUp,
  LogIn,
  ForgotPassword,
  ResetPassword,
  UsernameScreen,
  ProfilePhoto,
  LocationPermissions,
  InstantNotifications,
  CuisinePreferences,
  AuthGuard,
} from '#/features/auth';

// Screen imports - Deals (from features/deals)
import {
  DealDetailScreen,
  CommunityUploadedScreen,
  ReportContentScreen,
  BlockUserScreen,
  FeedTabNavigator,
} from '#/features/deals';

// Screen imports - Discover (from features/discover)
import { RestaurantDetailScreen } from '#/features/discover';

// Screen imports - Profile (from features/profile)
import {
  ProfilePage,
  ProfileEdit,
  BlockedUsersPage,
  ContactUsPage,
  FAQPage,
  TermsConditionsPage,
  PrivacyPolicyPage,
  CuisineEdit,
  FavoritesPage,
} from '#/features/profile';

// Screen imports - Admin (from features/admin)
import {
  AdminLoginScreen,
  AdminDashboardScreen,
  AdminReportsScreen,
  AdminDealsScreen,
  AdminUsersScreen,
  AdminMassUploadScreen,
} from '#/features/admin';

// Components
import { TabBar } from './view/shell/TabBar';

// ==========================================
// Navigation Types
// ==========================================

export type RootStackParamList = {
  // Onboarding
  Landing: undefined;
  SignUp: { fromLogin?: boolean };
  LogIn: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Username: undefined;
  ProfilePhoto: undefined;
  LocationPermissions: undefined;
  InstantNotifications: undefined;
  CuisinePreferences: undefined;
  AdminLogin: undefined;
  
  // Main App
  MainTabs: undefined;
  DealDetail: { dealId: string };
  RestaurantDetail: { restaurantId: string };
  ReportContent: { dealId: string; uploaderUserId: string };
  BlockUser: { userId: string };
  
  // Admin
  AdminDashboard: undefined;
  AdminReports: undefined;
  AdminDeals: undefined;
  AdminUsers: undefined;
  AdminMassUpload: undefined;
};

export type TabParamList = {
  Feed: undefined;
  DiscoverFeed: undefined;
  DealCreationScreen: undefined;
  FavoritesPage: undefined;
  ProfilePage: undefined;
};

// ==========================================
// Navigator Instances
// ==========================================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ==========================================
// Common Screen Options
// ==========================================

const screenOptions = {
  headerShown: false,
} as const;

// ==========================================
// Common Screens Pattern (Bluesky style)
// Screens that are shared across multiple tab stacks
// ==========================================

type StackType = ReturnType<typeof createNativeStackNavigator>;

function commonScreens(Stack: StackType) {
  return (
    <>
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="ReportContent" component={ReportContentScreen} />
      <Stack.Screen name="BlockUser" component={BlockUserScreen} />
    </>
  );
}

// ==========================================
// Tab Stack Navigators
// ==========================================

// Component wrapper to avoid inline function warning
const DiscoverMainScreen = () => <FeedTabNavigator currentTab="discover" />;

const FeedStackNav = createNativeStackNavigator();
export function FeedStack() {
  return (
    <FeedStackNav.Navigator screenOptions={screenOptions}>
      <FeedStackNav.Screen name="FeedMain" component={FeedTabNavigator} />
      <FeedStackNav.Screen name="CommunityUploaded" component={CommunityUploadedScreen} />
    </FeedStackNav.Navigator>
  );
}

const DiscoverStackNav = createNativeStackNavigator();
export function DiscoverStack() {
  return (
    <DiscoverStackNav.Navigator screenOptions={screenOptions}>
      <DiscoverStackNav.Screen name="DiscoverMain" component={DiscoverMainScreen} />
    </DiscoverStackNav.Navigator>
  );
}

// Placeholder for contribute tab (shows feed as fallback when "active")
const ContributeStackNav = createNativeStackNavigator();
export function ContributeStack() {
  return (
    <ContributeStackNav.Navigator screenOptions={screenOptions}>
      <ContributeStackNav.Screen name="ContributeMain" component={FeedTabNavigator} />
    </ContributeStackNav.Navigator>
  );
}

const FavoritesStackNav = createNativeStackNavigator();
export function FavoritesStack() {
  return (
    <FavoritesStackNav.Navigator screenOptions={screenOptions}>
      <FavoritesStackNav.Screen name="FavoritesMain" component={FavoritesPage} />
    </FavoritesStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator();
export function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={screenOptions}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfilePage} />
      <ProfileStackNav.Screen name="ProfileEdit" component={ProfileEdit} />
      <ProfileStackNav.Screen name="BlockedUsersPage" component={BlockedUsersPage} />
      <ProfileStackNav.Screen name="ContactUsPage" component={ContactUsPage} />
      <ProfileStackNav.Screen name="FAQPage" component={FAQPage} />
      <ProfileStackNav.Screen name="TermsConditionsPage" component={TermsConditionsPage} />
      <ProfileStackNav.Screen name="PrivacyPolicyPage" component={PrivacyPolicyPage} />
      <ProfileStackNav.Screen name="CuisineEdit" component={CuisineEdit} />
    </ProfileStackNav.Navigator>
  );
}

// ==========================================
// Main Tab Navigator
// ==========================================

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={screenOptions}
      initialRouteName="Feed"
    >
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="DiscoverFeed" component={DiscoverStack} />
      <Tab.Screen name="DealCreationScreen" component={ContributeStack} />
      <Tab.Screen name="FavoritesPage" component={FavoritesStack} />
      <Tab.Screen name="ProfilePage" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ==========================================
// Stack Navigators
// ==========================================

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
      initialRouteName="Landing"
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={({ route }) => ({
          animation: (route.params as any)?.fromLogin ? 'slide_from_left' : 'slide_from_right',
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
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminDeals" component={AdminDealsScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminMassUpload" component={AdminMassUploadScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <AuthGuard>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        {/* Shared screens accessible from any tab */}
        <Stack.Screen name="DealDetail" component={DealDetailScreen} />
        <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
        <Stack.Screen name="ReportContent" component={ReportContentScreen} />
        <Stack.Screen name="BlockUser" component={BlockUserScreen} />
      </Stack.Navigator>
    </AuthGuard>
  );
}

// ==========================================
// Deep Linking Configuration
// ==========================================

const prefix = Linking.createURL('/', { scheme: 'imhungri' });

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'com.imhungri://', 'imhungri://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // Add other deep link routes here
    },
  },
};

// ==========================================
// Routes Container (Bluesky pattern)
// ==========================================

interface RoutesContainerProps {
  children: React.ReactNode;
}

export function RoutesContainer({ children }: RoutesContainerProps) {
  return (
    <NavigationContainer linking={linking}>
      {children}
    </NavigationContainer>
  );
}
