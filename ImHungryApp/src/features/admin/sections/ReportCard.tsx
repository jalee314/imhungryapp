import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, SHADOW, SEMANTIC } from '../../../ui/alf';
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

interface ReportCardProps {
  report: Report;
  onPress: (report: Report) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
  const badgeColor = STATUS_COLORS[report.status];
  const actionLabel = report.resolution_action
    ? report.resolution_action.replace(/_/g, ' ')
    : null;

  return (
    <TouchableOpacity
      onPress={() => onPress(report)}
      style={{
        backgroundColor: STATIC.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOW.md,
      }}
    >
      <Box row justify="space-between" align="center" mb="md">
        <Box
          px="md"
          py="xs"
          rounded="lg"
          bg={`${badgeColor}1A`}
          borderWidth={1}
          borderColor={`${badgeColor}40`}
        >
          <Text size="xs" weight="semibold" color={badgeColor}>
            {STATUS_LABELS[report.status]}
          </Text>
        </Box>
        <Text size="xs" color={GRAY[600]}>
          {new Date(report.created_at).toLocaleDateString()}
        </Text>
      </Box>

      <Text size="md" weight="bold" color={STATIC.black} numberOfLines={2} style={{ marginBottom: SPACING.md }}>
        {report.deal?.title || 'Unknown Deal'}
      </Text>

      {report.deal?.restaurant_name && (
        <Box row mb="xs" gap="sm">
          <Text size="sm" weight="semibold" color={GRAY[600]} style={{ width: 80 }}>Restaurant:</Text>
          <Text size="sm" color={STATIC.black} style={{ flex: 1 }}>{report.deal.restaurant_name}</Text>
        </Box>
      )}
      <Box row mb="xs" gap="sm">
        <Text size="sm" weight="semibold" color={GRAY[600]} style={{ width: 80 }}>Reason:</Text>
        <Text size="sm" color={STATIC.black} style={{ flex: 1 }}>
          {report.reason_code?.description || report.reason_code?.reason_code || 'Unknown'}
        </Text>
      </Box>
      <Box row mb="xs" gap="sm">
        <Text size="sm" weight="semibold" color={GRAY[600]} style={{ width: 80 }}>Reporter:</Text>
        <Text size="sm" color={STATIC.black} style={{ flex: 1 }}>
          {report.reporter?.display_name || 'Anonymous'}
        </Text>
      </Box>
      <Box row mb="xs" gap="sm">
        <Text size="sm" weight="semibold" color={GRAY[600]} style={{ width: 80 }}>Uploader:</Text>
        <Text size="sm" color={STATIC.black} style={{ flex: 1 }}>
          {report.uploader?.display_name || 'Unknown'}
        </Text>
      </Box>

      {actionLabel && (
        <Box row mb="xs" gap="sm">
          <Text size="sm" weight="semibold" color={GRAY[600]} style={{ width: 80 }}>Action:</Text>
          <Text size="sm" color={STATIC.black} style={{ flex: 1 }}>{actionLabel}</Text>
        </Box>
      )}

      {report.reason_text && (
        <Box bg={GRAY[100]} p="md" rounded="md" mt="sm">
          <Text size="sm" color={GRAY[800]}>{report.reason_text}</Text>
        </Box>
      )}

      <TouchableOpacity
        onPress={() => onPress(report)}
        style={{
          backgroundColor: BRAND.accent,
          paddingVertical: SPACING.md,
          borderRadius: RADIUS.md,
          alignItems: 'center',
          marginTop: SPACING.md,
        }}
      >
        <Text size="sm" weight="semibold" color={STATIC.white}>Review Report</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default ReportCard;
