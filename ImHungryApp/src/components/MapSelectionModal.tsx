/**
 * MapSelectionModal - Map App Selection Modal
 * 
 * A bottom sheet modal for choosing which map app to open.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { Box, Text, Pressable, Divider } from './atoms';

interface MapSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAppleMaps: () => void;
  onSelectGoogleMaps: () => void;
}

const MapSelectionModal: React.FC<MapSelectionModalProps> = ({
  visible,
  onClose,
  onSelectAppleMaps,
  onSelectGoogleMaps,
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
                {Platform.OS === 'ios' && (
                  <>
                    <Pressable onPress={onSelectAppleMaps} py="m" center>
                      <Text size="md" color="text">
                        Apple Maps
                      </Text>
                    </Pressable>
                    <Divider />
                  </>
                )}

                <Pressable onPress={onSelectGoogleMaps} py="m" center>
                  <Text size="md" color="text">
                    Google Maps
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

export default MapSelectionModal;
