import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerText: {
    fontSize: 16,
    color: '#000',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  doneText: {
    color: '#FF8C4C',
    fontWeight: '700',
  },
  doneDisabled: {
    opacity: 0.5,
  },
});

export default ModalHeader;
