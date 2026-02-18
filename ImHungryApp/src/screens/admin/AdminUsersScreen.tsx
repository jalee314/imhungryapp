import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import type { UserProfile } from '../../services/admin/types';
import { supabase } from '../../../lib/supabase';
import { BRAND, GRAY, STATIC, SPACING, RADIUS } from '../../ui/alf';
import { Box } from '../../ui/primitives/Box';
import { Text } from '../../ui/primitives/Text';

import AdminHeader from '../../features/admin/sections/AdminHeader';
import AdminLoadingState from '../../features/admin/sections/AdminLoadingState';
import UserCard from '../../features/admin/sections/UserCard';
import UserDetailModal from '../../features/admin/sections/UserDetailModal';
import UserActionModal from '../../features/admin/sections/UserActionModal';

const AdminUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [actionReason, setActionReason] = useState('');

  useEffect(() => { loadAllUsers(); }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadAllUsers(); return; }
    setLoading(true);
    try {
      const data = await adminService.searchUsers(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: UserProfile) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const openActionModal = () => {
    setUserModalVisible(false);
    setActionModalVisible(true);
  };

  const confirmAction = (
    title: string,
    message: string,
    buttonText: string,
    onConfirm: () => Promise<void>,
    destructive = false
  ) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: buttonText,
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]);
  };

  const handleWarnUser = () => {
    if (!selectedUser) return;
    confirmAction('Confirm Warn', 'Are you sure you want to warn this user?', 'Warn', async () => {
      const result = await adminService.warnUser(selectedUser.user_id);
      if (result.success) { Alert.alert('Success', 'User warned'); setActionModalVisible(false); handleSearch(); }
      else Alert.alert('Error', result.error || 'Failed to warn user');
    });
  };

  const handleSuspendUser = () => {
    if (!selectedUser) return;
    const days = parseInt(suspensionDays);
    if (isNaN(days) || days <= 0) { Alert.alert('Error', 'Please enter valid number of days'); return; }
    confirmAction('Confirm Suspension', `Suspend user for ${days} days?`, 'Suspend', async () => {
      const result = await adminService.suspendUser(selectedUser.user_id, days, actionReason || undefined);
      if (result.success) { Alert.alert('Success', 'User suspended'); setActionModalVisible(false); setActionReason(''); handleSearch(); }
      else Alert.alert('Error', result.error || 'Failed to suspend user');
    }, true);
  };

  const handleBanUser = () => {
    if (!selectedUser) return;
    confirmAction('Confirm Ban', 'Are you sure you want to permanently ban this user?', 'Ban', async () => {
      const result = await adminService.banUser(selectedUser.user_id, actionReason || undefined);
      if (result.success) { Alert.alert('Success', 'User banned'); setActionModalVisible(false); setActionReason(''); handleSearch(); }
      else Alert.alert('Error', result.error || 'Failed to ban user');
    }, true);
  };

  const handleUnbanUser = () => {
    if (!selectedUser) return;
    confirmAction('Confirm Unban', 'Are you sure you want to unban this user?', 'Unban', async () => {
      const result = await adminService.unbanUser(selectedUser.user_id);
      if (result.success) { Alert.alert('Success', 'User unbanned'); setActionModalVisible(false); handleSearch(); }
      else Alert.alert('Error', result.error || 'Failed to unban user');
    });
  };

  const handleUnsuspendUser = () => {
    if (!selectedUser) return;
    confirmAction('Confirm Unsuspend', 'Are you sure you want to remove suspension from this user?', 'Unsuspend', async () => {
      const result = await adminService.unsuspendUser(selectedUser.user_id);
      if (result.success) { Alert.alert('Success', 'User suspension removed'); setActionModalVisible(false); handleSearch(); }
      else Alert.alert('Error', result.error || 'Failed to unsuspend user');
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    confirmAction(
      'Confirm Delete',
      'Are you sure you want to permanently delete this user and all their data? This action cannot be undone.',
      'Delete',
      async () => {
        const result = await adminService.deleteUser(selectedUser.user_id);
        if (result.success) { Alert.alert('Success', 'User deleted'); setActionModalVisible(false); handleSearch(); }
        else Alert.alert('Error', result.error || 'Failed to delete user');
      },
      true
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
      <AdminHeader title="User Management" showBack />

      {/* Search */}
      <Box
        row
        px="lg"
        py="md"
        bg={STATIC.white}
        gap="sm"
        borderWidth={1}
        borderColor={GRAY[300]}
        style={{ borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: GRAY[100],
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            fontSize: 14,
          }}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by username or email..."
          placeholderTextColor={GRAY[500]}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={{
            backgroundColor: BRAND.accent,
            width: 40,
            height: 40,
            borderRadius: RADIUS.md,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="search" size={20} color={STATIC.white} />
        </TouchableOpacity>
      </Box>

      {loading ? (
        <AdminLoadingState />
      ) : users.length === 0 ? (
        <Box flex={1} center>
          <Ionicons name="people" size={64} color={GRAY[350]} />
          <Text size="lg" color={GRAY[600]} style={{ marginTop: SPACING.lg }}>No users found</Text>
        </Box>
      ) : (
        <FlatList
          data={users}
          renderItem={({ item }) => <UserCard user={item} onPress={handleUserPress} />}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={{ padding: SPACING.md }}
        />
      )}

      <UserDetailModal
        visible={userModalVisible}
        user={selectedUser}
        onClose={() => setUserModalVisible(false)}
        onManage={openActionModal}
      />

      <UserActionModal
        visible={actionModalVisible}
        user={selectedUser}
        suspensionDays={suspensionDays}
        actionReason={actionReason}
        onClose={() => setActionModalVisible(false)}
        onSuspensionDaysChange={setSuspensionDays}
        onActionReasonChange={setActionReason}
        onWarn={handleWarnUser}
        onSuspend={handleSuspendUser}
        onUnsuspend={handleUnsuspendUser}
        onBan={handleBanUser}
        onUnban={handleUnbanUser}
        onDelete={handleDeleteUser}
      />
    </SafeAreaView>
  );
};

export default AdminUsersScreen;
