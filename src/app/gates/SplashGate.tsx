/**
 * SplashGate.tsx
 *
 * Splash screen gate component that displays an animated splash overlay.
 * The splash fades out when the loading state transitions to ready.
 *
 * This component extracts splash screen animation logic from App.tsx
 * to enable cleaner separation of concerns and better testability.
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Image, Animated, StyleSheet, StyleProp, ViewStyle, ImageSourcePropType } from 'react-native';

export interface SplashGateProps {
  /** Content to render (splash displays as overlay) */
  children: React.ReactNode;
  /** Whether loading is still in progress (splash visible while true) */
  isLoading: boolean;
  /** Duration of fade-out animation in ms (default: 500) */
  fadeDuration?: number;
  /** Custom splash image source */
  splashImage?: ImageSourcePropType;
  /** Background color for splash screen */
  backgroundColor?: string;
  /** Additional styles for the splash container */
  style?: StyleProp<ViewStyle>;
}

/**
 * SplashGate - Animated splash screen gate component
 *
 * Renders children immediately with splash overlay. When isLoading
 * transitions from true to false, the splash fades out and unmounts.
 *
 * @example
 * ```tsx
 * const { isLoading } = useAuth();
 *
 * <SplashGate isLoading={isLoading}>
 *   <AppContent />
 * </SplashGate>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fade duration and styling
 * <SplashGate
 *   isLoading={isLoading}
 *   fadeDuration={800}
 *   backgroundColor="#FFFFFF"
 * >
 *   <AppContent />
 * </SplashGate>
 * ```
 */
export const SplashGate: React.FC<SplashGateProps> = ({
  children,
  isLoading,
  fadeDuration = 500,
  splashImage,
  backgroundColor = '#FFE5B4',
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }
  }, [isLoading, fadeDuration, fadeAnim]);

  const defaultSplashImage = require('../../../assets/images/icon_splash.png');

  return (
    <View style={styles.container}>
      {children}

      {isSplashVisible && (
        <Animated.View
          style={[
            styles.splashOverlay,
            { backgroundColor, opacity: fadeAnim },
            style,
          ]}
        >
          <Image
            source={splashImage ?? defaultSplashImage}
            style={styles.splashImage}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default SplashGate;
