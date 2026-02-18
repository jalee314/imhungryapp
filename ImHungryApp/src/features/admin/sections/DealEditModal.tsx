import React from 'react';
import { Modal, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { Box } from '../../../ui/primitives/Box';
import { Text } from '../../../ui/primitives/Text';
import { BRAND, STATIC, GRAY, SPACING, RADIUS, BORDER_WIDTH, SEMANTIC } from '../../../ui/alf';

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
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <Box row justify="space-between" align="center" mb="xl">
          <Text size="xl" weight="bold" color={STATIC.black}>Edit Deal</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={STATIC.black} />
          </TouchableOpacity>
        </Box>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text size="sm" weight="semibold" color={GRAY[800]} style={{ marginBottom: SPACING.sm }}>
            Deal Image
          </Text>
          {imageUri ? (
            <Box position="relative" w="100%" h={200} mb="lg" rounded="md" overflow="hidden">
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
              <TouchableOpacity
                onPress={onRemoveImage}
                style={{
                  position: 'absolute',
                  top: SPACING.sm,
                  right: SPACING.sm,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: RADIUS.lg,
                }}
              >
                <Ionicons name="close-circle" size={24} color={SEMANTIC.error} />
              </TouchableOpacity>
            </Box>
          ) : (
            <TouchableOpacity
              onPress={onPickImage}
              style={{
                backgroundColor: GRAY[100],
                borderWidth: BORDER_WIDTH.medium,
                borderColor: GRAY[300],
                borderStyle: 'dashed',
                borderRadius: RADIUS.md,
                padding: SPACING['3xl'],
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Ionicons name="camera" size={32} color={GRAY[600]} />
              <Text size="sm" color={GRAY[600]} style={{ marginTop: SPACING.sm }}>Add Photo</Text>
            </TouchableOpacity>
          )}

          <Text size="sm" weight="semibold" color={GRAY[800]} style={{ marginBottom: SPACING.sm }}>
            Title
          </Text>
          <TextInput
            style={{
              borderWidth: BORDER_WIDTH.thin,
              borderColor: GRAY[300],
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
              fontSize: 14,
              marginBottom: SPACING.lg,
            }}
            value={title}
            onChangeText={onTitleChange}
            multiline
          />

          <Text size="sm" weight="semibold" color={GRAY[800]} style={{ marginBottom: SPACING.sm }}>
            Description
          </Text>
          <TextInput
            style={{
              borderWidth: BORDER_WIDTH.thin,
              borderColor: GRAY[300],
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
              fontSize: 14,
              minHeight: 100,
              textAlignVertical: 'top',
              marginBottom: SPACING.lg,
            }}
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={4}
          />

          <Box gap="md" mt="sm">
            <TouchableOpacity
              onPress={onSave}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: SPACING.md,
                borderRadius: RADIUS.md,
                gap: SPACING.sm,
                backgroundColor: SEMANTIC.success,
              }}
            >
              <Ionicons name="save" size={20} color={STATIC.white} />
              <Text size="sm" weight="semibold" color={STATIC.white}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: SPACING.md,
                borderRadius: RADIUS.md,
                gap: SPACING.sm,
                backgroundColor: SEMANTIC.error,
              }}
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

export default DealEditModal;
