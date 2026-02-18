import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, SHADOW, SEMANTIC } from '../../../ui/alf';
import type { AppAnalytics } from '../../../services/admin/types';

interface DashboardStatsGridProps {
  analytics: AppAnalytics;
  onNavigate: (screen: string) => void;
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: number;
  label: string;
  subtext: string;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, value, label, subtext, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flex: 1,
      minWidth: '45%',
      backgroundColor: STATIC.white,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      ...SHADOW.md,
    }}
  >
    <Ionicons name={icon} size={32} color={iconColor} />
    <Text size="2xl" weight="bold" color={STATIC.black} style={{ marginTop: SPACING.sm }}>
      {value}
    </Text>
    <Text size="sm" color={GRAY[600]} style={{ marginTop: SPACING.xs }}>
      {label}
    </Text>
    <Text size="xs" color={GRAY[500]} style={{ marginTop: SPACING['2xs'] }}>
      {subtext}
    </Text>
  </TouchableOpacity>
);

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ analytics, onNavigate }) => (
  <Box direction="row" wrap="wrap" p="md" gap="md">
    <StatCard
      icon="people"
      iconColor={BRAND.accent}
      value={analytics.totalUsers}
      label="Total Users"
      subtext={`+${analytics.recentSignups} this week`}
      onPress={() => onNavigate('AdminUsers')}
    />
    <StatCard
      icon="pricetag"
      iconColor={SEMANTIC.success}
      value={analytics.totalDeals}
      label="Total Deals"
      subtext={`+${analytics.dealsThisWeek} this week`}
      onPress={() => onNavigate('AdminDeals')}
    />
    <StatCard
      icon="flag"
      iconColor={SEMANTIC.error}
      value={analytics.totalReports}
      label="Total Reports"
      subtext={`${analytics.pendingReports} pending`}
      onPress={() => onNavigate('AdminReports')}
    />
  </Box>
);

export default DashboardStatsGrid;
