/**
 * DraggableThumbnailStrip - Reorderable Image Thumbnail Strip
 * 
 * A horizontal strip of draggable image thumbnails for reordering.
 * Uses atomic components where applicable while preserving gesture handling.
 */

import React, { useCallback, useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Box } from './atoms';
import { colors, borderRadius, spacing } from '../lib/theme';
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
    return {
      transform: [
        { translateX: offset !== 0 ? withTiming(offset, { duration: 150 }) : 0 },
      ],
      zIndex: 0,
    };
  }, [isDragging, offset]);

  const getBorderColor = () => {
    if (isCover) return '#FFD700';
    if (isSelected) return colors.primaryDark;
    return 'rgba(200, 200, 200, 0.3)';
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            borderRadius: borderRadius.s,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: getBorderColor(),
          }}
        >
          <Image 
            source={{ uri: item.url }} 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: 6 
            }} 
          />
          {isCover && (
            <Box
              absolute
              top={2}
              right={2}
              bg="overlay"
              rounded="sm"
              p={2}
            >
              <Ionicons name="star" size={8} color="#FFD700" />
            </Box>
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const DraggableThumbnailStrip: React.FC<DraggableThumbnailStripProps> = ({
  images,
  currentIndex,
  onThumbnailPress,
  onReorder,
  onAddPress,
  maxPhotos,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

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
    setDraggingIndex(null);
    setTargetIndex(null);
    
    if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
      onReorder(fromIndex, toIndex);
    }
  }, [onReorder]);

  const cancelDragging = useCallback(() => {
    setDraggingIndex(null);
    setTargetIndex(null);
  }, []);

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
        
        const threshold = ITEM_WIDTH * 0.4;
        const adjustedX = event.translationX > 0 
          ? Math.max(0, event.translationX - threshold)
          : Math.min(0, event.translationX + threshold);
        const rawOffset = Math.round(adjustedX / ITEM_WIDTH);
        
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
    <Box row px="m" py="m" gap={GAP}>
      {images.map((item, index) => {
        const isDragging = draggingIndex === index;
        const offset = getItemOffset(index, draggingIndex, targetIndex);
        
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
        <TouchableOpacity
          onPress={onAddPress}
          style={{
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            borderRadius: borderRadius.s,
            borderWidth: 1.5,
            borderColor: colors.primaryDark,
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 140, 76, 0.08)',
          }}
        >
          <Ionicons name="add" size={20} color={colors.primaryDark} />
        </TouchableOpacity>
      )}
    </Box>
  );
};

export default DraggableThumbnailStrip;
