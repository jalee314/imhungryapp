import React from 'react';
import { Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, BORDER_WIDTH, SEMANTIC } from '../../../ui/alf';
import type { UserProfile } from '../types';

interface UserActionModalProps {
  visible: boolean;
  user: UserProfile | null;
  suspensionDays: string;
  actionReason: string;
  onClose: () => void;
  onSuspensionDaysChange: (text: string) => void;
  onActionReasonChange: (text: string) => void;
  onWarn: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onBan: () => void;
  onUnban: () => void;
  onDelete: () => void;
}

const UserActionModal: React.FC<UserActionModalProps> = ({
  visible,
  user,
  suspensionDays,
  actionReason,
  onClose,
  onSuspensionDaysChange,
  onActionReasonChange,
  onWarn,
  onSuspend,
  onUnsuspend,
  onBan,
  onUnban,
  onDelete,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <Box flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
      <Box bg={STATIC.white} rounded="xl" p="xl" maxH="80%"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <Box row justify="space-between" align="center" mb="xl">
          <Text size="xl" weight="bold" color={STATIC.black}>Manage User</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={STATIC.black} />
          </TouchableOpacity>
        </Box>

        <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.xs }}>
          {user?.display_name}
        </Text>

        <Box gap="md" mt="lg">
          <ActionBtn label="Warn User" bg={SEMANTIC.warning} onPress={onWarn} />

          <Box direction="row" gap="md">
            <TextInput
              style={{
                borderWidth: BORDER_WIDTH.thin,
                borderColor: GRAY[300],
                borderRadius: RADIUS.md,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.md,
                width: 80,
                textAlign: 'center',
              }}
              value={suspensionDays}
              onChangeText={onSuspensionDaysChange}
              keyboardType="number-pad"
              placeholder="Days"
            />
            <ActionBtn
              label={user?.is_suspended ? 'Already Suspended' : 'Suspend User'}
              bg="#FF5722"
              onPress={onSuspend}
              disabled={user?.is_suspended}
              style={{ flex: 1 }}
            />
          </Box>

          {user?.is_suspended && (
            <ActionBtn label="Remove Suspension" bg={SEMANTIC.success} onPress={onUnsuspend} />
          )}

          <TextInput
            style={{
              borderWidth: BORDER_WIDTH.thin,
              borderColor: GRAY[300],
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            value={actionReason}
            onChangeText={onActionReasonChange}
            placeholder="Reason for ban/suspension (optional)"
            multiline
          />

          {user?.is_banned ? (
            <ActionBtn label="Unban User" bg={SEMANTIC.success} onPress={onUnban} />
          ) : (
            <ActionBtn label="Ban User" bg={STATIC.black} onPress={onBan} />
          )}

          <ActionBtn label="Delete User" bg={SEMANTIC.error} onPress={onDelete} />
        </Box>
      </Box>
    </Box>
  </Modal>
);

const ActionBtn: React.FC<{
  label: string;
  bg: string;
  onPress: () => void;
  disabled?: boolean;
  style?: Record<string, any>;
}> = ({ label, bg, onPress, disabled, style: extra }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        backgroundColor: bg,
        opacity: disabled ? 0.5 : 1,
      },
      extra,
    ]}
  >
    <Text size="sm" weight="semibold" color={STATIC.white}>{label}</Text>
  </TouchableOpacity>
);

export default UserActionModal;
