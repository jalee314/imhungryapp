/**
 * @file FullScreenImageModal — Zoomable full-screen image overlay.
 *
 * Extracted from the original DealDetailScreen inline Modal block.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';

import { STATIC } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { ImageViewerState } from '../types';

export interface FullScreenImageModalProps {
  imageViewer: ImageViewerState;
}

export function FullScreenImageModal({ imageViewer }: FullScreenImageModalProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    isVisible,
    close,
    fullScreenImageSource,
    modalImageLoading,
    modalImageError,
    setModalImageLoading,
    setModalImageError,
    imageViewerKey,
  } = imageViewer;

  if (!fullScreenImageSource) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      onRequestClose={close}
    >
      <Box flex={1} center bg="rgba(0, 0, 0, 0.9)">
        <TouchableOpacity
          style={styles.closeButton}
          onPress={close}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>

        {modalImageLoading && (
          <ActivityIndicator size="large" color={STATIC.white} style={styles.loader} />
        )}

        <ScrollView
          key={imageViewerKey}
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          bouncesZoom
          centerContent
        >
          <Image
            source={typeof fullScreenImageSource === 'string' ? { uri: fullScreenImageSource } : fullScreenImageSource}
            style={styles.fullScreenImage}
            resizeMode="contain"
            onLoad={() => setModalImageLoading(false)}
            onError={() => {
              setModalImageLoading(false);
              setModalImageError(true);
            }}
          />
        </ScrollView>

        {modalImageError && (
          <Box position="absolute" center>
            <Text color={STATIC.white} size="md">Could not load image</Text>
          </Box>
        )}
      </Box>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  loader: {
    position: 'absolute',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
  },
});
