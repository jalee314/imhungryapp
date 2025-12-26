import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ThreeDotPopupProps {
  visible: boolean;
  onClose: () => void;
  onReportContent: () => void;
  onBlockUser: () => void;
  dealId?: string;
  uploaderUserId?: string;
  currentUserId?: string;
}

const ThreeDotPopup: React.FC<ThreeDotPopupProps> = ({
  visible,
  onClose,
  onReportContent,
  onBlockUser,
  dealId,
  uploaderUserId,
  currentUserId,
}) => {
  const navigation = useNavigation();

  const handleReportContent = () => {
    onClose();
    
    // Check if user is trying to report their own post
    if (currentUserId && uploaderUserId && currentUserId === uploaderUserId) {
      Alert.alert(
        'Cannot Report Own Post',
        'You cannot report your own post. If you want to remove it, please delete it from your profile instead.'
      );
      return;
    }
    
    if (dealId && uploaderUserId) {
      (navigation as any).navigate('ReportContent', { dealId, uploaderUserId });
    }
  };

  const handleBlockUser = () => {
    onClose();
    
    // Check if user is trying to block themselves
    if (currentUserId && uploaderUserId && currentUserId === uploaderUserId) {
      Alert.alert(
        'Cannot Block Yourself',
        'You cannot block yourself.'
      );
      return;
    }
    
    onBlockUser();
  };
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.popupContainer}>
          <TouchableOpacity style={styles.popupItem} onPress={handleReportContent}>
            <Text style={styles.popupItemText}>Report Content</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#666666" />
          </TouchableOpacity>
          <View style={styles.popupDivider} />
          <TouchableOpacity style={styles.popupItem} onPress={handleBlockUser}>
            <Text style={styles.popupItemText}>Block User</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#666666" />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 369,
    paddingVertical: 8,
    flexDirection: 'column',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
    height: 40,
    gap: 16,
  },
  popupItemText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '400',
    flex: 1,
  },
  popupDivider: {
    height: 1.45,
    backgroundColor: '#E0E0E0',
    alignSelf: 'stretch',
  },
});

export default ThreeDotPopup;
