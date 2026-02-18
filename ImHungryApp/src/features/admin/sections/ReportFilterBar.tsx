import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, SHADOW } from '../../../ui/alf';
import type { ReportCounts } from '../../../services/admin/types';

export type ReportFilter = 'pending' | 'review' | 'resolved' | 'all';

interface FilterOption {
  label: string;
  value: ReportFilter;
  countKey: keyof ReportCounts;
}

const STATUS_FILTERS: FilterOption[] = [
  { label: 'Pending', value: 'pending', countKey: 'pending' },
  { label: 'In Review', value: 'review', countKey: 'review' },
  { label: 'Resolved', value: 'resolved', countKey: 'resolved' },
  { label: 'All', value: 'all', countKey: 'total' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  review: 'In Review',
  resolved: 'Resolved',
  all: 'All',
};

interface ReportFilterBarProps {
  activeFilter: ReportFilter;
  counts: ReportCounts;
  onFilterChange: (filter: ReportFilter) => void;
}

const ReportFilterBar: React.FC<ReportFilterBarProps> = ({ activeFilter, counts, onFilterChange }) => {
  const activeLabel = STATUS_LABELS[activeFilter];
  const activeCount = activeFilter === 'all' ? counts.total : counts[activeFilter];

  return (
    <Box bg={STATIC.white} rounded="lg" p="lg" mb="md" style={SHADOW.sm}>
      <Text size="md" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.md }}>
        Status Filters
      </Text>
      <Box direction="row" wrap="wrap" gap="sm">
        {STATUS_FILTERS.map((option) => {
          const isActive = activeFilter === option.value;
          const count = counts[option.countKey];

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onFilterChange(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isActive ? BRAND.accent : GRAY[300],
                borderRadius: RADIUS.full,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.sm,
                backgroundColor: isActive ? '#FFF3E6' : STATIC.white,
              }}
            >
              <Text
                size="sm"
                weight="semibold"
                color={isActive ? BRAND.primaryDark : GRAY[800]}
                style={{ marginRight: SPACING.sm }}
              >
                {option.label}
              </Text>
              <Box
                rounded="full"
                px="sm"
                py="2xs"
                bg={isActive ? BRAND.accent : GRAY[150]}
                center
                minW={28}
              >
                <Text size="xs" weight="semibold" color={isActive ? STATIC.white : GRAY[700]}>
                  {count}
                </Text>
              </Box>
            </TouchableOpacity>
          );
        })}
      </Box>
      <Text size="xs" color={GRAY[600]} style={{ marginTop: SPACING.md }}>
        Showing {activeCount} {activeLabel.toLowerCase()} {activeCount === 1 ? 'report' : 'reports'}
      </Text>
    </Box>
  );
};

export default ReportFilterBar;
