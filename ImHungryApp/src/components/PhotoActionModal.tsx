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
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalOptionsContainer}>
            <TouchableOpacity style={styles.modalButton} onPress={onTakePhoto}>
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <View style={styles.modalSeparator} />
            <TouchableOpacity style={styles.modalButton} onPress={onChooseFromAlbum}>
              <Text style={styles.modalButtonText}>Choose from Photo Album</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    backgroundColor: '#F4F4F4', // Changed background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    gap: 8,
  },
  modalOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  modalSeparator: {
    height: 0.5,
    backgroundColor: '#9E9E9E',
    width: '100%',
  },
  cancelButton: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
  },
});

export default PhotoActionModal;