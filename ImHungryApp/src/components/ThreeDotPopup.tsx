/**
 * ThreeDotPopup - Action Modal Component
 * 
 * A modal popup with actions like Edit, Report, and Block.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { Modal, Pressable as RNPressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text, Pressable, Divider } from './atoms';
import { colors, borderRadius, shadows } from '../lib/theme';

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

  const isOwnPost = currentUserId && uploaderUserId && currentUserId === uploaderUserId;

  const handleEditPost = () => {
    onClose();
    if (dealId) {
      (navigation as any).navigate('DealEdit', { dealId });
    }
  };

  const handleReportContent = () => {
    onClose();
    
    if (isOwnPost) {
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
    
    if (isOwnPost) {
      Alert.alert(
        'Cannot Block Yourself',
        'You cannot block yourself.'
      );
      return;
    }
    
    onBlockUser();
  };

  const MenuItem: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
    <Pressable
      onPress={onPress}
      row
      justifyBetween
      alignCenter
      px="m"
      py={2}
      height={40}
      gap="m"
    >
      <Text size="xs" color="text" weight="normal" flex={1}>
        {label}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textLight} />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <RNPressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: colors.overlayLight,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          bg="background"
          rounded="md"
          width={369}
          py="s"
          gap="s"
          shadow="md"
        >
          {/* Edit Post - only shown for own posts */}
          {isOwnPost && (
            <>
              <MenuItem label="Edit Post" onPress={handleEditPost} />
              <Divider />
            </>
          )}
          
          <MenuItem label="Report Content" onPress={handleReportContent} />
          <Divider />
          <MenuItem label="Block User" onPress={handleBlockUser} />
        </Box>
      </RNPressable>
    </Modal>
  );
};

export default ThreeDotPopup;
