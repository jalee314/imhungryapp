/**
 * Skeleton - Loading Placeholder Primitive
 * 
 * A consistent skeleton loader using design tokens.
 * 
 * @example
 * <Skeleton width={100} height={20} />
 * <Skeleton circle size={40} />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, type BorderRadiusToken } from '../../lib/theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  size?: number;
  rounded?: BorderRadiusToken | number;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  circle = false,
  size,
  rounded = 'xs',
  style,
  animate = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animate) return;
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    return () => animation.stop();
  }, [animate, pulseAnim]);

  const resolvedRadius = typeof rounded === 'number' ? rounded : borderRadius[rounded];
  
  const computedSize = circle ? (size ?? (typeof height === 'number' ? height : 40)) : undefined;
  
  const skeletonStyle: ViewStyle = {
    width: circle ? computedSize : width,
    height: circle ? computedSize : height,
    borderRadius: circle ? (computedSize! / 2) : resolvedRadius,
    backgroundColor: colors.backgroundSkeleton,
    overflow: 'hidden',
  };

  if (!animate) {
    return <View style={[skeletonStyle, style]} />;
  }

  return (
    <Animated.View style={[skeletonStyle, { opacity: pulseAnim }, style]} />
  );
};

export default Skeleton;
