/**
 * FontGate.tsx
 *
 * Font loading gate component that controls rendering based on font availability.
 * Renders children only when fonts are loaded, with optional timeout fallback.
 *
 * This component extracts font loading logic from App.tsx to enable
 * cleaner separation of concerns and better testability.
 */

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useBootstrap, UseBootstrapOptions } from '@app/hooks';

export interface FontGateProps {
  /** Content to render when fonts are ready */
  children: React.ReactNode;
  /** Bootstrap configuration options */
  options?: UseBootstrapOptions;
  /** Custom loading component (optional) */
  LoadingComponent?: React.ComponentType;
}

/**
 * Default loading screen displayed while fonts are loading
 */
const DefaultLoadingScreen: React.FC = () => (
  <View style={styles.container}>
    <Image
      source={require('../../../assets/images/icon_splash.png')}
      style={styles.splashImage}
    />
  </View>
);

/**
 * FontGate - Font loading gate component
 *
 * Blocks rendering of children until fonts are loaded or timeout is reached.
 * Uses the useBootstrap hook to manage font loading state.
 *
 * @example
 * ```tsx
 * <FontGate>
 *   <App />
 * </FontGate>
 * ```
 *
 * @example
 * ```tsx
 * // With custom timeout and loading component
 * <FontGate
 *   options={{ timeout: 5000 }}
 *   LoadingComponent={CustomSplash}
 * >
 *   <App />
 * </FontGate>
 * ```
 */
export const FontGate: React.FC<FontGateProps> = ({
  children,
  options,
  LoadingComponent = DefaultLoadingScreen,
}) => {
  const { isReady } = useBootstrap(options);

  if (!isReady) {
    return <LoadingComponent />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5B4',
  },
  splashImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default FontGate;
