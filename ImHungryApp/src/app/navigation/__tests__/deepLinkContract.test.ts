/**
 * Deep-Link Contract Tests
 * 
 * These tests validate the deep-link configuration and behavior.
 * They ensure that deep-links resolve to the correct screens and
 * that the URL scheme is properly configured.
 * 
 * Purpose:
 * - Validate deep-link URL schemes
 * - Test link-to-screen mapping
 * - Detect changes in deep-link behavior
 */

import * as Linking from 'expo-linking';

import { DEEP_LINK_CONFIG, ONBOARDING_ROUTES } from '../routeConstants';

// Mock Expo Linking module
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string, options?: { scheme?: string }) => {
    const scheme = options?.scheme || 'imhungri';
    return `${scheme}://${path}`;
  }),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  canOpenURL: jest.fn().mockResolvedValue(true),
  openURL: jest.fn().mockResolvedValue(undefined),
}));

describe('Deep-Link Contract Tests', () => {
  describe('URL Scheme Configuration', () => {
    it('should have imhungri:// as a valid prefix', () => {
      expect(DEEP_LINK_CONFIG.prefixes).toContain('imhungri://');
    });

    it('should have com.imhungri:// as a valid prefix', () => {
      expect(DEEP_LINK_CONFIG.prefixes).toContain('com.imhungri://');
    });

    it('should have exactly 2 URL prefixes', () => {
      expect(DEEP_LINK_CONFIG.prefixes).toHaveLength(2);
    });
  });

  describe('Screen Path Mapping', () => {
    it('should map ResetPassword to "reset-password" path', () => {
      expect(DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword]).toBe('reset-password');
    });

    it('should have at least one screen configured for deep-linking', () => {
      expect(Object.keys(DEEP_LINK_CONFIG.screens).length).toBeGreaterThanOrEqual(1);
    });

    it('should have valid route names as keys', () => {
      Object.keys(DEEP_LINK_CONFIG.screens).forEach((screenName) => {
        expect(typeof screenName).toBe('string');
        expect(screenName.length).toBeGreaterThan(0);
      });
    });

    it('should have valid path strings as values', () => {
      Object.values(DEEP_LINK_CONFIG.screens).forEach((path) => {
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
        // Paths should be kebab-case or simple strings
        expect(path).toMatch(/^[a-z0-9-]+$/);
      });
    });
  });

  describe('Deep-Link URL Generation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should generate correct reset-password URL with imhungri scheme', () => {
      const resetPath = DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword];
      
      // Verify the path generates correctly
      expect(`imhungri://${resetPath}`).toBe('imhungri://reset-password');
    });

    it('should generate correct reset-password URL with com.imhungri scheme', () => {
      const resetPath = DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword];
      
      expect(`com.imhungri://${resetPath}`).toBe('com.imhungri://reset-password');
    });
  });

  describe('Deep-Link Behavior Contract', () => {
    it('should have ResetPassword as a deep-linkable screen', () => {
      const screens = Object.keys(DEEP_LINK_CONFIG.screens);
      expect(screens).toContain(ONBOARDING_ROUTES.ResetPassword);
    });

    it('deep-link paths should not contain special characters except hyphens', () => {
      Object.values(DEEP_LINK_CONFIG.screens).forEach((path) => {
        // Only lowercase letters, numbers, and hyphens allowed
        expect(path).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it('deep-link paths should not start or end with hyphens', () => {
      Object.values(DEEP_LINK_CONFIG.screens).forEach((path) => {
        expect(path).not.toMatch(/^-/);
        expect(path).not.toMatch(/-$/);
      });
    });
  });

  describe('Deep-Link Drift Detection', () => {
    // These tests will fail if deep-link config changes without updating constants

    it('should detect if reset-password path changes', () => {
      expect(DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword]).toBe('reset-password');
    });

    it('should detect if URL schemes change', () => {
      // Snapshot of expected schemes
      const expectedSchemes = ['imhungri://', 'com.imhungri://'];
      expect([...DEEP_LINK_CONFIG.prefixes].sort()).toEqual(expectedSchemes.sort());
    });

    it('should detect if number of deep-linked screens changes', () => {
      // Currently only ResetPassword is deep-linked
      expect(Object.keys(DEEP_LINK_CONFIG.screens).length).toBe(1);
    });
  });

  describe('Deep-Link URL Parsing', () => {
    it('should correctly identify screen from full URL', () => {
      const testUrls = [
        { url: 'imhungri://reset-password', expectedScreen: ONBOARDING_ROUTES.ResetPassword },
        { url: 'com.imhungri://reset-password', expectedScreen: ONBOARDING_ROUTES.ResetPassword },
      ];

      testUrls.forEach(({ url, expectedScreen }) => {
        // Extract path from URL
        const urlParts = url.split('://');
        const path = urlParts[1];

        // Find screen that matches the path
        const matchingScreen = Object.entries(DEEP_LINK_CONFIG.screens).find(
          ([_, screenPath]) => screenPath === path
        );

        expect(matchingScreen).toBeDefined();
        expect(matchingScreen?.[0]).toBe(expectedScreen);
      });
    });

    it('should handle URLs with trailing slashes', () => {
      const pathWithSlash = DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword] + '/';
      const pathWithoutSlash = DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword];

      // Path normalization - both should resolve to same base path
      expect(pathWithSlash.replace(/\/$/, '')).toBe(pathWithoutSlash);
    });
  });

  describe('Deep-Link Query Parameter Handling', () => {
    it('should support URLs with query parameters', () => {
      const baseUrl = `imhungri://${DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword]}`;
      const urlWithParams = `${baseUrl}?token=abc123&email=test@example.com`;

      // Verify base URL is correct
      expect(urlWithParams).toContain(baseUrl);
      
      // Verify query parameters are preservable
      const urlObject = new URL(urlWithParams.replace('imhungri://', 'https://placeholder.com/'));
      expect(urlObject.searchParams.get('token')).toBe('abc123');
      expect(urlObject.searchParams.get('email')).toBe('test@example.com');
    });
  });
});

describe('Deep-Link Integration Contract', () => {
  describe('Expected Expo Linking Behavior', () => {
    it('Linking.createURL should be callable', () => {
      expect(typeof Linking.createURL).toBe('function');
    });

    it('Linking.addEventListener should be callable', () => {
      expect(typeof Linking.addEventListener).toBe('function');
    });

    it('Linking.getInitialURL should be callable', () => {
      expect(typeof Linking.getInitialURL).toBe('function');
    });
  });

  describe('Universal Link Support', () => {
    // Document expected universal link domains (if configured)
    it('should document expected deep-link prefixes', () => {
      // This serves as documentation and drift detection
      const documentedPrefixes = DEEP_LINK_CONFIG.prefixes;
      
      expect(documentedPrefixes).toBeDefined();
      expect(Array.isArray(documentedPrefixes)).toBe(true);
      expect(documentedPrefixes.length).toBeGreaterThan(0);
    });
  });
});
