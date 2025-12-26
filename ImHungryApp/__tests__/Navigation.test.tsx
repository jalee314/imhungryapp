/**
 * Navigation Tests
 * 
 * Tests for the Navigation.tsx module to verify:
 * - All navigators are exported correctly
 * - Navigation types are properly defined
 * - Deep linking configuration is correct
 */

import {
  OnboardingNavigator,
  AdminNavigator,
  AppNavigator,
  MainTabNavigator,
  RoutesContainer,
  FeedStack,
  DiscoverStack,
  ContributeStack,
  FavoritesStack,
  ProfileStack,
  linking,
} from '../src/Navigation';

describe('Navigation Module', () => {
  describe('Exports', () => {
    it('should export all navigators', () => {
      expect(OnboardingNavigator).toBeDefined();
      expect(AdminNavigator).toBeDefined();
      expect(AppNavigator).toBeDefined();
      expect(MainTabNavigator).toBeDefined();
      expect(RoutesContainer).toBeDefined();
    });

    it('should export stack navigators', () => {
      expect(FeedStack).toBeDefined();
      expect(DiscoverStack).toBeDefined();
      expect(ContributeStack).toBeDefined();
      expect(FavoritesStack).toBeDefined();
      expect(ProfileStack).toBeDefined();
    });

    it('should export linking configuration', () => {
      expect(linking).toBeDefined();
      expect(linking.prefixes).toBeDefined();
      expect(linking.config).toBeDefined();
    });
  });

  describe('Linking Configuration', () => {
    it('should have correct prefixes', () => {
      expect(linking.prefixes).toContain('com.imhungri://');
      expect(linking.prefixes).toContain('imhungri://');
    });

    it('should have ResetPassword route configured', () => {
      expect(linking.config?.screens?.ResetPassword).toBe('reset-password');
    });
  });
});

describe('Navigation Components', () => {
  it('should export OnboardingNavigator as a function component', () => {
    expect(typeof OnboardingNavigator).toBe('function');
  });

  it('should export AdminNavigator as a function component', () => {
    expect(typeof AdminNavigator).toBe('function');
  });

  it('should export AppNavigator as a function component', () => {
    expect(typeof AppNavigator).toBe('function');
  });

  it('should export MainTabNavigator as a function component', () => {
    expect(typeof MainTabNavigator).toBe('function');
  });

  it('should export RoutesContainer as a function component', () => {
    expect(typeof RoutesContainer).toBe('function');
  });
});
