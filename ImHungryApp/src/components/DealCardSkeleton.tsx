import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

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
  
  // Horizontal Card Styles (matching DealCard dimensions)
  horizontalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 220,
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
    width: '85%',
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
    height: 24,
    borderRadius: 30,
  },
  horizontalFavoriteSkeleton: {
    width: 62,
    height: 28,
    borderRadius: 30,
  },

  // Vertical Card Styles (matching DealCard dimensions)
  verticalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    width: 185,
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
    width: '90%',
    height: 30,
    borderRadius: 4,
    marginBottom: 8,
  },
  verticalDetailsSkeleton: {
    width: 161,
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
    height: 24,
    borderRadius: 30,
  },
  verticalFavoriteSkeleton: {
    width: 40,
    height: 28,
    borderRadius: 30,
  },
});

export default DealCardSkeleton;
