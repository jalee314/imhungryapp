import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import SkeletonLoader from '../../components/SkeletonLoader';
import { getBlockedUsers, unblockUser } from '../../services/blockService';
import { BRAND, STATIC, GRAY } from '../../ui/alf';

interface BlockedUser {
  block_id: string;
  blocked_user_id: string;
  reason_code_id: string;
  reason_text: string | null;
  created_at: string;
  blocked_user: {
    user_id: string;
    display_name: string | null;
    profile_photo: string | null;
  };
}

const BlockedUsersPage = () => {
  const navigation = useNavigation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const users = await getBlockedUsers();
      setBlockedUsers(users);
      setSelectedUsers(new Set());
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (blockedUserId: string) => {
    if (!isEditing) {
      return;
    }

    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockedUserId)) {
        newSet.delete(blockedUserId);
      } else {
        newSet.add(blockedUserId);
      }
      return newSet;
    });
  };

  const enterEditMode = () => {
    setSelectedUsers(new Set());
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setSelectedUsers(new Set());
    setIsEditing(false);
  };

  const performUnblock = async (usersToUnblock: BlockedUser[]) => {
    try {
      setIsSubmitting(true);
      const unblockPromises = usersToUnblock.map(async user => ({
        blockedUserId: user.blocked_user_id,
        result: await unblockUser(user.blocked_user_id),
      }));
      const results = await Promise.all(unblockPromises);

      const successfulIds = results.filter(({ result }) => result.success).map(({ blockedUserId }) => blockedUserId);
      const successfulIdSet = new Set(successfulIds);
      const successCount = successfulIds.length;

      if (successCount > 0) {
        setBlockedUsers(prevUsers => prevUsers.filter(user => !successfulIdSet.has(user.blocked_user_id)));
        setSelectedUsers(prevUsers => new Set([...prevUsers].filter(userId => !successfulIdSet.has(userId))));
        setIsEditing(false);

        const failedCount = usersToUnblock.length - successCount;
        const successMessage = failedCount === 0
          ? `${successCount} user(s) have been unblocked`
          : `${successCount} user(s) unblocked, ${failedCount} failed`;

        Alert.alert('Success', successMessage, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to unblock users');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unblock users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblockPress = () => {
    const usersToUnblock = blockedUsers.filter(user => selectedUsers.has(user.blocked_user_id));

    if (usersToUnblock.length === 0) {
      Alert.alert('No Users Selected', 'Select at least one user to unblock');
      return;
    }

    const selectedCount = usersToUnblock.length;
    const userLabel = selectedCount === 1 ? 'user' : 'users';

    Alert.alert(
      'Confirm Unblock',
      `Are you sure you want to unblock ${selectedCount} ${userLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: () => {
            void performUnblock(usersToUnblock);
          }
        },
      ],
    );
  };

  const handleLeftAction = () => {
    if (isSubmitting) {
      return;
    }

    if (isEditing) {
      cancelEditMode();
      return;
    }

    navigation.goBack();
  };

  const handleRightAction = () => {
    if (isSubmitting || blockedUsers.length === 0) {
      return;
    }

    if (isEditing) {
      handleUnblockPress();
      return;
    }

    enterEditMode();
  };

  const renderUserItem = (user: BlockedUser, index: number) => {
    const isSelected = selectedUsers.has(user.blocked_user_id);

    return (
      <View key={user.block_id}>
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => toggleUserSelection(user.blocked_user_id)}
          activeOpacity={isEditing ? 0.7 : 1}
        >
          <Text style={[styles.userName, !isEditing && styles.userNameReadOnly]}>
            {user.blocked_user.display_name || 'Unknown User'}
          </Text>
          {isEditing && (
            <TouchableOpacity
              style={[styles.checkbox, isSelected ? styles.checkedBox : styles.uncheckedBox]}
              onPress={() => toggleUserSelection(user.blocked_user_id)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <MaterialCommunityIcons name="check" size={16} color={STATIC.white} />
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {index < blockedUsers.length - 1 && <View style={styles.separator} />}
      </View>
    );
  };

  const renderLoadingList = () => (
    <View style={styles.userList}>
      {[0, 1, 2, 3, 4].map((item, index) => (
        <View key={`blocked-user-skeleton-${item}`}>
          <View style={styles.userItem}>
            <SkeletonLoader width="58%" height={14} borderRadius={4} />
          </View>
          {index < 4 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );

  const rightActionLabel = isEditing ? 'Unblock' : 'Edit';
  const rightActionDisabled = isSubmitting || blockedUsers.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeftAction} disabled={isSubmitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Blocked Users</Text>
        <TouchableOpacity onPress={handleRightAction} disabled={rightActionDisabled}>
          <Text style={[styles.updateText, rightActionDisabled && styles.disabledActionText]}>
            {rightActionLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          renderLoadingList()
        ) : blockedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No blocked users</Text>
            <Text style={styles.emptySubtext}>You haven't blocked any users yet</Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {blockedUsers.map((user, index) => renderUserItem(user, index))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cancelText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: STATIC.black,
    flex: 1,
    textAlign: 'left',
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: STATIC.black,
    flex: 1,
    textAlign: 'center',
  },
  updateText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: BRAND.accent,
    flex: 1,
    textAlign: 'right',
  },
  disabledActionText: {
    color: GRAY[475],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userList: {
    width: '100%',
    borderWidth: 1,
    borderColor: GRAY[325],
    borderRadius: 14,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  userName: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: STATIC.black,
    flex: 1,
    marginRight: 16,
  },
  userNameReadOnly: {
    marginRight: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: BRAND.accent,
  },
  uncheckedBox: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GRAY[350],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: GRAY[600],
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: GRAY[475],
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  separator: {
    width: '100%',
    height: 0.5,
    backgroundColor: GRAY[350],
    alignSelf: 'center',
  },
});

export default BlockedUsersPage;
