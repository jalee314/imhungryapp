/**
 * @file DealMediaCarousel — Image carousel / single-image display with skeleton placeholders.
 *
 * Handles all three render states: carousel, skeleton-while-loading, and single-image fallback.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';

import OptimizedImage from '../../../components/OptimizedImage';
import SkeletonLoader from '../../../components/SkeletonLoader';
import type { Deal } from '../../../types/deal';
import { GRAY, RADIUS, BORDER_WIDTH, BRAND } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { ImageCarouselState } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = screenWidth - 48;

export interface DealMediaCarouselProps {
  dealData: Deal;
  carousel: ImageCarouselState;
  imagesForCarousel: string[] | null;
  onOpenImageViewer: () => void;
}

function MediaSkeletonOverlay({ loadingSkeletonHeight }: { loadingSkeletonHeight: number }) {
  return (
    <Box absoluteFill bg={GRAY[75]} rounded={RADIUS.card} style={styles.overlayTop}>
      <SkeletonLoader
        width="100%"
        height={loadingSkeletonHeight}
        borderRadius={RADIUS.card}
      />
    </Box>
  );
}

interface CarouselMediaBlockProps {
  carouselRef: React.RefObject<FlatList>;
  imagesForCarousel: string[];
  currentImageIndex: number;
  setCurrentImageIndex: ImageCarouselState['setCurrentImageIndex'];
  imageLoading: boolean;
  loadingSkeletonHeight: number;
  loadingWrapperNoBorderStyle: { minHeight: number; borderWidth: number };
  carouselImageHeightStyle: { height: number };
  handleImageLoad: ImageCarouselState['handleImageLoad'];
  handleImageError: ImageCarouselState['handleImageError'];
  onOpenImageViewer: () => void;
}

function CarouselMediaBlock({
  carouselRef,
  imagesForCarousel,
  currentImageIndex,
  setCurrentImageIndex,
  imageLoading,
  loadingSkeletonHeight,
  loadingWrapperNoBorderStyle,
  carouselImageHeightStyle,
  handleImageLoad,
  handleImageError,
  onOpenImageViewer,
}: CarouselMediaBlockProps) {
  return (
    <Box px="2xl" mb="lg">
      <Box
        style={[
          styles.imageWrapper,
          imageLoading ? loadingWrapperNoBorderStyle : undefined,
        ]}
      >
        {imageLoading && <MediaSkeletonOverlay loadingSkeletonHeight={loadingSkeletonHeight} />}
        <FlatList
          ref={carouselRef}
          data={imagesForCarousel}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          pagingEnabled
          scrollEnabled={imagesForCarousel.length > 1}
          decelerationRate="fast"
          onScroll={(event) => {
            const contentWidth = CAROUSEL_ITEM_WIDTH;
            const index = Math.round(event.nativeEvent.contentOffset.x / contentWidth);
            if (index !== currentImageIndex && index >= 0 && index < imagesForCarousel.length) {
              setCurrentImageIndex(index);
            }
          }}
          scrollEventThrottle={16}
          keyExtractor={(_, index) => `detail-image-${index}`}
          getItemLayout={(_, index) => ({
            length: CAROUSEL_ITEM_WIDTH,
            offset: CAROUSEL_ITEM_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => {
                setCurrentImageIndex(index);
                onOpenImageViewer();
              }}
              style={styles.carouselItemTouchable}
            >
              <Image
                source={{ uri: item }}
                style={[
                  styles.dealImage,
                  styles.carouselImage,
                  carouselImageHeightStyle,
                  imageLoading ? styles.hiddenImage : undefined,
                ]}
                resizeMode="cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </TouchableOpacity>
          )}
        />
      </Box>

      {imagesForCarousel.length > 1 && (
        <Box row justify="center" align="center" mt={10} mb={5}>
          {imagesForCarousel.map((_, index) => (
            <Box
              key={`dot-${index}`}
              w={currentImageIndex === index ? 10 : 8}
              h={currentImageIndex === index ? 10 : 8}
              rounded="full"
              bg={currentImageIndex === index ? BRAND.accent : '#D1D1D1'}
              mx={4}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

interface SingleMediaBlockProps {
  dealData: Deal;
  imageLoading: boolean;
  imageError: boolean;
  loadingSkeletonHeight: number;
  loadingWrapperNoBorderStyle: { minHeight: number; borderWidth: number };
  singleImageHeightStyle?: { height: number };
  handleImageLoad: ImageCarouselState['handleImageLoad'];
  handleImageError: ImageCarouselState['handleImageError'];
  onOpenImageViewer: () => void;
}

function SingleMediaBlock({
  dealData,
  imageLoading,
  imageError,
  loadingSkeletonHeight,
  loadingWrapperNoBorderStyle,
  singleImageHeightStyle,
  handleImageLoad,
  handleImageError,
  onOpenImageViewer,
}: SingleMediaBlockProps) {
  return (
    <TouchableOpacity onPress={onOpenImageViewer} disabled={imageLoading}>
      <Box px="2xl" mb="lg">
        <Box
          style={[
            styles.imageWrapper,
            imageLoading ? loadingWrapperNoBorderStyle : undefined,
          ]}
        >
          {imageLoading && <MediaSkeletonOverlay loadingSkeletonHeight={loadingSkeletonHeight} />}

          {!imageError && (dealData.imageVariants ? (
            <OptimizedImage
              variants={dealData.imageVariants}
              componentType="deal"
              displaySize={{ width: 300, height: 300 }}
              fallbackSource={typeof dealData.image === 'string'
                ? { uri: dealData.image }
                : dealData.image
              }
              style={[
                styles.dealImage,
                singleImageHeightStyle,
                imageLoading ? styles.hiddenImage : undefined,
              ]}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={typeof dealData.image === 'string'
                ? { uri: dealData.image }
                : dealData.image
              }
              style={[
                styles.dealImage,
                singleImageHeightStyle,
                imageLoading ? styles.hiddenImage : undefined,
              ]}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="cover"
            />
          ))}

          {imageError && (
            <Box absoluteFill center bg={GRAY[75]} rounded={RADIUS.card} style={styles.overlayTop}>
              <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
              <Text size="sm" color="#999" style={styles.errorText} mt="sm">
                Failed to load image
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </TouchableOpacity>
  );
}

export function DealMediaCarousel({
  dealData,
  carousel,
  imagesForCarousel,
  onOpenImageViewer,
}: DealMediaCarouselProps) {
  const carouselRef = useRef<FlatList>(null);

  const {
    currentImageIndex,
    setCurrentImageIndex,
    hasFetchedFreshImages,
    imageLoading,
    imageError,
    skeletonHeight,
    imageDimensions,
    handleImageLoad,
    handleImageError,
  } = carousel;
  const loadingSkeletonHeight = Math.max(skeletonHeight, 200);
  const loadingWrapperNoBorderStyle = { minHeight: loadingSkeletonHeight, borderWidth: 0 };
  const carouselImageHeight = imageDimensions
    ? (imageDimensions.height / imageDimensions.width) * 350
    : 350;
  const carouselImageHeightStyle = { height: carouselImageHeight };
  const singleImageHeightStyle = imageDimensions
    ? { height: (imageDimensions.height / imageDimensions.width) * 350 }
    : undefined;

  if (imagesForCarousel && imagesForCarousel.length > 0) {
    return (
      <CarouselMediaBlock
        carouselRef={carouselRef}
        imagesForCarousel={imagesForCarousel}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        imageLoading={imageLoading}
        loadingSkeletonHeight={loadingSkeletonHeight}
        loadingWrapperNoBorderStyle={loadingWrapperNoBorderStyle}
        carouselImageHeightStyle={carouselImageHeightStyle}
        handleImageLoad={handleImageLoad}
        handleImageError={handleImageError}
        onOpenImageViewer={onOpenImageViewer}
      />
    );
  }

  if (!hasFetchedFreshImages) {
    return (
      <Box px="2xl" mb="lg">
        <Box style={[styles.imageWrapper, loadingWrapperNoBorderStyle]}>
          <MediaSkeletonOverlay loadingSkeletonHeight={loadingSkeletonHeight} />
        </Box>
      </Box>
    );
  }

  return (
    <SingleMediaBlock
      dealData={dealData}
      imageLoading={imageLoading}
      imageError={imageError}
      loadingSkeletonHeight={loadingSkeletonHeight}
      loadingWrapperNoBorderStyle={loadingWrapperNoBorderStyle}
      singleImageHeightStyle={singleImageHeightStyle}
      handleImageLoad={handleImageLoad}
      handleImageError={handleImageError}
      onOpenImageViewer={onOpenImageViewer}
    />
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: RADIUS.card,
    backgroundColor: GRAY[150],
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH.hairline,
    borderColor: '#AAAAAA',
  },
  dealImage: {
    width: '100%',
    borderRadius: RADIUS.card,
    alignSelf: 'center',
  },
  carouselImage: {
    width: CAROUSEL_ITEM_WIDTH,
  },
  carouselItemTouchable: {
    width: CAROUSEL_ITEM_WIDTH,
  },
  overlayTop: {
    zIndex: 1,
  },
  hiddenImage: {
    opacity: 0,
  },
  errorText: {
    fontFamily: 'Inter',
  },
});
