/**
 * ThemeProvider
 * 
 * React context provider for theming. Provides the current theme
 * and theme-switching capabilities to all child components.
 * 
 * Usage:
 * ```tsx
 * import { ThemeProvider, useTheme } from '@/ui/primitives';
 * 
 * // In app root
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * 
 * // In components
 * const { theme, setTheme } = useTheme();
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

import {
  Theme,
  ThemeName,
  lightTheme,
  darkTheme,
  defaultTheme,
} from '../alf/themes';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface ThemeContextValue {
  /** Current theme object */
  theme: Theme;
  /** Current theme name */
  themeName: ThemeName;
  /** Set theme by name */
  setTheme: (name: ThemeName) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface ThemeProviderProps {
  /** Initial theme name (defaults to 'light') */
  initialTheme?: ThemeName;
  /** Child components */
  children: ReactNode;
}

/**
 * ThemeProvider - Provides theme context to child components
 * 
 * Wrap your app with this provider to enable theme access throughout
 * the component tree.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  initialTheme = 'light',
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);

  const theme = useMemo(() => {
    return themeName === 'dark' ? darkTheme : lightTheme;
  }, [themeName]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeName((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeName,
      setTheme,
      toggleTheme,
    }),
    [theme, themeName, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useTheme - Access the current theme and theme controls
 * 
 * @throws Error if used outside of ThemeProvider
 * 
 * @example
 * ```tsx
 * const { theme, toggleTheme } = useTheme();
 * const backgroundColor = theme.palette.background;
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * useThemePalette - Convenience hook to access just the palette
 * 
 * @example
 * ```tsx
 * const palette = useThemePalette();
 * const textColor = palette.text;
 * ```
 */
export function useThemePalette() {
  const { theme } = useTheme();
  return theme.palette;
}

/**
 * useThemeSafe - Access theme without throwing if outside provider
 * Returns default theme if no provider is found
 * 
 * Useful for components that may be rendered outside the provider
 * during testing or in isolation.
 */
export function useThemeSafe(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    // Return a minimal fallback context
    return {
      theme: defaultTheme,
      themeName: defaultTheme.name,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  
  return context;
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

ThemeProvider.displayName = 'ThemeProvider';

export default ThemeProvider;
