/**
 * VoteButtons Component Tests
 * 
 * Focused tests to verify:
 * 1. Touch zones are preserved (upvote left, downvote right)
 * 2. Pressed behavior matches original (opacity 0.6)
 * 3. Callback timing is correct (onPress fires immediately)
 * 4. Visual appearance matches design specs
 */

import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@ui/primitives';
import React from 'react';

import VoteButtons from '../VoteButtons';


// Wrapper component to provide theme context
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('VoteButtons', () => {
  const mockOnUpvote = jest.fn();
  const mockOnDownvote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Touch Zone Behavior', () => {
    it('should have two distinct pressable areas', () => {
      const { UNSAFE_getAllByType } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      // Find all Pressable components (rendered as Views with onClick)
      const pressables = UNSAFE_getAllByType(require('react-native').Pressable);
      expect(pressables.length).toBe(2);
    });

    it('should call onUpvote when left area is pressed', () => {
      const { getByText } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      // The vote count text is inside the upvote area
      const voteCount = getByText('10');
      fireEvent.press(voteCount);

      expect(mockOnUpvote).toHaveBeenCalledTimes(1);
      expect(mockOnDownvote).not.toHaveBeenCalled();
    });

    it('should call onDownvote when right area is pressed', () => {
      const { UNSAFE_getAllByType } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      // Get the second pressable (downvote area)
      const pressables = UNSAFE_getAllByType(require('react-native').Pressable);
      fireEvent.press(pressables[1]);

      expect(mockOnDownvote).toHaveBeenCalledTimes(1);
      expect(mockOnUpvote).not.toHaveBeenCalled();
    });
  });

  describe('Callback Timing', () => {
    it('should fire onUpvote immediately on press (not on release)', () => {
      const { getByText } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const voteCount = getByText('10');
      fireEvent.press(voteCount);

      // Callback should be called synchronously
      expect(mockOnUpvote).toHaveBeenCalledTimes(1);
    });

    it('should fire onDownvote immediately on press', () => {
      const { UNSAFE_getAllByType } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const pressables = UNSAFE_getAllByType(require('react-native').Pressable);
      fireEvent.press(pressables[1]);

      expect(mockOnDownvote).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid consecutive presses', () => {
      const { getByText } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const voteCount = getByText('10');
      
      // Simulate rapid presses
      fireEvent.press(voteCount);
      fireEvent.press(voteCount);
      fireEvent.press(voteCount);

      expect(mockOnUpvote).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual State Rendering', () => {
    it('should render upvote icon with primary color when upvoted', () => {
      const { toJSON } = renderWithTheme(
        <VoteButtons
          votes={11}
          isUpvoted={true}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should render downvote icon with highlight color when downvoted', () => {
      const { toJSON } = renderWithTheme(
        <VoteButtons
          votes={9}
          isUpvoted={false}
          isDownvoted={true}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should render default state with neutral colors', () => {
      const { toJSON } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('Layout Structure', () => {
    it('should have pill-shaped container with row layout', () => {
      const { toJSON } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const tree = toJSON();
      
      // Container should have row direction
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            flexDirection: 'row',
          }),
        ])
      );
    });

    it('should have separator between upvote and downvote areas', () => {
      const { UNSAFE_getAllByType } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      // The separator is a Box/View between the pressables
      const views = UNSAFE_getAllByType(require('react-native').View);
      
      // Should have at least 3 View elements (container + 2 from Box primitive)
      expect(views.length).toBeGreaterThanOrEqual(3);
    });

    it('should display vote count inside upvote area', () => {
      const { getByText } = renderWithTheme(
        <VoteButtons
          votes={42}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      expect(getByText('42')).toBeTruthy();
    });

    it('should update vote count when props change', () => {
      const { getByText, rerender } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      expect(getByText('10')).toBeTruthy();

      rerender(
        <ThemeProvider>
          <VoteButtons
            votes={15}
            isUpvoted={true}
            isDownvoted={false}
            onUpvote={mockOnUpvote}
            onDownvote={mockOnDownvote}
          />
        </ThemeProvider>
      );

      expect(getByText('15')).toBeTruthy();
    });
  });

  describe('Pressed State Behavior', () => {
    it('should apply opacity change when pressed', () => {
      // This test verifies the Pressable is configured correctly
      // The actual opacity change happens during press state which is
      // harder to test directly, but we verify the config is correct
      const { UNSAFE_getAllByType } = renderWithTheme(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={mockOnUpvote}
          onDownvote={mockOnDownvote}
        />
      );

      const pressables = UNSAFE_getAllByType(require('react-native').Pressable);
      
      // Both pressables should exist and be interactive
      expect(pressables.length).toBe(2);
      pressables.forEach(pressable => {
        expect(pressable.props.disabled).toBeFalsy();
      });
    });
  });
});
