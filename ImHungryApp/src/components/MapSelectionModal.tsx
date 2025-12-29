import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { tokens, atoms as a } from '#/ui';

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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {Platform.OS === 'ios' && (
                  <>
                    <TouchableOpacity style={styles.option} onPress={onSelectAppleMaps}>
                      <Text style={styles.optionText}>Apple Maps</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />
                  </>
                )}

                <TouchableOpacity style={styles.option} onPress={onSelectGoogleMaps}>
                  <Text style={styles.optionText}>Google Maps</Text>
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
    ...a.rounded_md,
    ...a.mb_sm,
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

export default MapSelectionModal;


