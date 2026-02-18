import React from 'react';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, SHADOW, BORDER_WIDTH } from '../../../ui/alf';

interface RankedItem {
  id: string;
  title: string;
  subtitle: string;
}

interface DashboardRankingListProps {
  heading: string;
  items: RankedItem[];
  emptyText: string;
}

const DashboardRankingList: React.FC<DashboardRankingListProps> = ({ heading, items, emptyText }) => (
  <Box
    bg={STATIC.white}
    mx="md"
    mb="md"
    rounded="lg"
    p="lg"
    style={SHADOW.md}
  >
    <Text size="lg" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.lg }}>
      {heading}
    </Text>
    {items.length > 0 ? (
      items.map((item, index) => (
        <Box
          key={item.id}
          row
          align="center"
          py="md"
          borderWidth={index < items.length - 1 ? BORDER_WIDTH.thin : 0}
          borderColor={GRAY[150]}
          style={{ borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}
        >
          <Box
            w={36}
            h={36}
            rounded="full"
            bg={BRAND.accent}
            center
          >
            <Text size="sm" weight="bold" color={STATIC.white}>#{index + 1}</Text>
          </Box>
          <Box flex={1} ml="md">
            <Text size="sm" weight="semibold" color={STATIC.black} numberOfLines={1}>
              {item.title}
            </Text>
            <Text size="xs" color={GRAY[600]} style={{ marginTop: SPACING['2xs'] }}>
              {item.subtitle}
            </Text>
          </Box>
        </Box>
      ))
    ) : (
      <Text size="sm" color={GRAY[500]} style={{ textAlign: 'center', paddingVertical: SPACING.xl }}>
        {emptyText}
      </Text>
    )}
  </Box>
);

export default DashboardRankingList;
