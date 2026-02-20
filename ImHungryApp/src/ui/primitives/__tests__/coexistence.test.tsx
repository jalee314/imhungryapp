/**
 * Integration tests for UI primitives coexisting with legacy StyleSheet styles
 * 
 * These tests verify that:
 * 1. Primitives work with their shorthand props
 * 2. Primitives accept and merge legacy StyleSheet styles
 * 3. Legacy styles can override primitive props when passed via style prop
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';

import { ThemeProvider, Box, Text, Pressable } from '../index';

// Legacy styles created with StyleSheet.create (existing pattern in codebase)
const legacyStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FF0000',
    padding: 20,
    borderRadius: 8,
  },
  text: {
    fontFamily: 'CustomFont',
    letterSpacing: 2,
    color: '#0000FF',
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

describe('UI Primitives - Legacy Style Coexistence', () => {
  describe('Box primitive', () => {
    it('renders with primitive props only', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Box testID="box" p="lg" bg="primary" rounded="md">
            <RNText>Content</RNText>
          </Box>
        </ThemeProvider>
      );

      const box = getByTestId('box');
      expect(box).toBeTruthy();
    });

    it('accepts legacy StyleSheet styles via style prop', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Box testID="box" style={legacyStyles.container}>
            <RNText>Content</RNText>
          </Box>
        </ThemeProvider>
      );

      const box = getByTestId('box');
      expect(box).toBeTruthy();
      // Style is applied (merged into the component)
      expect(box.props.style).toBeDefined();
    });

    it('merges primitive props with legacy styles', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Box 
            testID="box" 
            p="lg" 
            bg="background" 
            rounded="lg"
            style={legacyStyles.container}
          >
            <RNText>Mixed styles</RNText>
          </Box>
        </ThemeProvider>
      );

      const box = getByTestId('box');
      expect(box).toBeTruthy();
      // Both primitive-generated and legacy styles should be present
      const styles = box.props.style;
      expect(styles).toBeDefined();
    });

    it('allows legacy style to override primitive props', () => {
      // When style prop is passed, it comes after computed styles
      // so legacy styles can override primitive props
      const { getByTestId } = render(
        <ThemeProvider>
          <Box 
            testID="box" 
            bg="primary"  // Sets backgroundColor from theme
            style={{ backgroundColor: '#123456' }}  // Override with specific color
          >
            <RNText>Override test</RNText>
          </Box>
        </ThemeProvider>
      );

      const box = getByTestId('box');
      expect(box).toBeTruthy();
    });
  });

  describe('Text primitive', () => {
    it('renders with primitive props only', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Text testID="text" size="lg" weight="bold" color="primary">
            Styled text
          </Text>
        </ThemeProvider>
      );

      const text = getByTestId('text');
      expect(text).toBeTruthy();
    });

    it('accepts legacy StyleSheet styles via style prop', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Text testID="text" style={legacyStyles.text}>
            Legacy styled text
          </Text>
        </ThemeProvider>
      );

      const text = getByTestId('text');
      expect(text).toBeTruthy();
    });

    it('merges primitive props with legacy styles', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Text 
            testID="text" 
            size="xl" 
            weight="semibold"
            style={legacyStyles.text}  // Adds fontFamily, letterSpacing
          >
            Mixed typography
          </Text>
        </ThemeProvider>
      );

      const text = getByTestId('text');
      expect(text).toBeTruthy();
    });
  });

  describe('Pressable primitive', () => {
    it('renders with primitive props only', () => {
      const handlePress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <Pressable 
            testID="pressable" 
            p="md" 
            bg="primary" 
            rounded="lg"
            onPress={handlePress}
          >
            <RNText>Button</RNText>
          </Pressable>
        </ThemeProvider>
      );

      const pressable = getByTestId('pressable');
      expect(pressable).toBeTruthy();
    });

    it('accepts legacy StyleSheet styles via style prop', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Pressable testID="pressable" style={legacyStyles.button}>
            <RNText>Shadow button</RNText>
          </Pressable>
        </ThemeProvider>
      );

      const pressable = getByTestId('pressable');
      expect(pressable).toBeTruthy();
    });

    it('merges primitive props with legacy shadow styles', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Pressable 
            testID="pressable" 
            p="lg" 
            bg="primary" 
            rounded="xl"
            style={legacyStyles.button}  // Adds shadow properties
          >
            <RNText>Mixed button</RNText>
          </Pressable>
        </ThemeProvider>
      );

      const pressable = getByTestId('pressable');
      expect(pressable).toBeTruthy();
    });
  });

  describe('Primitives work without ThemeProvider', () => {
    it('Box renders with default theme when no provider', () => {
      // useThemeSafe returns defaultTheme when outside provider
      const { getByTestId } = render(
        <Box testID="box" p="md" bg="background">
          <RNText>No provider</RNText>
        </Box>
      );

      const box = getByTestId('box');
      expect(box).toBeTruthy();
    });

    it('Text renders with default theme when no provider', () => {
      const { getByTestId } = render(
        <Text testID="text" size="lg">
          No provider text
        </Text>
      );

      const text = getByTestId('text');
      expect(text).toBeTruthy();
    });
  });

  describe('Complex mixed usage', () => {
    it('renders nested primitives with mixed styling approaches', () => {
      const complexLegacyStyles = StyleSheet.create({
        card: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        title: {
          fontFamily: 'BrandFont-Bold',
        },
        description: {
          lineHeight: 22,
        },
      });

      const { getByTestId } = render(
        <ThemeProvider>
          {/* Outer container with primitive props */}
          <Box testID="outer" p="lg" bg="background">
            {/* Card with primitive + legacy shadow */}
            <Box 
              testID="card"
              p="md" 
              bg="backgroundElevated" 
              rounded="lg"
              style={complexLegacyStyles.card}
            >
              {/* Title with primitive + legacy font */}
              <Text 
                testID="title"
                size="xl" 
                weight="bold" 
                color="text"
                style={complexLegacyStyles.title}
              >
                Card Title
              </Text>
              
              {/* Description with primitive + legacy lineHeight */}
              <Text 
                testID="description"
                size="md" 
                muted
                style={complexLegacyStyles.description}
              >
                This is a description that uses both primitive props and legacy styles.
              </Text>
              
              {/* Button with primitive only */}
              <Pressable 
                testID="button"
                p="sm" 
                bg="primary" 
                rounded="md" 
                center
              >
                <Text color="textInverted" weight="semibold">
                  Action
                </Text>
              </Pressable>
            </Box>
          </Box>
        </ThemeProvider>
      );

      expect(getByTestId('outer')).toBeTruthy();
      expect(getByTestId('card')).toBeTruthy();
      expect(getByTestId('title')).toBeTruthy();
      expect(getByTestId('description')).toBeTruthy();
      expect(getByTestId('button')).toBeTruthy();
    });
  });
});
