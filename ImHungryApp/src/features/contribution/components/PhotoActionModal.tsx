import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { tokens, atoms as a } from '#/ui';

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
    ...a.flex_1,
    ...a.justify_end,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    ...a.px_lg,
    paddingBottom: 90,
  },
  modalContent: {
    ...a.bg_white,
    ...a.mb_sm,
    ...a.rounded_md,
  },
  option: {
    ...a.py_lg,
    ...a.align_center,
  },
  optionText: {
    ...a.text_md,
    ...a.font_normal,
    ...a.text_black,
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.color.gray_200,
  },
  cancelButton: {
    ...a.bg_white,
    ...a.rounded_md,
    ...a.py_lg,
    ...a.align_center,
  },
  cancelText: {
    ...a.text_md,
    ...a.font_normal,
    ...a.text_black,
    fontFamily: 'Inter',
  },
});

export default PhotoActionModal;
