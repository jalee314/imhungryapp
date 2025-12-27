import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '#/ui';

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
    if (!right) return <View style={styles.sidePlaceholder} />;
    if (React.isValidElement(right)) return right;
    const cfg = right as RightConfig;
    return (
      <TouchableOpacity onPress={cfg.onPress} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color || '#000'} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.header, containerStyle]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}

      <View style={styles.titleContainer}>
        {typeof title === 'string' ? (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      {renderRight()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    backgroundColor: tokens.color.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iconButton: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePlaceholder: {
    width: 40,
    height: 32,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: tokens.space.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.color.black,
  },
});

export default ScreenHeader;
