/**
 * @file LogoutModal — Bottom-sheet confirmation for logging out.
 *
 * Purely presentational.
 */

import React from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';

import {
  STATIC,
  RADIUS,
  SPACING,
  ALPHA_COLORS,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

// ============================================================================
// Props
// ============================================================================

export interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function LogoutModal({ visible, onClose, onConfirm }: LogoutModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Box flex={1} bg={ALPHA_COLORS.blackOverlay80} justify="flex-end">
          <TouchableWithoutFeedback onPress={() => {}}>
            <Box px="lg" pb={90}>
              <Box bg={STATIC.white} rounded="card" mb="sm">
                <TouchableOpacity style={s.option} onPress={onConfirm}>
                  <Text size="md" weight="medium" color={STATIC.black} style={s.fontInter}>
                    Log Out
                  </Text>
                </TouchableOpacity>
              </Box>
              <TouchableOpacity style={s.cancel} onPress={onClose}>
                <Text size="md" weight="medium" color={STATIC.black} style={s.fontInter}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </Box>
          </TouchableWithoutFeedback>
        </Box>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  option: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: STATIC.white,
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  fontInter: { fontFamily: 'Inter' },
});
