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
import { tokens } from '#/ui';

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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    paddingHorizontal: tokens.space.lg,
    paddingBottom: 90,
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

export default MapSelectionModal;

