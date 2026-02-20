import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import {
  STATIC,
  RADIUS,
} from '../../ui/alf';
import { Box, Text } from '../../ui/primitives';

import { styles } from './DealPreviewScreen.styles';

interface DealPreviewImageViewerModalProps {
  visible: boolean;
  imageUris: string[];
  originalImageUris?: string[];
  currentImageIndex: number;
  setImageViewVisible: (visible: boolean) => void;
  modalImageLoading: boolean;
  setModalImageLoading: (loading: boolean) => void;
  modalImageError: boolean;
  setModalImageError: (error: boolean) => void;
  imageViewerKey: number;
  scrollViewRef: React.RefObject<ScrollView>;
}

export const DealPreviewImageViewerModal: React.FC<DealPreviewImageViewerModalProps> = ({
  visible,
  imageUris,
  originalImageUris,
  currentImageIndex,
  setImageViewVisible,
  modalImageLoading,
  setModalImageLoading,
  modalImageError,
  setModalImageError,
  imageViewerKey,
  scrollViewRef,
}) => {
  if (!imageUris.length || !imageUris[currentImageIndex]) {
    return null;
  }

  return (
    <Modal visible={visible} transparent onRequestClose={() => setImageViewVisible(false)}>
      <Box flex={1} center bg="rgba(0, 0, 0, 0.9)">
        <TouchableOpacity style={styles.imageViewerCloseButton} onPress={() => setImageViewVisible(false)}>
          <Ionicons name="close" size={30} color={STATIC.white} />
        </TouchableOpacity>

        {modalImageLoading ? (
          <ActivityIndicator size="large" color={STATIC.white} style={styles.absolutePosition} />
        ) : null}

        <ScrollView
          key={imageViewerKey}
          ref={scrollViewRef}
          style={styles.imageViewerScroll}
          contentContainerStyle={styles.imageViewerContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          bouncesZoom
          centerContent
        >
          <Image
            source={{ uri: originalImageUris?.[currentImageIndex] || imageUris[currentImageIndex] }}
            style={styles.imageViewerImage}
            resizeMode="contain"
            onLoad={() => setModalImageLoading(false)}
            onError={() => {
              setModalImageLoading(false);
              setModalImageError(true);
            }}
          />
        </ScrollView>

        {modalImageError ? (
          <Box position="absolute" center>
            <Text color={STATIC.white} size="md">
              Could not load image
            </Text>
          </Box>
        ) : null}

        {imageUris.length > 1 ? (
          <Box
            position="absolute"
            bottom={60}
            alignSelf="center"
            bg="rgba(0, 0, 0, 0.6)"
            px="lg"
            py="sm"
            rounded={RADIUS.circle}
          >
            <Text color={STATIC.white} size="sm" weight="semibold">
              {currentImageIndex + 1} / {imageUris.length}
            </Text>
          </Box>
        ) : null}
      </Box>
    </Modal>
  );
};
