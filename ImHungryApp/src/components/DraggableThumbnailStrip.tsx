import React, { useCallback, useState, useMemo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BRAND, SEMANTIC, ALPHA_COLORS } from '../ui/alf';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  getVisualIndex,
  getItemOffset,
  THUMBNAIL_SIZE,
  GAP,
  ITEM_WIDTH,
} from '../utils/dragHelpers';

interface ImageItem {
  imageMetadataId: string;
  url: string;
}

interface DraggableThumbnailStripProps {
  images: ImageItem[];
  currentIndex: number;
  onThumbnailPress: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAddPress: () => void;
  maxPhotos: number;
}

const DraggableThumbnailStrip: React.FC<DraggableThumbnailStripProps> = ({
  images,
  currentIndex,
  onThumbnailPress,
  onReorder,
  onAddPress,
  maxPhotos,
}) => {
  // Track which item is being dragged and to what position
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  // Shared values for dragged item
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const activeIndex = useSharedValue(-1);
  const currentTarget = useSharedValue(-1);

  const updateTargetIndex = useCallback((newTarget: number) => {
    setTargetIndex(newTarget);
  }, []);

  const startDragging = useCallback((index: number) => {
    setDraggingIndex(index);
    setTargetIndex(index);
  }, []);

  const endDragging = useCallback((fromIndex: number, toIndex: number) => {
    // Clear state BEFORE calling onReorder so items don't animate back
    // The reorder will change the array, so items are already in correct positions
    setDraggingIndex(null);
    setTargetIndex(null);

    if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
      // Pass toIndex so parent knows where the image ended up
      onReorder(fromIndex, toIndex);
    }
  }, [onReorder]);

  const cancelDragging = useCallback(() => {
    setDraggingIndex(null);
    setTargetIndex(null);
  }, []);

  // Memoize the number of images to avoid stale closures
  const imageCount = images.length;

  const createGesture = useCallback((index: number) => {
    return Gesture.Pan()
      .activateAfterLongPress(200)
      .onStart(() => {
        'worklet';
        activeIndex.value = index;
        currentTarget.value = index;
        dragScale.value = withSpring(1.15);
        runOnJS(startDragging)(index);
      })
      .onUpdate((event) => {
        'worklet';
        dragX.value = event.translationX;
        dragY.value = event.translationY * 0.3;

        // Add hysteresis: need to move 40% past threshold to switch
        const threshold = ITEM_WIDTH * 0.4;
        const adjustedX = event.translationX > 0
          ? Math.max(0, event.translationX - threshold)
          : Math.min(0, event.translationX + threshold);
        const rawOffset = Math.round(adjustedX / ITEM_WIDTH);

        // Clamp to valid range (0 to imageCount-1)
        // If dragged past the last item (onto add button), clamp to last valid position
        const maxIndex = imageCount - 1;
        const newTarget = Math.max(0, Math.min(maxIndex, index + rawOffset));

        if (newTarget !== currentTarget.value) {
          currentTarget.value = newTarget;
          runOnJS(updateTargetIndex)(newTarget);
        }
      })
      .onEnd(() => {
        'worklet';
        const finalTarget = currentTarget.value;
        const fromIdx = activeIndex.value;

        dragX.value = withSpring(0);
        dragY.value = withSpring(0);
        dragScale.value = withSpring(1);
        activeIndex.value = -1;
        currentTarget.value = -1;

        runOnJS(endDragging)(fromIdx, finalTarget);
      })
      .onFinalize(() => {
        'worklet';
        dragX.value = withSpring(0);
        dragY.value = withSpring(0);
        dragScale.value = withSpring(1);
        activeIndex.value = -1;
        currentTarget.value = -1;
        runOnJS(cancelDragging)();
      });
  }, [imageCount, startDragging, updateTargetIndex, endDragging, cancelDragging, dragX, dragY, dragScale, activeIndex, currentTarget]);

  return (
    <View style={styles.container}>
      {images.map((item, index) => {
        const isDragging = draggingIndex === index;
        const offset = getItemOffset(index, draggingIndex, targetIndex);

        // Calculate if this item will be the cover after reorder
        const visualIndex = draggingIndex !== null && targetIndex !== null
          ? getVisualIndex(index, draggingIndex, targetIndex)
          : index;
        const willBeCover = visualIndex === 0;

        return (
          <DraggableItem
            key={item.imageMetadataId}
            item={item}
            index={index}
            isSelected={currentIndex === index}
            isCover={willBeCover}
            isDragging={isDragging}
            offset={offset}
            dragX={dragX}
            dragY={dragY}
            dragScale={dragScale}
            gesture={createGesture(index)}
            onPress={() => onThumbnailPress(index)}
          />
        );
      })}

      {/* Add more button */}
      {images.length < maxPhotos && (
        <TouchableOpacity style={styles.addPhotoButton} onPress={onAddPress}>
          <Ionicons name="add" size={20} color={BRAND.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface DraggableItemProps {
  item: ImageItem;
  index: number;
  isSelected: boolean;
  isCover: boolean;
  isDragging: boolean;
  offset: number;
  dragX: Animated.SharedValue<number>;
  dragY: Animated.SharedValue<number>;
  dragScale: Animated.SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Pan>;
  onPress: () => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  isSelected,
  isCover,
  isDragging,
  offset,
  dragX,
  dragY,
  dragScale,
  gesture,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (isDragging) {
      return {
        transform: [
          { translateX: dragX.value },
          { translateY: dragY.value },
          { scale: dragScale.value },
        ],
        zIndex: 100,
      };
    }
    // Non-dragged items slide smoothly during drag preview
    // When offset becomes 0 (after drop), no animation needed - instant snap
    return {
      transform: [
        { translateX: offset !== 0 ? withTiming(offset, { duration: 150 }) : 0 },
      ],
      zIndex: 0,
    };
  }, [isDragging, offset]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.thumbnailWrapper, animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.thumbnail,
            isSelected && styles.thumbnailSelected,
            isCover && styles.thumbnailIsCover,
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
          {isCover && (
            <View style={styles.thumbnailCoverBadge}>
              <Ionicons name="star" size={8} color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: GAP,
  },
  thumbnailWrapper: {
    // Wrapper for animation
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(200, 200, 200, 0.3)',
  },
  thumbnailSelected: {
    borderColor: BRAND.primary,
  },
  thumbnailIsCover: {
    borderColor: SEMANTIC.warning,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  thumbnailCoverBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 2,
  },
  addPhotoButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 76, 0.08)',
  },
});

export default DraggableThumbnailStrip;
