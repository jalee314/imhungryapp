/**
 * ModalHeader
 * 
 * A reusable modal header component with Cancel, title, and optional Done action.
 * Migrated to use ALF primitives (PR-027).
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Box, Text } from '../../ui/primitives';

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
    <Box
      row
      justify="space-between"
      px="lg"
      py="md"
      borderColor="borderSubtle"
      style={[styles.headerBorder, containerStyle]}
    >
      <TouchableOpacity onPress={onCancel} disabled={false} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text size="md" color="text">Cancel</Text>
      </TouchableOpacity>

      <Box flex={1} px="sm" align="center">
        {typeof title === 'string' ? (
          <Text size="md" weight="semibold" color="text" numberOfLines={1} style={titleStyle}>
            {title}
          </Text>
        ) : (
          title
        )}
      </Box>

      {rightContent ? (
        rightContent
      ) : onDone ? (
        <TouchableOpacity onPress={onDone} disabled={doneDisabled} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text 
            size="md" 
            weight="bold" 
            color="primary"
            opacity={doneDisabled ? 0.5 : 1}
          >
            Done
          </Text>
        </TouchableOpacity>
      ) : (
        <Box w={50} />
      )}
    </Box>
  );
};

// Minimal legacy styles for border that requires borderBottomWidth
const styles = StyleSheet.create({
  headerBorder: {
    borderBottomWidth: 1,
  },
});

export default ModalHeader;
