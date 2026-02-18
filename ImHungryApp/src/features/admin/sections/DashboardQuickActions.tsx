import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { STATIC, GRAY, SPACING, RADIUS, SHADOW, BORDER_WIDTH } from '../../../ui/alf';

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface DashboardQuickActionsProps {
  actions: ActionItem[];
}

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ actions }) => (
  <Box
    bg={STATIC.white}
    mx="md"
    mb="md"
    rounded="lg"
    p="lg"
    style={SHADOW.md}
  >
    <Text size="lg" weight="bold" color={STATIC.black} style={{ marginBottom: SPACING.lg }}>
      Quick Actions
    </Text>
    {actions.map((action, index) => (
      <TouchableOpacity
        key={action.title}
        onPress={action.onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.md,
          borderBottomWidth: index < actions.length - 1 ? BORDER_WIDTH.thin : 0,
          borderBottomColor: GRAY[150],
        }}
      >
        <Ionicons name={action.icon} size={24} color={GRAY[800]} />
        <Box flex={1} ml="md">
          <Text size="md" weight="semibold" color={STATIC.black}>{action.title}</Text>
          <Text size="xs" color={GRAY[600]} style={{ marginTop: SPACING['2xs'] }}>
            {action.subtitle}
          </Text>
        </Box>
        <Ionicons name="chevron-forward" size={20} color={GRAY[500]} />
      </TouchableOpacity>
    ))}
  </Box>
);

export default DashboardQuickActions;
