import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { STATIC, GRAY, SPACING, RADIUS, SHADOW, SEMANTIC, BRAND } from '../../../ui/alf';
import type { UserProfile } from '../../../services/admin/types';

interface UserCardProps {
  user: UserProfile;
  onPress: (user: UserProfile) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(user)}
    style={{
      backgroundColor: STATIC.white,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      ...SHADOW.md,
    }}
  >
    <Box row justify="space-between" align="flex-start" mb="md">
      <Box>
        <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.xs }}>
          {user.display_name}
        </Text>
        <Text size="sm" color={GRAY[600]}>{user.email}</Text>
      </Box>
      <Box gap="xs">
        {user.is_admin && <Badge label="ADMIN" bg={SEMANTIC.success} />}
        {user.is_banned && <Badge label="BANNED" bg={SEMANTIC.error} />}
        {user.is_suspended && <Badge label="SUSPENDED" bg="#FF5722" />}
      </Box>
    </Box>

    {user.location_city && (
      <Box row align="center" mb="xs" gap="sm">
        <Ionicons name="location" size={14} color={GRAY[600]} />
        <Text size="sm" color={GRAY[600]}>{user.location_city}</Text>
      </Box>
    )}
    <Box row align="center" mb="xs" gap="sm">
      <Ionicons name="calendar" size={14} color={GRAY[600]} />
      <Text size="sm" color={GRAY[600]}>Joined {new Date(user.created_at).toLocaleDateString()}</Text>
    </Box>
    {user.warning_count > 0 && (
      <Box row align="center" mb="xs" gap="sm">
        <Ionicons name="warning" size={14} color={SEMANTIC.warning} />
        <Text size="sm" color={GRAY[600]}>{user.warning_count} warnings</Text>
      </Box>
    )}
  </TouchableOpacity>
);

const Badge: React.FC<{ label: string; bg: string }> = ({ label, bg }) => (
  <Box px="sm" py="xs" rounded="md" bg={bg}>
    <Text size="2xs" weight="bold" color={STATIC.white}>{label}</Text>
  </Box>
);

export default UserCard;
