import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { STATIC, GRAY, SPACING, RADIUS, SHADOW } from '../../../ui/alf';
import type { AdminDeal as Deal } from '../types';

interface DealCardProps {
  deal: Deal;
  onPress: (deal: Deal) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(deal)}
    style={{
      backgroundColor: STATIC.white,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      ...SHADOW.md,
    }}
  >
    <Box row justify="space-between" align="center" mb="md">
      <Text size="xs" color={GRAY[600]}>
        {new Date(deal.created_at).toLocaleDateString()}
      </Text>
    </Box>

    <Text size="md" weight="bold" color={STATIC.black} numberOfLines={2} style={{ marginBottom: SPACING.sm }}>
      {deal.title}
    </Text>

    <Box row align="center" mb="xs" gap="sm">
      <Ionicons name="restaurant" size={14} color={GRAY[600]} />
      <Text size="sm" color={GRAY[600]}>{deal.restaurant_name}</Text>
    </Box>

    {deal.category_name && (
      <Box row align="center" mb="xs" gap="sm">
        <Ionicons name="pricetag" size={14} color={GRAY[600]} />
        <Text size="sm" color={GRAY[600]}>{deal.category_name}</Text>
      </Box>
    )}
  </TouchableOpacity>
);

export default DealCard;
