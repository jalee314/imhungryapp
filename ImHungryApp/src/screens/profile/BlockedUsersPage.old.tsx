import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { getBlockedUsers, unblockUser } from '../../services/blockService';

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

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const users = await getBlockedUsers();
      setBlockedUsers(users);
      // Initialize all users as selected (checked) by default
      setSelectedUsers(new Set(users.map(user => user.blocked_user_id)));
    } catch (error) {
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (blockedUserId: string) => {
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

  const handleUpdate = async () => {
    const usersToUnblock = blockedUsers.filter(user => !selectedUsers.has(user.blocked_user_id));
    
    if (usersToUnblock.length === 0) {
      Alert.alert('No Changes', 'No users selected for unblocking');
      return;
    }

    try {
      // Unblock all users who are NOT selected (unchecked)
      const unblockPromises = usersToUnblock.map(user => unblockUser(user.blocked_user_id));
      const results = await Promise.all(unblockPromises);
      
      const successCount = results.filter(result => result.success).length;
      
      if (successCount > 0) {
        // Remove successfully unblocked users from the list
        setBlockedUsers(prevUsers => 
          prevUsers.filter(user => selectedUsers.has(user.blocked_user_id))
        );
        
        // Update selected users to only include remaining blocked users
        setSelectedUsers(new Set(blockedUsers.filter(user => selectedUsers.has(user.blocked_user_id)).map(user => user.blocked_user_id)));
        
        Alert.alert('Success', `${successCount} user(s) have been unblocked`, [
          { text: 'OK', onPress: () => navigation.goBack() }
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
        <TouchableOpacity onPress={handleUpdate}>
          <Text style={styles.updateText}>Update</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
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
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    flex: 1,
    textAlign: 'left',
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  updateText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#FFA05C',
    flex: 1,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userList: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D7D7D7',
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
    color: '#000000',
    flex: 1,
    marginRight: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#FFA05C',
  },
  uncheckedBox: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  separator: {
    width: '100%',
    height: 0.5,
    backgroundColor: '#C1C1C1',
    alignSelf: 'center',
  },
});

export default BlockedUsersPage;
