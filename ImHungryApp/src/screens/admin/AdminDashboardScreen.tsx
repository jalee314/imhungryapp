import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import type { AppAnalytics } from '../../types/admin';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { BRAND, GRAY } from '../../ui/alf';

import AdminHeader from '../../features/admin/sections/AdminHeader';
import AdminLoadingState from '../../features/admin/sections/AdminLoadingState';
import DashboardStatsGrid from '../../features/admin/sections/DashboardStatsGrid';
import DashboardQuickActions from '../../features/admin/sections/DashboardQuickActions';
import DashboardRankingList from '../../features/admin/sections/DashboardRankingList';

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { exitAdminMode, exitAdminModeToSettings } = useAdmin();
  const { signOut } = useAuth();

  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to exit admin mode and sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              exitAdminMode();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const navigateTo = (screen: string) => {
    (navigation as any).navigate(screen);
  };

  if (loading) {
    return <AdminLoadingState />;
  }

  const quickActions = [
    { icon: 'flag-outline' as const, title: 'Content Moderation', subtitle: 'Review and manage user reports', onPress: () => navigateTo('AdminReports') },
    { icon: 'restaurant-outline' as const, title: 'Deal Management', subtitle: 'Edit, delete, and feature deals', onPress: () => navigateTo('AdminDeals') },
    { icon: 'people-outline' as const, title: 'User Management', subtitle: 'Search and manage users', onPress: () => navigateTo('AdminUsers') },
    { icon: 'cloud-upload-outline' as const, title: 'Mass Deal Upload', subtitle: 'Upload multiple deals at once', onPress: () => navigateTo('AdminMassUpload') },
    { icon: 'person-outline' as const, title: 'Switch to Standard Profile', subtitle: 'Return to normal app view', onPress: exitAdminModeToSettings },
  ];

  const activeUsers = (analytics?.mostActiveUsers || []).slice(0, 3).map((u) => ({
    id: u.user_id,
    title: u.display_name,
    subtitle: `${u.deal_count} sessions`,
  }));

  const popularDeals = (analytics?.mostPopularDeals || []).slice(0, 3).map((d) => ({
    id: d.deal_instance_id,
    title: d.title,
    subtitle: `${d.interaction_count} interactions`,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
      <AdminHeader
        title="Admin Dashboard"
        rightIcon="log-out-outline"
        onRightPress={handleSignOut}
      />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND.accent]} />
        }
      >
        {analytics && <DashboardStatsGrid analytics={analytics} onNavigate={navigateTo} />}
        <DashboardQuickActions actions={quickActions} />
        <DashboardRankingList heading="Most Active Users" items={activeUsers} emptyText="No active users yet" />
        <DashboardRankingList heading="Most Popular Deals" items={popularDeals} emptyText="No deals available" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;
