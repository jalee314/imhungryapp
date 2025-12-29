import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens, atoms as a } from '#/ui';

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
        <Ionicons name={cfg.icon} size={22} color={cfg.color || tokens.color.black} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.header, containerStyle]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={tokens.color.black} />
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
    ...a.flex_row,
    ...a.align_center,
    ...a.justify_between,
    ...a.px_lg,
    ...a.py_md,
    ...a.bg_white,
    ...a.border_b,
    borderBottomColor: tokens.color.gray_200,
  },
  iconButton: {
    ...a.align_center,
    ...a.justify_center,
    width: 40,
    height: 32,
  },
  sidePlaceholder: {
    width: 40,
    height: 32,
  },
  titleContainer: {
    ...a.flex_1,
    ...a.px_sm,
    ...a.align_center,
  },
  title: {
    ...a.text_lg,
    ...a.font_bold,
    ...a.text_black,
  },
});

export default ScreenHeader;
