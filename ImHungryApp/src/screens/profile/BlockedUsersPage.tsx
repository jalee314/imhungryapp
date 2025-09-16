import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface BlockedUser {
  id: string;
  name: string;
  isBlocked: boolean;
}

const BlockedUsersPage = () => {
  const navigation = useNavigation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    { id: '1', name: 'Jason Lee', isBlocked: true },
    { id: '2', name: 'Albert Chung', isBlocked: true },
    { id: '3', name: 'Kevin Hu', isBlocked: true },
  ]);


  const toggleBlockStatus = (userId: string) => {
    setBlockedUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user
      )
    );
  };

  const renderUserItem = (user: BlockedUser, index: number) => (
    <View key={user.id}>
      <TouchableOpacity 
        style={styles.userItem} 
        onPress={() => toggleBlockStatus(user.id)}
      >
        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.checkbox}>
          {user.isBlocked && (
            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
      {index < blockedUsers.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Block Users</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.updateText}>Update</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.userList}>
          {blockedUsers.map((user, index) => renderUserItem(user, index))}
        </View>
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
    paddingHorizontal: 10,
  },
  userList: {
    width: 373,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 16,
    width: 373,
  },
  userName: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    backgroundColor: '#FFA05C',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: 373,
    height: 0.5,
    backgroundColor: '#C1C1C1',
  },
});

export default BlockedUsersPage;
