import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { tokens } from '#/ui';

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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.option} onPress={onTakePhoto}>
                  <Text style={styles.optionText}>Take Photo</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.option} onPress={onChooseFromAlbum}>
                  <Text style={styles.optionText}>Choose from Library</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 80% opacity black background
    justifyContent: 'flex-end',
  },
  modalContainer: {
    paddingHorizontal: tokens.space.lg,
    paddingBottom: 90, // Position above bottom navigation
  },
  modalContent: {
    backgroundColor: tokens.color.white,
    borderRadius: 10,
    marginBottom: tokens.space.sm,
  },
  option: {
    paddingVertical: tokens.space.lg,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.normal,
    color: tokens.color.black,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: tokens.color.white,
    borderRadius: 10,
    paddingVertical: tokens.space.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.normal,
    color: tokens.color.black,
  },
});

export default PhotoActionModal;