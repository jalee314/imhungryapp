import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { tokens } from '#/ui';

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
    backgroundColor: '#E0E0E0',
  },
  rowCard: {
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.md,
    padding: tokens.space.sm,
    marginHorizontal: tokens.space.md,
    marginVertical: tokens.space.xs,
    height: 86,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.lg,
    width: '100%',
    height: '100%',
  },
  imageSkeleton: {
    width: 70,
    height: 70,
    borderRadius: tokens.radius.sm,
  },
  textFrame: {
    flex: 1,
    flexDirection: 'column',
    gap: tokens.space.sm,
    justifyContent: 'center',
    paddingRight: tokens.space.sm,
  },
  titleSkeleton: {
    width: '80%',
    height: 14,
    borderRadius: tokens.radius.xs,
  },
  subtitleSkeleton: {
    width: '60%',
    height: 12,
    borderRadius: tokens.radius.xs,
  },
  arrowSkeleton: {
    width: 16,
    height: 16,
    borderRadius: tokens.radius.sm,
  },
});

export default RowCardSkeleton;
