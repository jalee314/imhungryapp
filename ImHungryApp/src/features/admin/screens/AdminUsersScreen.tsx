/**
 * screens/admin/AdminUsersScreen.tsx
 *
 * Admin user management screen - refactored to use React Query.
 * Uses useAdminUsersQuery + useAdminUserMutations for server state.
 */

import React, { useState, useCallback } from 'react'
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
} from 'react-native'
import { tokens, atoms as a } from '#/ui'
import { useNavigation } from '@react-navigation/native'
import { UserProfile } from '#/services/adminService'
import { Ionicons } from '@expo/vector-icons'
import { useAdminUsersQuery, useAdminUserMutations } from '#/state/queries/admin'

const AdminUsersScreen: React.FC = () => {
  const navigation = useNavigation()
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [suspensionDays, setSuspensionDays] = useState('7')
  const [actionReason, setActionReason] = useState('')

  // React Query hooks
  const { users, isLoading, search: searchUsers, refetch } = useAdminUsersQuery({ searchQuery })
  const { warnUser, suspendUser, unsuspendUser, banUser, unbanUser, deleteUser } = useAdminUserMutations()

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      setSearchQuery('')
      refetch()
      return
    }
    setSearchQuery(searchInput)
  }, [searchInput, refetch])

  const handleUserPress = useCallback((user: UserProfile) => {
    setSelectedUser(user)
    setUserModalVisible(true)
  }, [])

  const openActionModal = () => {
    setUserModalVisible(false)
    setActionModalVisible(true)
  }

  const handleWarnUser = () => {
    if (!selectedUser) return

    Alert.alert(
      'Confirm Warn',
      'Are you sure you want to warn this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Warn',
          onPress: async () => {
            try {
              await warnUser.mutateAsync(selectedUser.user_id)
              Alert.alert('Success', 'User warned')
              setActionModalVisible(false)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to warn user')
            }
          },
        },
      ]
    )
  }

  const handleSuspendUser = () => {
    if (!selectedUser) return

    const days = parseInt(suspensionDays)
    if (isNaN(days) || days <= 0) {
      Alert.alert('Error', 'Please enter valid number of days')
      return
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
            try {
              await suspendUser.mutateAsync({
                userId: selectedUser.user_id,
                days,
                reason: actionReason || undefined,
              })
              Alert.alert('Success', 'User suspended')
              setActionModalVisible(false)
              setActionReason('')
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to suspend user')
            }
          },
        },
      ]
    )
  }

  const handleUnsuspendUser = () => {
    if (!selectedUser) return

    Alert.alert(
      'Confirm Unsuspend',
      'Are you sure you want to remove suspension from this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsuspend',
          onPress: async () => {
            try {
              await unsuspendUser.mutateAsync(selectedUser.user_id)
              Alert.alert('Success', 'User suspension removed')
              setActionModalVisible(false)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unsuspend user')
            }
          },
        },
      ]
    )
  }

  const handleBanUser = () => {
    if (!selectedUser) return

    Alert.alert(
      'Confirm Ban',
      'Are you sure you want to permanently ban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              await banUser.mutateAsync({
                userId: selectedUser.user_id,
                reason: actionReason || undefined,
              })
              Alert.alert('Success', 'User banned')
              setActionModalVisible(false)
              setActionReason('')
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to ban user')
            }
          },
        },
      ]
    )
  }

  const handleUnbanUser = () => {
    if (!selectedUser) return

    Alert.alert(
      'Confirm Unban',
      'Are you sure you want to unban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            try {
              await unbanUser.mutateAsync(selectedUser.user_id)
              Alert.alert('Success', 'User unbanned')
              setActionModalVisible(false)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unban user')
            }
          },
        },
      ]
    )
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to permanently delete this user and all their data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser.mutateAsync(selectedUser.user_id)
              Alert.alert('Success', 'User deleted')
              setActionModalVisible(false)
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user')
            }
          },
        },
      ]
    )
  }

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
  )

  const isActionLoading = warnUser.isPending || suspendUser.isPending || unsuspendUser.isPending ||
    banUser.isPending || unbanUser.isPending || deleteUser.isPending

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
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by username or email..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
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
                disabled={isActionLoading}
              >
                {warnUser.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Warn User</Text>
                )}
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
                  disabled={selectedUser?.is_suspended || isActionLoading}
                >
                  {suspendUser.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {selectedUser?.is_suspended ? 'Already Suspended' : 'Suspend User'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {selectedUser?.is_suspended && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.unsuspendButton]}
                  onPress={handleUnsuspendUser}
                  disabled={isActionLoading}
                >
                  {unsuspendUser.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Remove Suspension</Text>
                  )}
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
                  disabled={isActionLoading}
                >
                  {unbanUser.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Unban User</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.banButton]}
                  onPress={handleBanUser}
                  disabled={isActionLoading}
                >
                  {banUser.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Ban User</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteUser}
                disabled={isActionLoading}
              >
                {deleteUser.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Delete User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

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
  backButton: {
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  searchContainer: {
    ...a.flex_row,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    ...a.bg_white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: tokens.space.sm,
  },
  searchInput: {
    ...a.flex_1,
    ...a.bg_gray_100,
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    fontSize: tokens.fontSize.sm,
  },
  searchButton: {
    ...a.bg_primary_500,
    width: 40,
    height: 40,
    borderRadius: tokens.space.sm,
    ...a.justify_center,
    ...a.align_center,
  },
  loadingContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.align_center,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    ...a.text_gray_500,
    marginTop: tokens.space.lg,
  },
  listContent: {
    padding: tokens.space.md,
  },
  userCard: {
    ...a.bg_white,
    borderRadius: tokens.space.md,
    padding: tokens.space.lg,
    marginBottom: tokens.space.md,
    shadowColor: tokens.color.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    ...a.flex_row,
    ...a.justify_between,
    alignItems: 'flex-start',
    marginBottom: tokens.space.md,
  },
  userName: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    marginBottom: tokens.space.xs,
  },
  userEmail: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
  },
  badges: {
    flexDirection: 'column',
    gap: tokens.space.xs,
  },
  badge: {
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
    borderRadius: tokens.space.sm,
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
    ...a.text_white,
    fontSize: 10,
    fontWeight: tokens.fontWeight.bold,
  },
  userInfo: {
    ...a.flex_row,
    ...a.align_center,
    marginBottom: tokens.space.xs,
    gap: 6,
  },
  userInfoText: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_500,
  },
  modalOverlay: {
    ...a.flex_1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...a.justify_end,
  },
  modalContent: {
    ...a.bg_white,
    borderTopLeftRadius: tokens.space.xl,
    borderTopRightRadius: tokens.space.xl,
    padding: tokens.space.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    marginBottom: tokens.space.xl,
  },
  modalTitle: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
  },
  userDetails: {
    marginBottom: tokens.space.xl,
  },
  detailLabel: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_500,
    marginTop: tokens.space.md,
    marginBottom: tokens.space.xs,
  },
  detailValue: {
    fontSize: tokens.fontSize.md,
    ...a.text_black,
  },
  manageButton: {
    ...a.bg_primary_500,
    paddingVertical: tokens.space.md,
    borderRadius: tokens.space.sm,
    ...a.align_center,
  },
  manageButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.semibold,
  },
  actionButtons: {
    gap: tokens.space.md,
  },
  actionButton: {
    paddingVertical: tokens.space.md,
    borderRadius: tokens.space.sm,
    ...a.align_center,
  },
  warnButton: {
    backgroundColor: '#FF9800',
  },
  suspendButton: {
    backgroundColor: '#FF5722',
    ...a.flex_1,
  },
  unsuspendButton: {
    backgroundColor: '#4CAF50',
  },
  banButton: {
    ...a.bg_black,
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    ...a.text_white,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
  },
  suspendSection: {
    ...a.flex_row,
    gap: tokens.space.md,
  },
  daysInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    width: 80,
    ...a.text_center,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
})

export default AdminUsersScreen
