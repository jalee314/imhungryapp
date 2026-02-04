/**
 * Navigation Types - React Navigation param types
 */

import type { Deal } from '../features/feed/types';

export type RootStackParamList = {
  // Auth Flow
  Landing: undefined;
  SignUp: { userData?: any; fromLogin?: boolean };
  LogIn: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  UsernameScreen: { userData: any };
  ProfilePhoto: { userData: any };
  CuisinePreferences: { userData: any };
  LocationPermissions: undefined;
  InstantNotifications: undefined;

  // Main App
  MainTabs: undefined;
  Feed: undefined;
  ExploreFeed: undefined;
  ProfilePage: undefined;
  FavoritesPage: undefined;
  
  // Deal Screens
  DealDetail: { deal: Deal };
  DealCreation: undefined;
  DealEdit: { dealId: string };
  DealPreview: { dealData: any };
  
  // Discovery Screens
  RestaurantDetail: { restaurant: any };
  CommunityUploaded: undefined;
  
  // Profile Screens
  UserProfile: { viewUser?: boolean; username: string; userId: string };
  EditProfile: undefined;
  Settings: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  ContactUs: undefined;
  BlockedUsers: undefined;
  
  // Admin Screens
  AdminDashboard: undefined;
  AdminReports: undefined;
  AdminDeals: undefined;
  AdminUsers: undefined;
  AdminDealDetail: { dealId: string };
  AdminReport: { reportId: string };
  
  // Other
  BlockUser: { dealId: string; uploaderUserId: string };
};

export type MainTabParamList = {
  Feed: undefined;
  ExploreFeed: undefined;
  Contribute: undefined;
  FavoritesPage: undefined;
  ProfilePage: undefined;
};
