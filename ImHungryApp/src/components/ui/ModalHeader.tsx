/**
 * ModalHeader - Modal Navigation Header
 * 
 * A reusable header component for modals with cancel/done actions.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Box, Text, Pressable } from '../atoms';

interface ModalHeaderProps {
  title: string | React.ReactNode;
  onCancel: () => void;
  onDone?: () => void;
  doneDisabled?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  rightContent?: React.ReactNode;
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
      justifyBetween
      alignCenter
      px="m"
      py="m"
      borderBottom={1}
      borderColor="border"
      style={containerStyle}
    >
      {/* Cancel button */}
      <Pressable 
        onPress={onCancel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text size="md" color="text">
          Cancel
        </Text>
      </Pressable>

      {/* Title */}
      <Box flex={1} alignCenter px="s">
        {typeof title === 'string' ? (
          <Text
            size="md"
            weight="semibold"
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

      {/* Right action */}
      {rightContent ? (
        rightContent
      ) : onDone ? (
        <Pressable
          onPress={onDone}
          disabled={doneDisabled}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ opacity: doneDisabled ? 0.5 : 1 }}
        >
          <Text size="md" weight="bold" color="primaryDark">
            Done
          </Text>
        </Pressable>
      ) : (
        <Box width={50} />
      )}
    </Box>
  );
};

export default ModalHeader;
