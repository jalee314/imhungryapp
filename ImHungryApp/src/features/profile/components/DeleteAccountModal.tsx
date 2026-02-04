/**
 * DeleteAccountModal - Profile Feature Component
 * 
 * Modal for confirming account deletion with typed confirmation.
 * Refactored to use design tokens and atoms.
 */

import React, { useState } from 'react';
import { 
  Modal, 
  TouchableWithoutFeedback, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
} from 'react-native';
import { Box, Text, Pressable } from '../../../components/atoms';
import { colors, spacing, borderRadius, typography } from '../../../lib/theme';

const CONFIRMATION_PHRASE = 'DELETE ACCOUNT';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ 
  visible, 
  onClose, 
  onConfirm 
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmEnabled = confirmationText === CONFIRMATION_PHRASE;

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      setConfirmationText('');
      onConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Box flex={1} bg="overlay" justifyEnd>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Box px="xl" pb="5xl">
                {/* Content Card */}
                <Box bg="background" rounded="xl" p="2xl" mb="m">
                  <Text 
                    size="xl" 
                    weight="bold" 
                    color="error" 
                    align="center" 
                    mb={spacing.l}
                  >
                    Delete Account
                  </Text>
                  
                  <Text 
                    size="base" 
                    weight="semiBold" 
                    color="error" 
                    align="center" 
                    mb={spacing.l}
                  >
                    ⚠️ This action is permanent and cannot be undone.
                  </Text>
                  
                  <Text 
                    size="md" 
                    color="textLight" 
                    align="center" 
                    mb={spacing.xl}
                    lineHeight={20}
                  >
                    All your data, posts, and account information will be permanently deleted.
                  </Text>
                  
                  <Text size="md" color="text" align="center" mb={spacing.l}>
                    To confirm, type{' '}
                    <Text weight="bold" color="error">{CONFIRMATION_PHRASE}</Text>
                    {' '}below:
                  </Text>
                  
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.xl,
                      paddingVertical: spacing.l,
                      fontSize: typography.fontSize.base,
                      fontFamily: typography.fontFamily.regular,
                      textAlign: 'center',
                      marginBottom: spacing.xl,
                      backgroundColor: colors.backgroundAlt,
                    }}
                    value={confirmationText}
                    onChangeText={setConfirmationText}
                    placeholder="Type DELETE ACCOUNT"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  
                  <Pressable
                    onPress={handleConfirm}
                    disabled={!isConfirmEnabled}
                    bg={isConfirmEnabled ? 'error' : 'border'}
                    rounded="md"
                    py="button"
                    alignCenter
                  >
                    <Text 
                      weight="semiBold" 
                      size="base"
                      color={isConfirmEnabled ? 'textInverse' : 'textMuted'}
                    >
                      Permanently Delete Account
                    </Text>
                  </Pressable>
                </Box>

                {/* Cancel Button */}
                <Pressable
                  onPress={handleClose}
                  bg="background"
                  rounded="md"
                  py="xl"
                  alignCenter
                >
                  <Text weight="medium" size="base" color="text">
                    Cancel
                  </Text>
                </Pressable>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DeleteAccountModal;
