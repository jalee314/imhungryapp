/**
 * @file DeleteAccountModal — Confirmation modal that requires typing
 * "DELETE ACCOUNT" before the action is allowed.
 *
 * Moved from ProfilePage.tsx into its own feature-scoped section component
 * and restyled with ALF tokens. Behaviour is unchanged.
 */

import React, { useState } from 'react';
import {
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import {
  STATIC,
  GRAY,
  SEMANTIC,
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  ALPHA_COLORS,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

// ============================================================================
// Props
// ============================================================================

const CONFIRMATION_PHRASE = 'DELETE ACCOUNT';

export interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function DeleteAccountModal({ visible, onClose, onConfirm }: DeleteAccountModalProps) {
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Box flex={1} bg={ALPHA_COLORS.blackOverlay80} justify="flex-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <Box px="lg" pb="4xl">
                <Box bg={STATIC.white} rounded="xl" p="xl" mb="sm">
                  <Text size="xl" weight="bold" color={SEMANTIC.errorDark} textAlign="center" mb="md">
                    Delete Account
                  </Text>
                  <Text size="md" weight="semibold" color={SEMANTIC.errorDark} textAlign="center" mb="md">
                    ⚠️ This action is permanent and cannot be undone.
                  </Text>
                  <Text size="sm" color={GRAY[700]} textAlign="center" mb="lg" style={{ lineHeight: 20 }}>
                    All your data, posts, and account information will be permanently deleted.
                  </Text>
                  <Text size="sm" color={GRAY[800]} textAlign="center" mb="md">
                    To confirm, type{' '}
                    <Text weight="bold" color={SEMANTIC.errorDark}>
                      {CONFIRMATION_PHRASE}
                    </Text>{' '}
                    below:
                  </Text>
                  <TextInput
                    style={s.input}
                    value={confirmationText}
                    onChangeText={setConfirmationText}
                    placeholder="Type DELETE ACCOUNT"
                    placeholderTextColor={GRAY[500]}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[s.deleteButton, !isConfirmEnabled && s.deleteButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={!isConfirmEnabled}
                  >
                    <Text
                      size="md"
                      weight="semibold"
                      color={isConfirmEnabled ? STATIC.white : GRAY[500]}
                    >
                      Permanently Delete Account
                    </Text>
                  </TouchableOpacity>
                </Box>
                <TouchableOpacity style={s.cancelButton} onPress={handleClose}>
                  <Text size="md" weight="medium" color={STATIC.black}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  input: {
    borderWidth: 2,
    borderColor: GRAY[300],
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: GRAY[50],
  },
  deleteButton: {
    backgroundColor: SEMANTIC.errorDark,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: GRAY[300],
  },
  cancelButton: {
    backgroundColor: STATIC.white,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
});
