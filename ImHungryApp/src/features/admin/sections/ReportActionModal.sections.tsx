import { Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';

import {
  BRAND,
  STATIC,
  GRAY,
  BORDER_WIDTH,
  SEMANTIC,
} from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import type { Report } from '../types';

import {
  ActionButton,
  EnforcementButton,
} from './ReportActionModal.buttons';
import { styles } from './ReportActionModal.styles';
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
const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};
export type ReportActionEnforcement = 'delete_deal' | 'warn_user' | 'ban_user' | 'suspend_user';
export const ReportHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Box
    row
    justify="space-between"
    align="center"
    mb="lg"
    pb="md"
    borderWidth={BORDER_WIDTH.thin}
    borderColor={GRAY[300]}
    style={styles.headerBorder}
  >
    <Text size="xl" weight="bold" color={STATIC.black}>Review Report</Text>
    <TouchableOpacity onPress={onClose}>
      <Ionicons name="close" size={24} color={STATIC.black} />
    </TouchableOpacity>
  </Box>
);
const DealPreviewSection: React.FC<{ report: Report | null }> = ({ report }) => (
  <>
    {report?.deal?.image_url ? (
      <Image
        source={{ uri: report.deal.image_url }}
        style={styles.dealPreviewImage}
        resizeMode="cover"
      />
    ) : null}
    <Box mb="xl">
      <Text size="lg" weight="bold" color={STATIC.black} style={styles.marginBottomSm}>
        {report?.deal?.title || 'Unknown Deal'}
      </Text>
      {report?.deal?.description ? (
        <Text size="sm" color={GRAY[600]} style={styles.dealDescription}>
          {report.deal.description}
        </Text>
      ) : null}
      <Box row align="center" gap="sm" mt="xs">
        <Ionicons name="restaurant" size={16} color={GRAY[600]} />
        <Text size="sm" color={GRAY[600]}>{report?.deal?.restaurant_name || 'Unknown'}</Text>
      </Box>
    </Box>
  </>
);
const StatusSummarySection: React.FC<{ report: Report }> = ({ report }) => (
  <Box mb="xl">
    <Text size="md" weight="bold" color={STATIC.black} style={styles.marginBottomMd}>Status</Text>
    <Box direction="row" wrap="wrap" gap="sm">
      <Box
        borderWidth={1}
        borderColor={STATUS_COLORS[report.status]}
        rounded="full"
        px="md"
        py="xs"
      >
        <Text
          size="xs"
          weight="semibold"
          color={STATUS_COLORS[report.status]}
          style={styles.uppercase}
        >
          {STATUS_LABELS[report.status]}
        </Text>
      </Box>
      {report.resolution_action ? (
        <Box borderWidth={1} borderColor={GRAY[400]} rounded="full" px="md" py="xs">
          <Text size="xs" weight="semibold" color={GRAY[800]} style={styles.uppercase}>
            {report.resolution_action.replace(/_/g, ' ')}
          </Text>
        </Box>
      ) : null}
    </Box>
  </Box>
);
const ReportDetailsSection: React.FC<{ report: Report | null }> = ({ report }) => (
  <Box bg={GRAY[100]} p="lg" rounded="lg" mb="xl">
    <Text size="md" weight="bold" color={STATIC.black} style={styles.marginBottomMd}>
      Report Details
    </Text>
    <DetailRow
      label="Reason"
      value={report?.reason_code?.description || report?.reason_code?.reason_code || 'Unknown'}
    />
    {report?.reason_text ? (
      <Box my="sm">
        <Text size="sm" weight="semibold" color={GRAY[600]}>Additional Info:</Text>
        <Text size="sm" color={GRAY[800]} style={styles.additionalInfoText}>
          {report.reason_text}
        </Text>
      </Box>
    ) : null}
    <DetailRow label="Reported by" value={report?.reporter?.display_name || 'Anonymous'} />
    <DetailRow label="Uploader" value={report?.uploader?.display_name || 'Unknown'} />
    <DetailRow
      label="Date"
      value={report ? new Date(report.created_at).toLocaleString() : 'Unknown'}
    />
  </Box>
);
const TimelineSection: React.FC<{ report: Report }> = ({ report }) => (
  <Box rounded="lg" p="lg" borderWidth={BORDER_WIDTH.thin} borderColor={GRAY[200]} mb="xl">
    <Text size="md" weight="bold" color={STATIC.black} style={styles.marginBottomMd}>
      Timeline
    </Text>
    <TimelineRow label="Created" value={formatTimestamp(report.created_at)} />
    <TimelineRow label="Last Update" value={formatTimestamp(report.updated_at)} />
    <TimelineRow label="Resolved By" value={report.resolved_by || '—'} />
  </Box>
);
interface WorkflowSectionProps {
  report: Report | null;
  actionLoading: string | null;
  isBusy: boolean;
  onWorkflowStatusChange: (status: 'pending' | 'review') => void;
}
const WorkflowSection: React.FC<WorkflowSectionProps> = ({
  report,
  actionLoading,
  isBusy,
  onWorkflowStatusChange,
}) => (
  <Box rounded="lg" p="lg" borderWidth={BORDER_WIDTH.thin} borderColor={GRAY[200]} mb="xl">
    <Text size="md" weight="bold" color={STATIC.black} style={styles.marginBottomMd}>
      Workflow
    </Text>
    <Text size="xs" color={GRAY[600]} style={styles.marginBottomMd}>
      Move reports between queues before taking enforcement action.
    </Text>
    <Box direction="row" wrap="wrap" gap="md">
      {report?.status !== 'review' ? (
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
      ) : null}
      {report?.status !== 'pending' ? (
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
      ) : null}
    </Box>
  </Box>
);
interface EnforcementActionsSectionProps {
  isBusy: boolean;
  actionLoading: string | null;
  suspensionDays: string;
  reasonInput: string;
  onDismiss: () => void;
  onAction: (action: ReportActionEnforcement) => void;
  onSuspensionDaysChange: (text: string) => void;
  onReasonChange: (text: string) => void;
}
const EnforcementActionsSection: React.FC<EnforcementActionsSectionProps> = ({
  isBusy,
  actionLoading,
  suspensionDays,
  reasonInput,
  onDismiss,
  onAction,
  onSuspensionDaysChange,
  onReasonChange,
}) => (
  <Box mb="xl">
    <Text size="md" weight="bold" color={STATIC.black} style={styles.marginBottomMd}>
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
        style={styles.suspensionDaysInput}
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
        style={styles.flexNoMargin}
      />
    </Box>
    <TextInput
      style={styles.reasonInput}
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
);
export interface ReportActionBodyProps {
  report: Report | null;
  actionLoading: string | null;
  suspensionDays: string;
  reasonInput: string;
  isBusy: boolean;
  onDismiss: () => void;
  onAction: (action: ReportActionEnforcement) => void;
  onWorkflowStatusChange: (status: 'pending' | 'review') => void;
  onSuspensionDaysChange: (text: string) => void;
  onReasonChange: (text: string) => void;
}
export const ReportActionBody: React.FC<ReportActionBodyProps> = ({
  report,
  actionLoading,
  suspensionDays,
  reasonInput,
  isBusy,
  onDismiss,
  onAction,
  onWorkflowStatusChange,
  onSuspensionDaysChange,
  onReasonChange,
}) => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
    <DealPreviewSection report={report} />
    {report ? <StatusSummarySection report={report} /> : null}
    <ReportDetailsSection report={report} />
    {report ? <TimelineSection report={report} /> : null}
    <WorkflowSection
      report={report}
      actionLoading={actionLoading}
      isBusy={isBusy}
      onWorkflowStatusChange={onWorkflowStatusChange}
    />
    <EnforcementActionsSection
      isBusy={isBusy}
      actionLoading={actionLoading}
      suspensionDays={suspensionDays}
      reasonInput={reasonInput}
      onDismiss={onDismiss}
      onAction={onAction}
      onSuspensionDaysChange={onSuspensionDaysChange}
      onReasonChange={onReasonChange}
    />
  </ScrollView>
);
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box direction="row" mb="sm">
    <Text size="sm" weight="semibold" color={GRAY[600]} style={styles.detailLabel}>{label}:</Text>
    <Text size="sm" color={STATIC.black} style={styles.flexFill}>{value}</Text>
  </Box>
);
const TimelineRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box row justify="space-between" mb="sm">
    <Text size="sm" weight="semibold" color={GRAY[600]}>{label}</Text>
    <Text size="sm" color={STATIC.black}>{value}</Text>
  </Box>
);
