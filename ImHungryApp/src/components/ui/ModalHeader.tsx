import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '#/ui';

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerText: {
    fontSize: tokens.fontSize.md,
    color: tokens.color.black,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.color.black,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: tokens.space.sm,
  },
  doneText: {
    color: tokens.color.primary_600,
    fontWeight: tokens.fontWeight.bold,
  },
  doneDisabled: {
    opacity: 0.5,
  },
});

export default ModalHeader;
