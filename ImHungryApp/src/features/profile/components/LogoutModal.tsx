/**
 * LogoutModal - Profile Feature Component
 * 
 * Simple modal for confirming logout action.
 */

import React from 'react';
import { Modal, TouchableWithoutFeedback } from 'react-native';
import { Box, Text, Pressable, Divider } from '../../../components/atoms';
import { spacing } from '../../../lib/theme';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ 
  visible, 
  onClose, 
  onConfirm 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Box flex={1} bg="overlay" justifyEnd>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Box px="xl" pb="9xl">
              {/* Content Card */}
              <Box bg="background" rounded="md" mb="m">
                <Pressable
                  onPress={onConfirm}
                  py="xl"
                  alignCenter
                >
                  <Text weight="medium" size="base" color="text">
                    Log Out
                  </Text>
                </Pressable>
              </Box>

              {/* Cancel Button */}
              <Pressable
                onPress={onClose}
                bg="background"
                rounded="md"
                py="xl"
                alignCenter
              >
                <Text weight="medium" size="base" color="text">
                  Cancel
                </Text>
              </Pressable>
            </Box>
          </TouchableWithoutFeedback>
        </Box>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default LogoutModal;
