import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
// Calculate dynamic card width: subtract horizontal padding (20px) and gap between cards (8px), then divide by 2
const HORIZONTAL_PADDING = 20; // 10px on each side
const CARD_GAP = 8; // 4px padding on each card
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;

// Calculate horizontal card width to show ~1.5 cards (first card fully visible, half of second card visible)
const HORIZONTAL_CARD_PADDING = 10; // Left padding for horizontal scroll
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - 20) / 1.5;

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
    backgroundColor: '#E0E0E0',
  },
  
  // Horizontal Card Styles (matching DealCard dimensions exactly)
  horizontalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: HORIZONTAL_CARD_WIDTH,
    height: 273,
    justifyContent: 'center',
  },
  horizontalImage: {
    width: '100%',
    height: 144,
    borderRadius: 8,
    marginBottom: 8,
  },
  horizontalTitleContainer: {
    width: '100%',
    marginBottom: 8,
    height: 30,
    justifyContent: 'flex-start',
  },
  horizontalTitleSkeleton: {
    width: '90%',
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  horizontalDetailsSkeleton: {
    width: '100%',
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  horizontalInteractions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  horizontalVoteContainerSkeleton: {
    width: 80,
    height: 28,
    borderRadius: 30,
  },
  horizontalFavoriteSkeleton: {
    width: 62,
    height: 28,
    borderRadius: 30,
  },

  // Vertical Card Styles (matching DealCard dimensions exactly)
  verticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    width: VERTICAL_CARD_WIDTH,
    height: 266,
    justifyContent: 'space-between',
  },
  verticalImage: {
    width: '100%',
    height: 144,
    borderRadius: 8,
    marginBottom: 8,
  },
  verticalTitleSkeleton: {
    width: VERTICAL_CARD_WIDTH - 24,
    height: 30,
    borderRadius: 4,
    marginBottom: 8,
  },
  verticalDetailsSkeleton: {
    width: VERTICAL_CARD_WIDTH - 24,
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  verticalInteractions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  verticalVoteContainerSkeleton: {
    width: 70,
    height: 28,
    borderRadius: 30,
  },
  verticalFavoriteSkeleton: {
    width: 40,
    height: 28,
    borderRadius: 30,
  },
});

export default DealCardSkeleton;
