import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

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
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalButton} onPress={onTakePhoto}>
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <View style={styles.modalSeparator} />
            <TouchableOpacity style={styles.modalButton} onPress={onChooseFromAlbum}>
              <Text style={styles.modalButtonText}>Choose from Photo Album</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.modalContent, styles.cancelButton]} onPress={onClose}>
            <Text style={[styles.modalButtonText, { fontWeight: 'bold' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    marginHorizontal: 8,
    marginBottom: 30,
  },
  modalContent: {
    backgroundColor: 'rgba(249, 249, 249, 0.94)',
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  modalSeparator: {
    height: 0.5,
    backgroundColor: '#C1C1C1',
    width: '100%',
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default PhotoActionModal;