/**
 * SquareCard - Compact Square Card Component
 * 
 * A small square card for displaying restaurants or categories.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { Box, Text } from './atoms';
import { colors, borderRadius, spacing } from '../lib/theme';

const CARD_WIDTH = 107;
const CARD_HEIGHT = 124;

export interface SquareCardData {
  id: string;
  title: string;
  subtitle: string;
  image: string | any;
  distance?: string;
  dealCount?: number;
}

interface SquareCardProps {
  data: SquareCardData;
  onPress?: (id: string) => void;
}

const SquareCard: React.FC<SquareCardProps> = ({ data, onPress }) => {
  const handlePress = () => {
    onPress?.(data.id);
  };

  const subtitle = data.distance && data.dealCount 
    ? `${data.distance} • ${data.dealCount} Deals`
    : data.subtitle;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        marginBottom: spacing.m,
        borderWidth: 0.5,
        borderColor: '#757575',
        padding: spacing.xs,
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Image */}
      <Box
        width={80}
        height={80}
        rounded="s"
        overflow="hidden"
      >
        <Image
          source={data.image}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </Box>

      {/* Content */}
      <Box width="100%" alignCenter>
        <Text
          size="xs"
          weight="bold"
          color="text"
          align="center"
          numberOfLines={2}
          style={{ lineHeight: 14, marginBottom: 0 }}
        >
          {data.title}
        </Text>

        <Text
          size={10}
          color="text"
          align="center"
          numberOfLines={1}
          style={{ lineHeight: 12 }}
        >
          {subtitle}
        </Text>
      </Box>
    </TouchableOpacity>
  );
};

export default SquareCard;
