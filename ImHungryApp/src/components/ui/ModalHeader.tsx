import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { tokens, atoms as a } from '#/ui';

interface ModalHeaderProps {
  title: string | React.ReactNode;
  onCancel: () => void;
  onDone?: () => void;
  doneDisabled?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  rightContent?: React.ReactNode; // optionally override the Done button
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onCancel,
  onDone,
  doneDisabled,
  containerStyle,
  titleStyle,
  rightContent,
}) => {
  return (
    <View style={[styles.header, containerStyle]}>
      <TouchableOpacity onPress={onCancel} disabled={false} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.headerText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        {typeof title === 'string' ? (
          <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      {rightContent ? (
        rightContent
      ) : onDone ? (
        <TouchableOpacity onPress={onDone} disabled={doneDisabled} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.headerText, styles.doneText, doneDisabled && styles.doneDisabled]}>Done</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 50 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.px_lg,
    ...a.py_md,
    ...a.border_b,
    borderBottomColor: tokens.color.gray_200,
  },
  headerText: {
    ...a.text_md,
    ...a.text_black,
  },
  headerTitle: {
    ...a.font_semibold,
    ...a.text_black,
    fontSize: 17,
  },
  titleContainer: {
    ...a.flex_1,
    ...a.align_center,
    ...a.px_sm,
  },
  doneText: {
    ...a.font_bold,
    ...a.text_primary_600,
  },
  doneDisabled: {
    ...a.opacity_50,
  },
});

export default ModalHeader;
