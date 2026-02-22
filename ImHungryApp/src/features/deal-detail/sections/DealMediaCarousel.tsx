/**
 * @file DealMediaCarousel — Image carousel / single-image display with skeleton placeholders.
 *
 * Handles all three render states: carousel, skeleton-while-loading, and single-image fallback.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import {
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import OptimizedImage from '../../../components/OptimizedImage';
import SkeletonLoader from '../../../components/SkeletonLoader';
import type { Deal } from '../../../types/deal';
import { GRAY, RADIUS, BORDER_WIDTH, BRAND } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { ImageCarouselState } from '../types';

const { width: screenWidth } = Dimensions.get('window');

export interface DealMediaCarouselProps {
  dealData: Deal;
  carousel: ImageCarouselState;
  imagesForCarousel: string[] | null;
  onOpenImageViewer: () => void;
}

function DealMediaCarouselComponent({
  dealData,
  carousel,
  imagesForCarousel,
  onOpenImageViewer,
}: DealMediaCarouselProps) {
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
  const carouselWidth = screenWidth - 48;

  const handleCarouselScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    if (!imagesForCarousel) return;
    if (index !== currentImageIndex && index >= 0 && index < imagesForCarousel.length) {
      setCurrentImageIndex(index);
    }
  }, [carouselWidth, currentImageIndex, imagesForCarousel, setCurrentImageIndex]);

  const keyExtractor = useCallback((item: string, index: number) => {
    const imageKey = item || `image-${index}`;
    return `detail-image-${index}-${imageKey}`;
  }, []);

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <TouchableOpacity
        onPress={() => {
          setCurrentImageIndex(index);
          onOpenImageViewer();
        }}
        style={{ width: carouselWidth }}
      >
        <Image
          source={{ uri: item }}
          style={[
            styles.dealImage,
            { width: carouselWidth },
            imageDimensions
              ? { height: (imageDimensions.height / imageDimensions.width) * 350 }
              : { height: 350 },
            imageLoading && { opacity: 0 },
          ]}
          resizeMode="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </TouchableOpacity>
    ),
    [
      carouselWidth,
      handleImageError,
      handleImageLoad,
      imageDimensions,
      imageLoading,
      onOpenImageViewer,
      setCurrentImageIndex,
    ],
  );

  // ---- Carousel (multiple images from server) ----------------------------
  if (imagesForCarousel && imagesForCarousel.length > 0) {
    return (
      <Box px="2xl" mb="lg">
        <Box
          style={[
            styles.imageWrapper,
            imageLoading && { minHeight: Math.max(skeletonHeight, 200), borderWidth: 0 },
          ]}
        >
          {imageLoading && (
            <Box absoluteFill bg={GRAY[75]} rounded={RADIUS.card} style={{ zIndex: 1 }}>
              <SkeletonLoader
                width="100%"
                height={Math.max(skeletonHeight, 200)}
                borderRadius={RADIUS.card}
              />
            </Box>
          )}
          <FlatList
            data={imagesForCarousel}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            pagingEnabled
            scrollEnabled={imagesForCarousel.length > 1}
            decelerationRate="fast"
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
            keyExtractor={keyExtractor}
            getItemLayout={(_, index) => ({
              length: carouselWidth,
              offset: carouselWidth * index,
              index,
            })}
            renderItem={renderCarouselItem}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
          />
        </Box>

        {/* Pagination dots */}
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

  // ---- Skeleton while waiting for fresh data ------------------------------
  if (!hasFetchedFreshImages) {
    return (
      <Box px="2xl" mb="lg">
        <Box style={[styles.imageWrapper, { minHeight: Math.max(skeletonHeight, 200), borderWidth: 0 }]}>
          <Box absoluteFill bg={GRAY[75]} rounded={RADIUS.card} style={{ zIndex: 1 }}>
            <SkeletonLoader
              width="100%"
              height={Math.max(skeletonHeight, 200)}
              borderRadius={RADIUS.card}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // ---- Single image fallback ----------------------------------------------
  return (
    <TouchableOpacity onPress={onOpenImageViewer} disabled={imageLoading}>
      <Box px="2xl" mb="lg">
        <Box
          style={[
            styles.imageWrapper,
            imageLoading && { minHeight: Math.max(skeletonHeight, 200), borderWidth: 0 },
          ]}
        >
          {imageLoading && (
            <Box absoluteFill bg={GRAY[75]} rounded={RADIUS.card} style={{ zIndex: 1 }}>
              <SkeletonLoader
                width="100%"
                height={Math.max(skeletonHeight, 200)}
                borderRadius={RADIUS.card}
              />
            </Box>
          )}

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
                imageDimensions && {
                  height: (imageDimensions.height / imageDimensions.width) * 350,
                },
                imageLoading && { opacity: 0 },
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
                imageDimensions && {
                  height: (imageDimensions.height / imageDimensions.width) * 350,
                },
                imageLoading && { opacity: 0 },
              ]}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="cover"
            />
          ))}

          {imageError && (
            <Box absoluteFill center bg={GRAY[75]} rounded={RADIUS.card} style={{ zIndex: 1 }}>
              <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
              <Text size="sm" color="#999" style={{ fontFamily: 'Inter' }} mt="sm">
                Failed to load image
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </TouchableOpacity>
  );
}

export const DealMediaCarousel = memo(DealMediaCarouselComponent);

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
});
