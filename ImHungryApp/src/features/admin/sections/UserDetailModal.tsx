import React from 'react';
import { Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, BORDER_WIDTH } from '../../../ui/alf';
import type { UserProfile } from '../types';

interface UserDetailModalProps {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onManage: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ visible, user, onClose, onManage }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <Box flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
      <Box bg={STATIC.white} rounded="xl" p="xl" maxH="80%"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <Box row justify="space-between" align="center" mb="xl">
          <Text size="xl" weight="bold" color={STATIC.black}>User Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={STATIC.black} />
          </TouchableOpacity>
        </Box>

        <Box mb="xl">
          <DetailField label="Username" value={user?.display_name} />
          <DetailField label="Email" value={user?.email} />
          {user?.location_city && <DetailField label="Location" value={user.location_city} />}
          <DetailField label="Joined" value={user ? new Date(user.created_at).toLocaleString() : undefined} />
          <DetailField label="Warnings" value={String(user?.warning_count || 0)} />
          {user?.ban_reason && <DetailField label="Ban Reason" value={user.ban_reason} />}
          {user?.suspended_reason && <DetailField label="Suspension Reason" value={user.suspended_reason} />}
        </Box>

        <TouchableOpacity
          onPress={onManage}
          style={{
            backgroundColor: BRAND.accent,
            paddingVertical: SPACING.md,
            borderRadius: RADIUS.md,
            alignItems: 'center',
          }}
        >
          <Text size="md" weight="semibold" color={STATIC.white}>Manage User</Text>
        </TouchableOpacity>
      </Box>
    </Box>
  </Modal>
);

const DetailField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <>
    <Text size="xs" color={GRAY[600]} style={{ marginTop: SPACING.md, marginBottom: SPACING.xs }}>
      {label}
    </Text>
    <Text size="md" color={STATIC.black}>{value ?? '—'}</Text>
  </>
);

export default UserDetailModal;
