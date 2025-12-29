import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { tokens, atoms as a } from '#/ui';

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
    backgroundColor: tokens.color.gray_200,
  },
  rowCard: {
    ...a.bg_white,
    ...a.rounded_md,
    ...a.p_sm,
    ...a.mx_md,
    ...a.my_xs,
    height: 86,
  },
  content: {
    ...a.flex_row,
    ...a.align_center,
    ...a.gap_lg,
    ...a.w_full,
    ...a.h_full,
  },
  imageSkeleton: {
    ...a.rounded_sm,
    width: 70,
    height: 70,
  },
  textFrame: {
    ...a.flex_1,
    ...a.flex_col,
    ...a.gap_sm,
    ...a.justify_center,
    ...a.pr_sm,
  },
  titleSkeleton: {
    ...a.rounded_xs,
    width: '80%',
    height: 14,
  },
  subtitleSkeleton: {
    ...a.rounded_xs,
    width: '60%',
    height: 12,
  },
  arrowSkeleton: {
    ...a.rounded_sm,
    width: 16,
    height: 16,
  },
});

export default RowCardSkeleton;
