/**
 * ScreenHeader - Screen Navigation Header
 * 
 * A reusable header component with back button and optional right action.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../atoms';
import { colors } from '../../lib/theme';

type RightConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
};

interface ScreenHeaderProps {
  title?: string | React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode | RightConfig;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  right,
  containerStyle,
  titleStyle,
}) => {
  const renderRight = () => {
    if (!right) {
      return <Box width={40} height={32} />;
    }
    if (React.isValidElement(right)) {
      return right;
    }
    const cfg = right as RightConfig;
    return (
      <Pressable
        onPress={cfg.onPress}
        center
        width={40}
        height={32}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name={cfg.icon} size={22} color={cfg.color || colors.text} />
      </Pressable>
    );
  };

  return (
    <Box
      row
      alignCenter
      justifyBetween
      px="m"
      py="m"
      bg="background"
      borderBottom={1}
      borderColor="border"
      style={containerStyle}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          center
          width={40}
          height={32}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : (
        <Box width={40} height={32} />
      )}

      <Box flex={1} px="s" alignCenter>
        {typeof title === 'string' ? (
          <Text
            size="lg"
            weight="bold"
            color="text"
            numberOfLines={1}
            style={titleStyle}
          >
            {title}
          </Text>
        ) : (
          title
        )}
      </Box>

      {renderRight()}
    </Box>
  );
};

export default ScreenHeader;
