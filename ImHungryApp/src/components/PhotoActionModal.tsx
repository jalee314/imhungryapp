import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { STATIC, GRAY, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../ui/alf';

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
          <TouchableWithoutFeedback onPress={() => { }}>
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
    paddingHorizontal: 16,
    paddingBottom: 90, // Position above bottom navigation
  },
  modalContent: {
    backgroundColor: STATIC.white,
    borderRadius: RADIUS.card,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.regular,
    color: STATIC.black,
  },
  divider: {
    height: 1,
    backgroundColor: GRAY[300],
  },
  cancelButton: {
    backgroundColor: STATIC.white,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.regular,
    color: STATIC.black,
  },
});

export default PhotoActionModal;