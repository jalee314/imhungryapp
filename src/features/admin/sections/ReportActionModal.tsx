import { Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import React from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import {
  BRAND,
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  SEMANTIC,
  ALPHA_COLORS,
  OPACITY,
} from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import type { Report } from '../types';

const STATUS_COLORS: Record<Report['status'], string> = {
  pending: BRAND.accent,
  review: SEMANTIC.info,
  resolved: SEMANTIC.success,
};

const STATUS_LABELS: Record<Report['status'], string> = {
  pending: 'Pending',
  review: 'In Review',
  resolved: 'Resolved',
};

interface ReportActionModalProps {
  visible: boolean;
  report: Report | null;
  reasonInput: string;
  suspensionDays: string;
  actionLoading: string | null;
  onClose: () => void;
  onReasonChange: (text: string) => void;
  onSuspensionDaysChange: (text: string) => void;
  onDismiss: () => void;
  onAction: (action: 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user') => void;
  onWorkflowStatusChange: (status: 'pending' | 'review') => void;
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};

const ReportActionModal: React.FC<ReportActionModalProps> = ({
  visible,
  report,
  reasonInput,
  suspensionDays,
  actionLoading,
  onClose,
  onReasonChange,
  onSuspensionDaysChange,
  onDismiss,
  onAction,
  onWorkflowStatusChange,
}) => {
  const isBusy = Boolean(actionLoading);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box flex={1} bg={ALPHA_COLORS.blackOverlay80} justify="flex-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Box
          bg={STATIC.white}
          rounded="xl"
          p="xl"
          maxH="85%"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          {/* Header */}
          <Box row justify="space-between" align="center" mb="lg" pb="md"
            borderWidth={BORDER_WIDTH.thin} borderColor={GRAY[300]}
            style={{ borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}
          >
            <Text size="xl" weight="bold" color={STATIC.black}>Review Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={STATIC.black} />
            </TouchableOpacity>
          </Box>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING['3xl'] }}>
            {/* Deal Preview */}
            {report?.deal?.image_url && (
              <Image
                source={{ uri: report.deal.image_url }}
                style={{ width: '100%', height: 200, borderRadius: RADIUS.lg, marginBottom: SPACING.lg }}
                resizeMode="cover"
              />
            )}

            <Box mb="xl">
              <Text size="lg" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.sm }}>
                {report?.deal?.title || 'Unknown Deal'}
              </Text>
              {report?.deal?.description && (
                <Text size="sm" color={GRAY[600]} style={{ marginBottom: SPACING.sm, lineHeight: 20 }}>
                  {report.deal.description}
                </Text>
              )}
              <Box row align="center" gap="sm" mt="xs">
                <Ionicons name="restaurant" size={16} color={GRAY[600]} />
                <Text size="sm" color={GRAY[600]}>{report?.deal?.restaurant_name || 'Unknown'}</Text>
              </Box>
            </Box>

            {/* Status Summary */}
            {report && (
              <Box mb="xl">
                <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.md }}>Status</Text>
                <Box direction="row" wrap="wrap" gap="sm">
                  <Box
                    borderWidth={1}
                    borderColor={STATUS_COLORS[report.status]}
                    rounded="full"
                    px="md"
                    py="xs"
                  >
                    <Text size="xs" weight="semibold" color={STATUS_COLORS[report.status]}
                      style={{ textTransform: 'uppercase' }}>
                      {STATUS_LABELS[report.status]}
                    </Text>
                  </Box>
                  {report.resolution_action && (
                    <Box borderWidth={1} borderColor={GRAY[400]} rounded="full" px="md" py="xs">
                      <Text size="xs" weight="semibold" color={GRAY[800]}
                        style={{ textTransform: 'uppercase' }}>
                        {report.resolution_action.replace(/_/g, ' ')}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Report Details */}
            <Box bg={GRAY[100]} p="lg" rounded="lg" mb="xl">
              <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.md }}>
                Report Details
              </Text>
              <DetailRow label="Reason" value={report?.reason_code?.description || report?.reason_code?.reason_code || 'Unknown'} />
              {report?.reason_text && (
                <Box my="sm">
                  <Text size="sm" weight="semibold" color={GRAY[600]}>Additional Info:</Text>
                  <Text size="sm" color={GRAY[800]} style={{ marginTop: SPACING.xs, lineHeight: 20 }}>
                    {report.reason_text}
                  </Text>
                </Box>
              )}
              <DetailRow label="Reported by" value={report?.reporter?.display_name || 'Anonymous'} />
              <DetailRow label="Uploader" value={report?.uploader?.display_name || 'Unknown'} />
              <DetailRow
                label="Date"
                value={report ? new Date(report.created_at).toLocaleString() : 'Unknown'}
              />
            </Box>

            {/* Timeline */}
            {report && (
              <Box rounded="lg" p="lg" borderWidth={BORDER_WIDTH.thin} borderColor={GRAY[200]} mb="xl">
                <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.md }}>
                  Timeline
                </Text>
                <TimelineRow label="Created" value={formatTimestamp(report.created_at)} />
                <TimelineRow label="Last Update" value={formatTimestamp(report.updated_at)} />
                <TimelineRow label="Resolved By" value={report.resolved_by || '—'} />
              </Box>
            )}

            {/* Workflow */}
            <Box rounded="lg" p="lg" borderWidth={BORDER_WIDTH.thin} borderColor={GRAY[200]} mb="xl">
              <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.md }}>
                Workflow
              </Text>
              <Text size="xs" color={GRAY[600]} style={{ marginBottom: SPACING.md }}>
                Move reports between queues before taking enforcement action.
              </Text>
              <Box direction="row" wrap="wrap" gap="md">
                {report?.status !== 'review' && (
                  <ActionButton
                    label="Mark In Review"
                    bg="#E3F2FD"
                    borderColor="#90CAF9"
                    textColor="#0D47A1"
                    loading={actionLoading === 'status-review'}
                    loaderColor="#0D47A1"
                    disabled={isBusy}
                    onPress={() => onWorkflowStatusChange('review')}
                  />
                )}
                {report?.status !== 'pending' && (
                  <ActionButton
                    label="Move to Pending"
                    bg="#ECEFF1"
                    borderColor="#B0BEC5"
                    textColor="#37474F"
                    loading={actionLoading === 'status-pending'}
                    loaderColor="#37474F"
                    disabled={isBusy}
                    onPress={() => onWorkflowStatusChange('pending')}
                  />
                )}
              </Box>
            </Box>

            {/* Enforcement Actions */}
            <Box mb="xl">
              <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.md }}>
                Actions
              </Text>

              <EnforcementButton
                icon={<Ionicons name="checkmark-circle" size={20} color={STATIC.white} />}
                label="Dismiss Report"
                bg={SEMANTIC.success}
                loading={actionLoading === 'dismiss'}
                disabled={isBusy}
                onPress={onDismiss}
              />
              <EnforcementButton
                icon={<Monicon name="uil:trash-alt" size={20} color={STATIC.white} />}
                label="Delete Deal"
                bg={SEMANTIC.error}
                loading={actionLoading === 'delete_deal'}
                disabled={isBusy}
                onPress={() => onAction('delete_deal')}
              />
              <EnforcementButton
                icon={<Ionicons name="warning" size={20} color={STATIC.white} />}
                label="Warn User"
                bg={SEMANTIC.warning}
                loading={actionLoading === 'warn_user'}
                disabled={isBusy}
                onPress={() => onAction('warn_user')}
              />

              <Box direction="row" gap="md" mb="md">
                <TextInput
                  style={{
                    borderWidth: BORDER_WIDTH.thin,
                    borderColor: GRAY[300],
                    borderRadius: RADIUS.md,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.md,
                    width: 80,
                    textAlign: 'center',
                    backgroundColor: STATIC.white,
                  }}
                  value={suspensionDays}
                  onChangeText={onSuspensionDaysChange}
                  keyboardType="number-pad"
                  placeholder="Days"
                  editable={!isBusy}
                />
                <EnforcementButton
                  icon={<Ionicons name="time" size={20} color={STATIC.white} />}
                  label="Suspend User"
                  bg="#FF5722"
                  loading={actionLoading === 'suspend_user'}
                  disabled={isBusy}
                  onPress={() => onAction('suspend_user')}
                  style={{ flex: 1, marginBottom: 0 }}
                />
              </Box>

              <TextInput
                style={{
                  borderWidth: BORDER_WIDTH.thin,
                  borderColor: GRAY[300],
                  borderRadius: RADIUS.md,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  backgroundColor: STATIC.white,
                  marginBottom: SPACING.md,
                }}
                value={reasonInput}
                onChangeText={onReasonChange}
                placeholder="Reason for ban/suspension (optional)"
                multiline
                numberOfLines={3}
                editable={!isBusy}
              />

              <EnforcementButton
                icon={<Ionicons name="ban" size={20} color={STATIC.white} />}
                label="Ban User Permanently"
                bg={STATIC.black}
                loading={actionLoading === 'ban_user'}
                disabled={isBusy}
                onPress={() => onAction('ban_user')}
              />
            </Box>
          </ScrollView>
        </Box>
      </Box>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Internal sub-components                                             */
/* ------------------------------------------------------------------ */

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box direction="row" mb="sm">
    <Text size="sm" weight="semibold" color={GRAY[600]} style={{ width: 100 }}>{label}:</Text>
    <Text size="sm" color={STATIC.black} style={{ flex: 1 }}>{value}</Text>
  </Box>
);

const TimelineRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box row justify="space-between" mb="sm">
    <Text size="sm" weight="semibold" color={GRAY[600]}>{label}</Text>
    <Text size="sm" color={STATIC.black}>{value}</Text>
  </Box>
);

interface ActionButtonProps {
  label: string;
  bg: string;
  borderColor: string;
  textColor: string;
  loading: boolean;
  loaderColor: string;
  disabled: boolean;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label, bg, borderColor, textColor, loading, loaderColor, disabled, onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor,
      alignItems: 'center',
      backgroundColor: bg,
      opacity: disabled ? OPACITY.disabled : OPACITY.full,
    }}
  >
    {loading ? (
      <ActivityIndicator color={loaderColor} />
    ) : (
      <Text size="sm" weight="semibold" color={textColor}>{label}</Text>
    )}
  </TouchableOpacity>
);

interface EnforcementButtonProps {
  icon: React.ReactNode;
  label: string;
  bg: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  style?: Record<string, any>;
}

const EnforcementButton: React.FC<EnforcementButtonProps> = ({
  icon, label, bg, loading, disabled, onPress, style: extraStyle,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
        backgroundColor: bg,
        opacity: disabled ? OPACITY.disabled : OPACITY.full,
      },
      extraStyle,
    ]}
  >
    {loading ? <ActivityIndicator color={STATIC.white} /> : <>{icon}<Text size="sm" weight="semibold" color={STATIC.white}>{label}</Text></>}
  </TouchableOpacity>
);

export default ReportActionModal;
