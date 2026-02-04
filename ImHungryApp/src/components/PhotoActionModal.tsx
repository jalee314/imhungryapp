/**
 * PhotoActionModal - Photo Selection Modal
 * 
 * A bottom sheet modal for choosing photo source (camera or library).
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { Modal, TouchableWithoutFeedback } from 'react-native';
import { Box, Text, Pressable, Divider } from './atoms';
import { colors, borderRadius, spacing } from '../lib/theme';

interface PhotoActionModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromAlbum: () => void;
}

const PhotoActionModal: React.FC<PhotoActionModalProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onChooseFromAlbum,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Box flex={1} bg="overlay" justifyEnd>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Box px="m" pb={90}>
              {/* Options */}
              <Box bg="background" rounded="md" mb="s">
                <Pressable onPress={onTakePhoto} py="m" center>
                  <Text size="md" color="text">
                    Take Photo
                  </Text>
                </Pressable>

                <Divider />

                <Pressable onPress={onChooseFromAlbum} py="m" center>
                  <Text size="md" color="text">
                    Choose from Library
                  </Text>
                </Pressable>
              </Box>

              {/* Cancel */}
              <Pressable onPress={onClose} bg="background" rounded="md" py="m" center>
                <Text size="md" color="text">
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

export default PhotoActionModal;
