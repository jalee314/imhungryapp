import { NavigationContainer } from '@react-navigation/native';
import { render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface WrapperProps {
  children: React.ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withNavigation?: boolean;
  initialRoute?: string;
}

/**
 * Test wrapper that includes all necessary providers.
 * Auth & Location are backed by Zustand stores and need no React context providers.
 */
function AllTheProviders({ children }: WrapperProps) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

/**
 * Test wrapper with navigation container
 */
function AllTheProvidersWithNavigation({ children }: WrapperProps) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * Custom render function that wraps component with all providers
 */
function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { withNavigation = false, ...renderOptions } = options;

  const Wrapper = withNavigation
    ? AllTheProvidersWithNavigation
    : AllTheProviders;

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react-native';

// Override render with our custom render
export { renderWithProviders };
