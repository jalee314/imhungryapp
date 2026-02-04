/**
 * RowCard - Versatile List Item Card
 * 
 * A flexible card component for displaying deals and restaurants in lists.
 * Supports multiple variants for different contexts.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { TouchableOpacity, Image, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text } from './atoms';
import { colors, spacing, borderRadius } from '../lib/theme';

export interface RowCardData {
  id: string;
  title: string;
  subtitle: string;
  image: string | any;
  distance?: string;
  dealCount?: number;
  views?: number;
  postedDate?: string;
  expiresIn?: string;
  userId?: string;
  userProfilePhoto?: string;
  userDisplayName?: string;
}

interface RowCardProps {
  data: RowCardData;
  variant: 'explore-deal-card' | 'rest-deal' | 'favorites-deal-card';
  onPress?: (id: string) => void;
  onUserPress?: (userId: string) => void;
  style?: StyleProp<ViewStyle>;
}

const RowCard: React.FC<RowCardProps> = ({ data, variant, onPress, onUserPress, style }) => {
  const handlePress = () => {
    onPress?.(data.id);
  };

  const renderSubtitle = () => {
    switch (variant) {
      case 'explore-deal-card':
        return `Posted ${data.postedDate} • ${data.expiresIn} • ${data.views} views`;
      case 'rest-deal':
        return `${data.distance} • ${data.dealCount} Deals`;
      case 'favorites-deal-card':
        return data.subtitle;
      default:
        return '';
    }
  };

  const getChevronColor = () => {
    return variant === 'explore-deal-card' ? colors.textLight : colors.text;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: colors.background,
          borderRadius: borderRadius.md,
          padding: spacing.s,
          marginHorizontal: spacing.m,
          marginVertical: spacing.xs,
          height: 96,
        },
        style,
      ]}
    >
      <Box row alignCenter gap="m" width="100%">
        {/* Image */}
        <Box center>
          <Image
            source={data.image}
            style={{
              width: 80,
              height: 80,
              borderRadius: borderRadius.s,
            }}
          />
        </Box>

        {/* Text Content */}
        <Box flex={1} justifyCenter pr="s" height={76} gap={4}>
          <Text
            size="sm"
            weight="semibold"
            color="text"
            numberOfLines={2}
            style={{ lineHeight: 17, letterSpacing: -0.35 }}
          >
            {data.title}
          </Text>

          <Text
            size="xs"
            weight="normal"
            color="textLight"
            numberOfLines={1}
            style={{ lineHeight: 16 }}
          >
            {renderSubtitle()}
          </Text>
        </Box>

        {/* Arrow */}
        <Box center p={6} style={{ minWidth: 20 }}>
          <Ionicons name="chevron-forward" size={16} color={getChevronColor()} />
        </Box>
      </Box>
    </TouchableOpacity>
  );
};

export default RowCard;
