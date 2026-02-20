import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

import { STATIC, GRAY, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../ui/alf';

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
  onReportContent: _onReportContent,
  onBlockUser,
  dealId,
  uploaderUserId,
  currentUserId,
}) => {
  const navigation = useNavigation();

  // Check if current user owns this post
  const isOwnPost = currentUserId && uploaderUserId && currentUserId === uploaderUserId;

  const handleEditPost = () => {
    onClose();
    if (dealId) {
      (navigation).navigate('DealEdit', { dealId });
    }
  };

  const handleReportContent = () => {
    onClose();

    // Check if user is trying to report their own post
    if (isOwnPost) {
      Alert.alert(
        'Cannot Report Own Post',
        'You cannot report your own post. If you want to remove it, please delete it from your profile instead.'
      );
      return;
    }

    if (dealId && uploaderUserId) {
      (navigation).navigate('ReportContent', { dealId, uploaderUserId });
    }
  };

  const handleBlockUser = () => {
    onClose();

    // Check if user is trying to block themselves
    if (isOwnPost) {
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
          {/* Edit Post - only shown for own posts */}
          {isOwnPost && (
            <>
              <TouchableOpacity style={styles.popupItem} onPress={handleEditPost}>
                <Text style={styles.popupItemText}>Edit Post</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={GRAY[600]} />
              </TouchableOpacity>
              <View style={styles.popupDivider} />
            </>
          )}
          <TouchableOpacity style={styles.popupItem} onPress={handleReportContent}>
            <Text style={styles.popupItemText}>Report Content</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={GRAY[600]} />
          </TouchableOpacity>
          <View style={styles.popupDivider} />
          <TouchableOpacity style={styles.popupItem} onPress={handleBlockUser}>
            <Text style={styles.popupItemText}>Block User</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={GRAY[600]} />
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
    backgroundColor: STATIC.white,
    borderRadius: RADIUS.card,
    width: 369,
    paddingVertical: SPACING.sm,
    flexDirection: 'column',
    gap: SPACING.sm,
    shadowColor: STATIC.black,
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
    fontSize: FONT_SIZE.xs,
    color: STATIC.black,
    fontWeight: FONT_WEIGHT.regular,
    flex: 1,
  },
  popupDivider: {
    height: 1.45,
    backgroundColor: GRAY[300],
    alignSelf: 'stretch',
  },
});

export default ThreeDotPopup;
