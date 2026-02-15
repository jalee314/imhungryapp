/**
 * AdminStack (PR-021)
 * 
 * Navigation stack for admin dashboard and management screens.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Admin screens
import AdminDashboardScreen from '../../../screens/admin/AdminDashboardScreen';
import AdminReportsScreen from '../../../screens/admin/AdminReportsScreen';
import AdminDealsScreen from '../../../screens/admin/AdminDealsScreen';
import AdminUsersScreen from '../../../screens/admin/AdminUsersScreen';
import AdminMassUploadScreen from '../../../screens/admin/AdminMassUploadScreen';

import type { AdminStackParamList } from '../types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

/**
 * AdminStack - Admin dashboard and management screens
 */
export const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
    <Stack.Screen name="AdminDeals" component={AdminDealsScreen} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Stack.Screen name="AdminMassUpload" component={AdminMassUploadScreen} />
  </Stack.Navigator>
);

export default AdminStack;
