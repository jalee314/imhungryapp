import { Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import React from 'react';
import { Modal, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet } from 'react-native';

import { STATIC, GRAY, SPACING, RADIUS, BORDER_WIDTH, SEMANTIC } from '../../../ui/alf';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';

interface DealEditModalProps {
  visible: boolean;
  imageUri: string | null;
  title: string;
  description: string;
  onClose: () => void;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onDelete: () => void;
}

const DealEditModal: React.FC<DealEditModalProps> = ({
  visible,
  imageUri,
  title,
  description,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onPickImage,
  onRemoveImage,
  onSave,
  onDelete,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <Box flex={1} bg="rgba(0,0,0,0.5)" justify="flex-end">
      <Box bg={STATIC.white} rounded="xl" p="xl" maxH="80%"
        style={styles.modalSheet}>
        <Box row justify="space-between" align="center" mb="xl">
          <Text size="xl" weight="bold" color={STATIC.black}>Edit Deal</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={STATIC.black} />
          </TouchableOpacity>
        </Box>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text size="sm" weight="semibold" color={GRAY[800]} style={styles.sectionLabel}>
            Deal Image
          </Text>
          {imageUri ? (
            <Box position="relative" w="100%" h={200} mb="lg" rounded="md" overflow="hidden">
              <Image source={{ uri: imageUri }} style={styles.fullImage} />
              <TouchableOpacity
                onPress={onRemoveImage}
                style={styles.removeImageButton}
              >
                <Ionicons name="close-circle" size={24} color={SEMANTIC.error} />
              </TouchableOpacity>
            </Box>
          ) : (
            <TouchableOpacity
              onPress={onPickImage}
              style={styles.addImageButton}
            >
              <Ionicons name="camera" size={32} color={GRAY[600]} />
              <Text size="sm" color={GRAY[600]} style={styles.addImageLabel}>Add Photo</Text>
            </TouchableOpacity>
          )}

          <Text size="sm" weight="semibold" color={GRAY[800]} style={styles.sectionLabel}>
            Title
          </Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={onTitleChange}
            multiline
          />

          <Text size="sm" weight="semibold" color={GRAY[800]} style={styles.sectionLabel}>
            Description
          </Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={4}
          />

          <Box gap="md" mt="sm">
            <TouchableOpacity
              onPress={onSave}
              style={[styles.actionButton, styles.saveButton]}
            >
              <Ionicons name="save" size={20} color={STATIC.white} />
              <Text size="sm" weight="semibold" color={STATIC.white}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Monicon name="uil:trash-alt" size={20} color={STATIC.white} />
              <Text size="sm" weight="semibold" color={STATIC.white}>Delete Deal</Text>
            </TouchableOpacity>
          </Box>
        </ScrollView>
      </Box>
    </Box>
  </Modal>
);

const styles = StyleSheet.create({
  modalSheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sectionLabel: {
    marginBottom: SPACING.sm,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: RADIUS.lg,
  },
  addImageButton: {
    backgroundColor: GRAY[100],
    borderWidth: BORDER_WIDTH.medium,
    borderColor: GRAY[300],
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  addImageLabel: {
    marginTop: SPACING.sm,
  },
  titleInput: {
    borderWidth: BORDER_WIDTH.thin,
    borderColor: GRAY[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  descriptionInput: {
    borderWidth: BORDER_WIDTH.thin,
    borderColor: GRAY[300],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  saveButton: {
    backgroundColor: SEMANTIC.success,
  },
  deleteButton: {
    backgroundColor: SEMANTIC.error,
  },
});

export default DealEditModal;
