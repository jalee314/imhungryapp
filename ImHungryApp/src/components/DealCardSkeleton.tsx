import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { tokens, atoms as a } from '#/ui';

const { width: screenWidth } = Dimensions.get('window');
// Calculate dynamic card width: subtract horizontal padding (20px) and gap between cards (4px), then divide by 2
const HORIZONTAL_PADDING = 20; // 10px on each side
const CARD_GAP = 4; // 2px padding on each card (halved for tighter spacing)
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;

// Calculate horizontal card width to align with header location icon
const HORIZONTAL_CARD_PADDING = 10; // Left padding for horizontal scroll
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - 20) / 1.32;

interface DealCardSkeletonProps {
  variant?: 'horizontal' | 'vertical';
}

const DealCardSkeleton: React.FC<DealCardSkeletonProps> = ({ variant = 'vertical' }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startShimmer());
    };

    startShimmer();
  }, [shimmerAnimation]);

  const shimmerStyle = {
    opacity: shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  if (variant === 'horizontal') {
    return (
      <View style={styles.horizontalCard}>
        {/* Image skeleton */}
        <Animated.View style={[styles.horizontalImage, styles.skeleton, shimmerStyle]} />
        
        {/* Title skeleton */}
        <View style={styles.horizontalTitleContainer}>
          <Animated.View style={[styles.horizontalTitleSkeleton, styles.skeleton, shimmerStyle]} />
        </View>
        
        {/* Details skeleton */}
        <Animated.View style={[styles.horizontalDetailsSkeleton, styles.skeleton, shimmerStyle]} />
        
        {/* Interactions skeleton */}
        <View style={styles.horizontalInteractions}>
          <Animated.View style={[styles.horizontalVoteContainerSkeleton, styles.skeleton, shimmerStyle]} />
          <Animated.View style={[styles.horizontalFavoriteSkeleton, styles.skeleton, shimmerStyle]} />
        </View>
      </View>
    );
  }

  // Vertical variant
  return (
    <View style={styles.verticalCard}>
      {/* Image skeleton */}
      <Animated.View style={[styles.verticalImage, styles.skeleton, shimmerStyle]} />
      
      {/* Title skeleton */}
      <Animated.View style={[styles.verticalTitleSkeleton, styles.skeleton, shimmerStyle]} />
      
      {/* Details skeleton */}
      <Animated.View style={[styles.verticalDetailsSkeleton, styles.skeleton, shimmerStyle]} />
      
      {/* Interactions skeleton */}
      <View style={styles.verticalInteractions}>
        <Animated.View style={[styles.verticalVoteContainerSkeleton, styles.skeleton, shimmerStyle]} />
        <Animated.View style={[styles.verticalFavoriteSkeleton, styles.skeleton, shimmerStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: tokens.color.gray_200,
  },
  
  // Horizontal Card Styles (matching DealCard dimensions exactly)
  horizontalCard: {
    ...a.bg_white,
    ...a.rounded_md,
    ...a.py_md,
    ...a.px_sm,
    ...a.align_start,
    ...a.justify_center,
    width: HORIZONTAL_CARD_WIDTH,
    height: 280,
  },
  horizontalImage: {
    ...a.rounded_sm,
    ...a.mb_sm,
    width: 260,
    height: 167,
  },
  horizontalTitleContainer: {
    ...a.w_full,
    ...a.mb_sm,
    ...a.justify_start,
    height: 30,
  },
  horizontalTitleSkeleton: {
    ...a.mb_xs,
    width: '90%',
    height: 12,
    borderRadius: 6,
  },
  horizontalDetailsSkeleton: {
    ...a.w_full,
    ...a.rounded_xs,
    ...a.mb_sm,
    height: 24,
  },
  horizontalInteractions: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.w_full,
  },
  horizontalVoteContainerSkeleton: {
    ...a.rounded_full,
    width: 80,
    height: 28,
  },
  horizontalFavoriteSkeleton: {
    ...a.rounded_full,
    width: 62,
    height: 28,
  },

  // Vertical Card Styles (matching DealCard dimensions exactly)
  verticalCard: {
    ...a.bg_white,
    ...a.rounded_lg,
    ...a.p_sm,
    ...a.align_start,
    ...a.justify_start,
    width: VERTICAL_CARD_WIDTH,
  },
  verticalImage: {
    ...a.w_full,
    ...a.rounded_sm,
    ...a.mb_sm,
    height: 175,
  },
  verticalTitleSkeleton: {
    ...a.rounded_xs,
    ...a.mb_sm,
    width: VERTICAL_CARD_WIDTH - 24,
    height: 30,
  },
  verticalDetailsSkeleton: {
    ...a.rounded_xs,
    ...a.mb_sm,
    width: VERTICAL_CARD_WIDTH - 24,
    height: 24,
  },
  verticalInteractions: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.w_full,
  },
  verticalVoteContainerSkeleton: {
    ...a.rounded_full,
    width: 70,
    height: 28,
  },
  verticalFavoriteSkeleton: {
    ...a.rounded_full,
    width: 40,
    height: 28,
  },
});

export default DealCardSkeleton;
