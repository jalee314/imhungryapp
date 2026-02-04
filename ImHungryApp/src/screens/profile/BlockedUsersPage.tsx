import React, { useState, useEffect } from 'react';
import { SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';
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
      const unblockPromises = usersToUnblock.map(user => unblockUser(user.blocked_user_id));
      const results = await Promise.all(unblockPromises);
      
      const successCount = results.filter(result => result.success).length;
      
      if (successCount > 0) {
        setBlockedUsers(prevUsers => 
          prevUsers.filter(user => selectedUsers.has(user.blocked_user_id))
        );
        
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
      <Box key={user.block_id}>
        <Pressable 
          row
          alignCenter
          py="2xl"
          px="xl"
          onPress={() => toggleUserSelection(user.blocked_user_id)}
          activeOpacity={1}
        >
          <Text 
            size="md" 
            color="text" 
            flex={1}
            mr="xl"
            style={{ fontFamily: typography.fontFamily.regular }}
          >
            {user.blocked_user.display_name || 'Unknown User'}
          </Text>
          <Pressable 
            onPress={() => toggleUserSelection(user.blocked_user_id)}
            activeOpacity={1}
            width={20}
            height={20}
            rounded="xs"
            center
            style={{
              backgroundColor: isSelected ? colors.primaryDark : 'transparent',
              borderWidth: isSelected ? 0 : 1,
              borderColor: '#CCCCCC',
            }}
          >
            {isSelected && (
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
            )}
          </Pressable>
        </Pressable>
        {index < blockedUsers.length - 1 && (
          <Box width="100%" height={0.5} style={{ backgroundColor: '#C1C1C1', alignSelf: 'center' }} />
        )}
      </Box>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Box row justifyBetween alignCenter px="2xl" py="l">
        <Pressable onPress={() => navigation.goBack()}>
          <Text 
            size="base" 
            color="text" 
            flex={1}
            style={{ fontFamily: typography.fontFamily.regular, textAlign: 'left' }}
          >
            Cancel
          </Text>
        </Pressable>
        <Text 
          size="base" 
          weight="bold" 
          color="text" 
          flex={1}
          align="center"
          style={{ fontFamily: typography.fontFamily.regular }}
        >
          Block Users
        </Text>
        <Pressable onPress={handleUpdate}>
          <Text 
            size="base" 
            weight="bold" 
            color="primaryDark" 
            flex={1}
            style={{ fontFamily: typography.fontFamily.regular, textAlign: 'right' }}
          >
            Update
          </Text>
        </Pressable>
      </Box>

      {/* Content */}
      <Box flex={1} alignCenter px="2xl">
        {loading ? (
          <Box flex={1} center py="7xl">
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text 
              size="base" 
              color="textMuted" 
              mt="xl"
              style={{ fontFamily: typography.fontFamily.regular }}
            >
              Loading blocked users...
            </Text>
          </Box>
        ) : blockedUsers.length === 0 ? (
          <Box flex={1} center py="7xl">
            <Text 
              size="lg" 
              weight="semiBold" 
              color="textMuted" 
              align="center"
              mb="m"
              style={{ fontFamily: typography.fontFamily.regular }}
            >
              No blocked users
            </Text>
            <Text 
              size="md" 
              color="textMuted" 
              align="center"
              style={{ fontFamily: typography.fontFamily.regular }}
            >
              You haven't blocked any users yet
            </Text>
          </Box>
        ) : (
          <Box 
            width="100%"
            rounded="lg"
            style={{
              borderWidth: 1,
              borderColor: '#D7D7D7',
            }}
          >
            {blockedUsers.map((user, index) => renderUserItem(user, index))}
          </Box>
        )}
      </Box>
    </SafeAreaView>
  );
};

export default BlockedUsersPage;
