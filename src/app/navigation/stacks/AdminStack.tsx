/**
 * AdminStack (PR-021)
 * 
 * Navigation stack for admin dashboard and management screens.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Admin screens
import AdminDashboardScreen from '../../../screens/admin/AdminDashboardScreen';
import AdminDealsScreen from '../../../screens/admin/AdminDealsScreen';
import AdminMassUploadScreen from '../../../screens/admin/AdminMassUploadScreen';
import AdminReportsScreen from '../../../screens/admin/AdminReportsScreen';
import AdminUsersScreen from '../../../screens/admin/AdminUsersScreen';
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
