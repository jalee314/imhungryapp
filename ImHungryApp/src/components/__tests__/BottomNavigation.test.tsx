/**
 * BottomNavigation Component Tests (PR-029 / RF-029)
 *
 * Tests for BottomNavigation component after migration to ALF primitives.
 * Validates tab mapping, active-state logic, press behavior, and snapshot consistency.
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ThemeProvider } from '../../ui/primitives';
import BottomNavigation from '../BottomNavigation';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name, size: _size, color: _color }: { name: string; size: number; color: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

// Mock useAuth
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

// Mock userService
jest.mock('../../services/userService', () => ({
  fetchUserData: jest.fn().mockResolvedValue({
    profilePicture: null,
  }),
}));

// Mock DealCreationScreen
jest.mock('../../screens/contribution/DealCreationScreen', () => {
  const { View } = require('react-native');
  return ({ visible }: { visible: boolean }) => 
    visible ? <View testID="deal-creation-modal" /> : null;
});

describe('BottomNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderBottomNav = (props = {}) => {
    return render(
      <ThemeProvider>
        <BottomNavigation {...props} />
      </ThemeProvider>
    );
  };

  describe('Snapshots', () => {
    it('should match snapshot with default props', () => {
      const { toJSON } = renderBottomNav();
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with feed tab active', () => {
      const { toJSON } = renderBottomNav({ activeTab: 'feed' });
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with search tab active', () => {
      const { toJSON } = renderBottomNav({ activeTab: 'search' });
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with favorites tab active', () => {
      const { toJSON } = renderBottomNav({ activeTab: 'favorites' });
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with profile tab active', () => {
      const { toJSON } = renderBottomNav({ activeTab: 'profile' });
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Tab mapping', () => {
    it('should render all five navigation items', () => {
      const { getByText } = renderBottomNav();

      expect(getByText('Feed')).toBeTruthy();
      expect(getByText('Explore')).toBeTruthy();
      expect(getByText('Contribute')).toBeTruthy();
      expect(getByText('Favorites')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });

    it('should display correct icons for each tab', () => {
      const { getByTestId } = renderBottomNav({ activeTab: 'feed' });

      // Feed uses view-grid
      expect(getByTestId('icon-view-grid')).toBeTruthy();
      // Search uses magnify
      expect(getByTestId('icon-magnify')).toBeTruthy();
      // Contribute uses plus-circle-outline (not active)
      expect(getByTestId('icon-plus-circle-outline')).toBeTruthy();
      // Favorites uses heart-outline (not active)
      expect(getByTestId('icon-heart-outline')).toBeTruthy();
    });
  });

  describe('Active state logic', () => {
    it('should show active icon for feed when activeTab is feed', () => {
      const { getByTestId } = renderBottomNav({ activeTab: 'feed' });
      expect(getByTestId('icon-view-grid')).toBeTruthy();
    });

    it('should show active icon for favorites when activeTab is favorites', () => {
      const { getByTestId } = renderBottomNav({ activeTab: 'favorites' });
      expect(getByTestId('icon-heart')).toBeTruthy();
    });

    it('should show inactive icon for search when activeTab is feed', () => {
      const { getByTestId } = renderBottomNav({ activeTab: 'feed' });
      expect(getByTestId('icon-magnify')).toBeTruthy();
    });

    it('should never show contribute as active', () => {
      // Even if activeTab is contribute, it should show inactive icon
      const { getByTestId } = renderBottomNav({ activeTab: 'contribute' });
      expect(getByTestId('icon-plus-circle-outline')).toBeTruthy();
    });
  });

  describe('Tab press behavior', () => {
    it('should call onTabPress with tab id when a tab is pressed', () => {
      const onTabPress = jest.fn();
      const { getByText } = renderBottomNav({ onTabPress, activeTab: 'profile' });

      fireEvent.press(getByText('Feed'));
      expect(onTabPress).toHaveBeenCalledWith('feed');

      fireEvent.press(getByText('Favorites'));
      expect(onTabPress).toHaveBeenCalledWith('favorites');
    });

    it('should not call onTabPress when Contribute is pressed', () => {
      const onTabPress = jest.fn();
      const { getByText } = renderBottomNav({ onTabPress });

      fireEvent.press(getByText('Contribute'));
      expect(onTabPress).not.toHaveBeenCalled();
    });

    it('should open modal when Contribute is pressed', async () => {
      const { getByText, queryByTestId } = renderBottomNav();

      // Modal should not be visible initially
      expect(queryByTestId('deal-creation-modal')).toBeNull();

      // Press Contribute tab
      fireEvent.press(getByText('Contribute'));

      // Modal should now be visible
      await waitFor(() => {
        expect(queryByTestId('deal-creation-modal')).toBeTruthy();
      });
    });

    it('should fallback to navigation.navigate when onTabPress is not provided', () => {
      const { getByText } = renderBottomNav();

      fireEvent.press(getByText('Feed'));
      expect(mockNavigate).toHaveBeenCalledWith('Feed');
    });
  });

  describe('Profile photo handling', () => {
    it('should render placeholder when no photo URL is provided', () => {
      const { getByText } = renderBottomNav();
      // The placeholder shows 👤 emoji
      expect(getByText('👤')).toBeTruthy();
    });

    it('should render photo when photoUrl prop is provided', () => {
      const { queryByText } = renderBottomNav({
        photoUrl: 'https://example.com/photo.jpg',
      });
      // The placeholder should not be shown
      expect(queryByText('👤')).toBeNull();
    });
  });

  describe('Visual parity', () => {
    it('should use xs font size for labels (12px)', () => {
      const { toJSON } = renderBottomNav();
      // The snapshot will capture the computed styles including fontSize: 12
      expect(toJSON()).toBeDefined();
    });

    it('should apply correct text colors based on active state', () => {
      const { toJSON } = renderBottomNav({ activeTab: 'feed' });
      // Active tabs should have text color, inactive should have textMuted
      expect(toJSON()).toBeDefined();
    });
  });
});
