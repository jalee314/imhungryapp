/**
 * BlockedUsersPage.tsx
 *
 * Blocked users management screen using React Query.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useBlockedUsersQuery, BlockedUser } from '#/state/queries';
import { tokens, atoms as a } from '#/ui';

const BlockedUsersPage = () => {
  const navigation = useNavigation();
  const { blockedUsers, isLoading, unblockMultiple, isUnblocking } = useBlockedUsersQuery();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Initialize selected users when data loads
  useEffect(() => {
    if (blockedUsers.length > 0) {
      setSelectedUsers(new Set(blockedUsers.map((user) => user.blocked_user_id)));
    }
  }, [blockedUsers]);

  const toggleUserSelection = (blockedUserId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blockedUserId)) {
        newSet.delete(blockedUserId);
      } else {
        newSet.add(blockedUserId);
      }
      return newSet;
    });
  };

  const handleUpdate = async () => {
    const usersToUnblock = blockedUsers.filter(
      (user) => !selectedUsers.has(user.blocked_user_id)
    );

    if (usersToUnblock.length === 0) {
      Alert.alert('No Changes', 'No users selected for unblocking');
      return;
    }

    try {
      const { successCount } = await unblockMultiple(
        usersToUnblock.map((u) => u.blocked_user_id)
      );

      if (successCount > 0) {
        Alert.alert('Success', `${successCount} user(s) have been unblocked`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to unblock users');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unblock users');
    }
  };

  const renderUserItem = (user: BlockedUser, index: number) => {
    const isSelected = selectedUsers.has(user.blocked_user_id);

    return (
      <View key={user.block_id}>
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => toggleUserSelection(user.blocked_user_id)}
          activeOpacity={1}
        >
          <Text style={styles.userName}>
            {user.blocked_user.display_name || 'Unknown User'}
          </Text>
          <TouchableOpacity
            style={[styles.checkbox, isSelected ? styles.checkedBox : styles.uncheckedBox]}
            onPress={() => toggleUserSelection(user.blocked_user_id)}
            activeOpacity={1}
          >
            {isSelected && (
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
        {index < blockedUsers.length - 1 && <View style={styles.separator} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Block Users</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={isUnblocking}>
          <Text style={[styles.updateText, isUnblocking && styles.disabledText]}>
            {isUnblocking ? 'Updating...' : 'Update'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA05C" />
            <Text style={styles.loadingText}>Loading blocked users...</Text>
          </View>
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
    ...a.flex_1,
    ...a.bg_white,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.items_center,
    paddingHorizontal: tokens.space.xl,
    paddingVertical: 15,
  },
  cancelText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.md,
    ...a.text_black,
    ...a.flex_1,
    textAlign: 'left',
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.bold,
    fontSize: tokens.fontSize.md,
    ...a.text_black,
    ...a.flex_1,
    ...a.text_center,
  },
  updateText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.bold,
    fontSize: tokens.fontSize.md,
    ...a.text_primary_500,
    ...a.flex_1,
    ...a.text_right,
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    ...a.flex_1,
    ...a.items_center,
    paddingHorizontal: tokens.space.xl,
  },
  userList: {
    ...a.w_full,
    borderWidth: 1,
    ...a.border_gray_200,
    ...a.rounded_lg,
  },
  userItem: {
    ...a.flex_row,
    ...a.items_center,
    paddingVertical: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
  },
  userName: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.sm,
    ...a.text_black,
    ...a.flex_1,
    marginRight: tokens.space.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    ...a.rounded_xs,
    ...a.justify_center,
    ...a.items_center,
  },
  checkedBox: {
    ...a.bg_primary_500,
  },
  uncheckedBox: {
    ...a.bg_transparent,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  loadingContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: tokens.space._5xl,
  },
  loadingText: {
    marginTop: tokens.space.lg,
    fontSize: tokens.fontSize.md,
    ...a.text_gray_600,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    ...a.flex_1,
    ...a.justify_center,
    ...a.items_center,
    paddingVertical: tokens.space._5xl,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    ...a.text_gray_600,
    ...a.text_center,
    marginBottom: tokens.space.sm,
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.semibold,
  },
  emptySubtext: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_400,
    ...a.text_center,
    fontFamily: 'Inter',
  },
  separator: {
    ...a.w_full,
    height: 0.5,
    ...a.bg_gray_200,
    alignSelf: 'center',
  },
});

export default BlockedUsersPage;
