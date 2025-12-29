import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { tokens, atoms as a } from '#/ui';
import { useNavigation } from '@react-navigation/native';
import { adminService, AppAnalytics } from '#/services/adminService';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '#/features/auth/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { exitAdminMode } = useAdmin();
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA05C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFA05C']} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigateTo('AdminUsers')}
          >
            <Ionicons name="people" size={32} color="#FFA05C" />
            <Text style={styles.statNumber}>{analytics?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statSubtext}>+{analytics?.recentSignups || 0} this week</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigateTo('AdminDeals')}
          >
            <Ionicons name="pricetag" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{analytics?.totalDeals || 0}</Text>
            <Text style={styles.statLabel}>Total Deals</Text>
            <Text style={styles.statSubtext}>+{analytics?.dealsThisWeek || 0} this week</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigateTo('AdminReports')}
          >
            <Ionicons name="flag" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{analytics?.totalReports || 0}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
            <Text style={styles.statSubtext}>{analytics?.pendingReports || 0} pending</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('AdminReports')}>
            <Ionicons name="flag-outline" size={24} color="#333" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Content Moderation</Text>
              <Text style={styles.actionSubtitle}>Review and manage user reports</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('AdminDeals')}>
            <Ionicons name="restaurant-outline" size={24} color="#333" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Deal Management</Text>
              <Text style={styles.actionSubtitle}>Edit, delete, and feature deals</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('AdminUsers')}>
            <Ionicons name="people-outline" size={24} color="#333" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>User Management</Text>
              <Text style={styles.actionSubtitle}>Search and manage users</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('AdminMassUpload')}>
            <Ionicons name="cloud-upload-outline" size={24} color="#333" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Mass Deal Upload</Text>
              <Text style={styles.actionSubtitle}>Upload multiple deals at once</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Most Active Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Active Users</Text>
          {analytics?.mostActiveUsers && analytics.mostActiveUsers.length > 0 ? (
            analytics.mostActiveUsers.slice(0, 3).map((user, index) => (
              <View key={user.user_id} style={styles.listItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{user.display_name}</Text>
                <Text style={styles.listItemSubtitle}>{user.deal_count} sessions</Text>
              </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No active users yet</Text>
          )}
        </View>

        {/* Most Popular Deals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Popular Deals</Text>
          {analytics?.mostPopularDeals && analytics.mostPopularDeals.length > 0 ? (
            analytics.mostPopularDeals.slice(0, 3).map((deal, index) => (
              <View key={deal.deal_instance_id} style={styles.listItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle} numberOfLines={1}>{deal.title}</Text>
                  <Text style={styles.listItemSubtitle}>{deal.interaction_count} interactions</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No deals available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_gray_100,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.lg,
    ...a.bg_white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  signOutButton: {
    width: 40,
    ...a.align_end,
  },
  headerTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
  },
  content: {
    ...a.flex_1,
  },
  statsGrid: {
    ...a.flex_row,
    ...a.flex_wrap,
    padding: tokens.space.md,
    gap: tokens.space.md,
  },
  statCard: {
    ...a.flex_1,
    minWidth: '45%',
    ...a.bg_white,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    ...a.align_center,
    shadowColor: tokens.color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginTop: tokens.space.sm,
  },
  statLabel: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
    marginTop: tokens.space.xs,
  },
  statSubtext: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_400,
    marginTop: 2,
  },
  emptyText: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_400,
    ...a.text_center,
    paddingVertical: tokens.space.xl,
  },
  section: {
    ...a.bg_white,
    marginHorizontal: tokens.space.md,
    marginBottom: tokens.space.md,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    shadowColor: tokens.color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.lg,
  },
  actionButton: {
    ...a.flex_row,
    ...a.align_center,
    paddingVertical: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionTextContainer: {
    ...a.flex_1,
    marginLeft: tokens.space.md,
  },
  actionTitle: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_black,
  },
  actionSubtitle: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
    marginTop: 2,
  },
  listItem: {
    ...a.flex_row,
    ...a.align_center,
    paddingVertical: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...a.bg_primary_500,
    ...a.justify_center,
    ...a.align_center,
  },
  rankText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_white,
  },
  listItemContent: {
    ...a.flex_1,
    marginLeft: tokens.space.md,
  },
  listItemTitle: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    ...a.text_black,
  },
  listItemSubtitle: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
    marginTop: 2,
  },
});

export default AdminDashboardScreen;

