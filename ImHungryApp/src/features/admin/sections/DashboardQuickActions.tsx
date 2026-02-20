import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { STATIC, GRAY, SPACING, SHADOW, BORDER_WIDTH } from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface DashboardQuickActionsProps {
  actions: ActionItem[];
}

const quickActionsTitleStyle = { marginBottom: SPACING.lg };
const quickActionSubtitleStyle = { marginTop: SPACING['2xs'] };
const quickActionRowBaseStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: SPACING.md,
  borderBottomColor: GRAY[150],
};

const getQuickActionRowStyle = (isLastItem: boolean) => ({
  ...quickActionRowBaseStyle,
  borderBottomWidth: isLastItem ? 0 : BORDER_WIDTH.thin,
});

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ actions }) => (
  <Box
    bg={STATIC.white}
    mx="md"
    mb="md"
    rounded="lg"
    p="lg"
    style={SHADOW.md}
  >
    <Text size="lg" weight="bold" color={STATIC.black} style={quickActionsTitleStyle}>
      Quick Actions
    </Text>
    {actions.map((action, index) => (
      <TouchableOpacity
        key={action.title}
        onPress={action.onPress}
        style={getQuickActionRowStyle(index === actions.length - 1)}
      >
        <Ionicons name={action.icon} size={24} color={GRAY[800]} />
        <Box flex={1} ml="md">
          <Text size="md" weight="semibold" color={STATIC.black}>{action.title}</Text>
          <Text size="xs" color={GRAY[600]} style={quickActionSubtitleStyle}>
            {action.subtitle}
          </Text>
        </Box>
        <Ionicons name="chevron-forward" size={20} color={GRAY[500]} />
      </TouchableOpacity>
    ))}
  </Box>
);

export default DashboardQuickActions;
