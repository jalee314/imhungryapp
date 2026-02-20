/**
 * ScreenHeader
 * 
 * A reusable screen header component with back button, title, and optional right action.
 * Migrated to use ALF primitives (PR-027).
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { GRAY } from '../../ui/alf/tokens';
import { Box, Text } from '../../ui/primitives';

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
    if (!right) return <Box w={40} h={32} />;
    if (React.isValidElement(right)) return right;
    const cfg = right as RightConfig;
    return (
      <TouchableOpacity onPress={cfg.onPress} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color || GRAY[900]} />
      </TouchableOpacity>
    );
  };

  return (
    <Box
      row
      justify="space-between"
      px="lg"
      py="md"
      bg="background"
      borderColor="border"
      style={[styles.headerBorder, containerStyle]}
    >
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={GRAY[900]} />
        </TouchableOpacity>
      ) : (
        <Box w={40} h={32} />
      )}

      <Box flex={1} px="sm" align="center">
        {typeof title === 'string' ? (
          <Text size="lg" weight="bold" color="text" numberOfLines={1} style={titleStyle}>
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

// Minimal legacy styles for properties not yet in primitives
const styles = StyleSheet.create({
  headerBorder: {
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScreenHeader;
