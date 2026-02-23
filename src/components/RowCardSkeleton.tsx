import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import { STATIC, GRAY, RADIUS } from '../ui/alf';

const RowCardSkeleton: React.FC = () => {
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

  return (
    <View style={styles.rowCard}>
      <View style={styles.content}>
        {/* Image skeleton */}
        <Animated.View style={[styles.imageSkeleton, styles.skeleton, shimmerStyle]} />

        {/* Text content skeleton */}
        <View style={styles.textFrame}>
          {/* Title skeleton */}
          <Animated.View style={[styles.titleSkeleton, styles.skeleton, shimmerStyle]} />

          {/* Subtitle skeleton */}
          <Animated.View style={[styles.subtitleSkeleton, styles.skeleton, shimmerStyle]} />
        </View>

        {/* Arrow skeleton */}
        <Animated.View style={[styles.arrowSkeleton, styles.skeleton, shimmerStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: GRAY[300],
  },
  rowCard: {
    backgroundColor: STATIC.white,
    borderRadius: RADIUS.lg,
    padding: 8,
    marginHorizontal: 12,
    marginVertical: 4,
    height: 86,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    height: '100%',
  },
  imageSkeleton: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  textFrame: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
    paddingRight: 8,
  },
  titleSkeleton: {
    width: '80%',
    height: 14,
    borderRadius: 4,
  },
  subtitleSkeleton: {
    width: '60%',
    height: 12,
    borderRadius: 4,
  },
  arrowSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});

export default RowCardSkeleton;
