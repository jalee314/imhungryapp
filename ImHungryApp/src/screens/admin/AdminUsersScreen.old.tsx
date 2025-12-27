import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminService, UserProfile } from '../../services/adminService';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

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

  // Load all users on mount
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      // Get recent users
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
    if (!searchQuery.trim()) {
      loadAllUsers();
      return;
    }

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

  const handleWarnUser = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'Confirm Warn',
      'Are you sure you want to warn this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Warn',
          onPress: async () => {
            const result = await adminService.warnUser(selectedUser.user_id);
            if (result.success) {
              Alert.alert('Success', 'User warned');
              setActionModalVisible(false);
              handleSearch();
            } else {
              Alert.alert('Error', result.error || 'Failed to warn user');
            }
          },
        },
      ]
    );
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    const days = parseInt(suspensionDays);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Error', 'Please enter valid number of days');
      return;
    }

    Alert.alert(
      'Confirm Suspension',
      `Suspend user for ${days} days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.suspendUser(
              selectedUser.user_id,
              days,
              actionReason || undefined
            );
            if (result.success) {
              Alert.alert('Success', 'User suspended');
              setActionModalVisible(false);
              setActionReason('');
              handleSearch();
            } else {
              Alert.alert('Error', result.error || 'Failed to suspend user');
            }
          },
        },
      ]
    );
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'Confirm Ban',
      'Are you sure you want to permanently ban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.banUser(
              selectedUser.user_id,
              actionReason || undefined
            );
            if (result.success) {
              Alert.alert('Success', 'User banned');
              setActionModalVisible(false);
              setActionReason('');
              handleSearch();
            } else {
              Alert.alert('Error', result.error || 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'Confirm Unban',
      'Are you sure you want to unban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            const result = await adminService.unbanUser(selectedUser.user_id);
            if (result.success) {
              Alert.alert('Success', 'User unbanned');
              setActionModalVisible(false);
              handleSearch();
            } else {
              Alert.alert('Error', result.error || 'Failed to unban user');
            }
          },
        },
      ]
    );
  };

  const handleUnsuspendUser = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'Confirm Unsuspend',
      'Are you sure you want to remove suspension from this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsuspend',
          onPress: async () => {
            const result = await adminService.unsuspendUser(selectedUser.user_id);
            if (result.success) {
              Alert.alert('Success', 'User suspension removed');
              setActionModalVisible(false);
              handleSearch();
            } else {
              Alert.alert('Error', result.error || 'Failed to unsuspend user');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to permanently delete this user and all their data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.deleteUser(selectedUser.user_id);
            if (result.success) {
              Alert.alert('Success', 'User deleted');
              setActionModalVisible(false);
              handleSearch();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleUserPress(item)}>
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userName}>{item.display_name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.badges}>
          {item.is_admin && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Text style={styles.badgeText}>ADMIN</Text>
            </View>
          )}
          {item.is_banned && (
            <View style={[styles.badge, styles.bannedBadge]}>
              <Text style={styles.badgeText}>BANNED</Text>
            </View>
          )}
          {item.is_suspended && (
            <View style={[styles.badge, styles.suspendedBadge]}>
              <Text style={styles.badgeText}>SUSPENDED</Text>
            </View>
          )}
        </View>
      </View>

      {item.location_city && (
        <View style={styles.userInfo}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.userInfoText}>{item.location_city}</Text>
        </View>
      )}

      <View style={styles.userInfo}>
        <Ionicons name="calendar" size={14} color="#666" />
        <Text style={styles.userInfoText}>
          Joined {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {item.warning_count > 0 && (
        <View style={styles.userInfo}>
          <Ionicons name="warning" size={14} color="#FF9800" />
          <Text style={styles.userInfoText}>{item.warning_count} warnings</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by username or email..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA05C" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* User Info Modal */}
      <Modal
        visible={userModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>{selectedUser?.display_name}</Text>

              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{selectedUser?.email}</Text>

              {selectedUser?.location_city && (
                <>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedUser.location_city}</Text>
                </>
              )}

              <Text style={styles.detailLabel}>Joined</Text>
              <Text style={styles.detailValue}>
                {selectedUser && new Date(selectedUser.created_at).toLocaleString()}
              </Text>

              <Text style={styles.detailLabel}>Warnings</Text>
              <Text style={styles.detailValue}>{selectedUser?.warning_count || 0}</Text>

              {selectedUser?.ban_reason && (
                <>
                  <Text style={styles.detailLabel}>Ban Reason</Text>
                  <Text style={styles.detailValue}>{selectedUser.ban_reason}</Text>
                </>
              )}

              {selectedUser?.suspended_reason && (
                <>
                  <Text style={styles.detailLabel}>Suspension Reason</Text>
                  <Text style={styles.detailValue}>{selectedUser.suspended_reason}</Text>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.manageButton} onPress={openActionModal}>
              <Text style={styles.manageButtonText}>Manage User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage User</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{selectedUser?.display_name}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.warnButton]}
                onPress={handleWarnUser}
              >
                <Text style={styles.actionButtonText}>Warn User</Text>
              </TouchableOpacity>

              <View style={styles.suspendSection}>
                <TextInput
                  style={styles.daysInput}
                  value={suspensionDays}
                  onChangeText={setSuspensionDays}
                  keyboardType="number-pad"
                  placeholder="Days"
                />
                <TouchableOpacity
                  style={[styles.actionButton, styles.suspendButton]}
                  onPress={handleSuspendUser}
                  disabled={selectedUser?.is_suspended}
                >
                  <Text style={styles.actionButtonText}>
                    {selectedUser?.is_suspended ? 'Already Suspended' : 'Suspend User'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedUser?.is_suspended && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.unsuspendButton]}
                  onPress={handleUnsuspendUser}
                >
                  <Text style={styles.actionButtonText}>Remove Suspension</Text>
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.reasonInput}
                value={actionReason}
                onChangeText={setActionReason}
                placeholder="Reason for ban/suspension (optional)"
                multiline
              />

              {selectedUser?.is_banned ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.unbanButton]}
                  onPress={handleUnbanUser}
                >
                  <Text style={styles.actionButtonText}>Unban User</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.banButton]}
                  onPress={handleBanUser}
                >
                  <Text style={styles.actionButtonText}>Ban User</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteUser}
              >
                <Text style={styles.actionButtonText}>Delete User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#FFA05C',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  listContent: {
    padding: 12,
  },
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  badges: {
    flexDirection: 'column',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: '#4CAF50',
  },
  bannedBadge: {
    backgroundColor: '#F44336',
  },
  suspendedBadge: {
    backgroundColor: '#FF5722',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  userDetails: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
  },
  manageButton: {
    backgroundColor: '#FFA05C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  warnButton: {
    backgroundColor: '#FF9800',
  },
  suspendButton: {
    backgroundColor: '#FF5722',
    flex: 1,
  },
  unsuspendButton: {
    backgroundColor: '#4CAF50',
  },
  banButton: {
    backgroundColor: '#000',
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  suspendSection: {
    flexDirection: 'row',
    gap: 12,
  },
  daysInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: 80,
    textAlign: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default AdminUsersScreen;

