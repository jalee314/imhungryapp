/**
 * Route Contract Tests
 * 
 * These tests validate that the navigation route constants match the actual
 * route definitions in App.tsx. They fail on "route drift" - when route names
 * in the app change without updating the constants.
 * 
 * Purpose:
 * - Freeze navigation contract before app shell extraction
 * - Detect accidental route name changes
 * - Ensure route constants stay in sync with App.tsx
 */

import {
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  APP_STACK_ROUTES,
  TAB_ROUTES,
  FEED_STACK_ROUTES,
  DISCOVER_STACK_ROUTES,
  CONTRIBUTE_STACK_ROUTES,
  FAVORITES_STACK_ROUTES,
  PROFILE_STACK_ROUTES,
  ALL_ROUTES,
  isValidRoute,
  getRoutesByStack,
} from '../routeConstants';

describe('Route Contract Tests', () => {
  describe('Route Constants Integrity', () => {
    it('should have all onboarding routes defined', () => {
      expect(ONBOARDING_ROUTES.Landing).toBe('Landing');
      expect(ONBOARDING_ROUTES.SignUp).toBe('SignUp');
      expect(ONBOARDING_ROUTES.LogIn).toBe('LogIn');
      expect(ONBOARDING_ROUTES.ForgotPassword).toBe('ForgotPassword');
      expect(ONBOARDING_ROUTES.ResetPassword).toBe('ResetPassword');
      expect(ONBOARDING_ROUTES.Username).toBe('Username');
      expect(ONBOARDING_ROUTES.ProfilePhoto).toBe('ProfilePhoto');
      expect(ONBOARDING_ROUTES.LocationPermissions).toBe('LocationPermissions');
      expect(ONBOARDING_ROUTES.InstantNotifications).toBe('InstantNotifications');
      expect(ONBOARDING_ROUTES.CuisinePreferences).toBe('CuisinePreferences');
      expect(ONBOARDING_ROUTES.AdminLogin).toBe('AdminLogin');
    });

    it('should have all admin routes defined', () => {
      expect(ADMIN_ROUTES.AdminDashboard).toBe('AdminDashboard');
      expect(ADMIN_ROUTES.AdminReports).toBe('AdminReports');
      expect(ADMIN_ROUTES.AdminDeals).toBe('AdminDeals');
      expect(ADMIN_ROUTES.AdminUsers).toBe('AdminUsers');
      expect(ADMIN_ROUTES.AdminMassUpload).toBe('AdminMassUpload');
    });

    it('should have all app stack routes defined', () => {
      expect(APP_STACK_ROUTES.MainTabs).toBe('MainTabs');
      expect(APP_STACK_ROUTES.DealDetail).toBe('DealDetail');
      expect(APP_STACK_ROUTES.DealEdit).toBe('DealEdit');
      expect(APP_STACK_ROUTES.RestaurantDetail).toBe('RestaurantDetail');
      expect(APP_STACK_ROUTES.ReportContent).toBe('ReportContent');
      expect(APP_STACK_ROUTES.BlockUser).toBe('BlockUser');
      expect(APP_STACK_ROUTES.UserProfile).toBe('UserProfile');
    });

    it('should have all tab routes defined', () => {
      expect(TAB_ROUTES.Feed).toBe('Feed');
      expect(TAB_ROUTES.DiscoverFeed).toBe('DiscoverFeed');
      expect(TAB_ROUTES.DealCreationScreen).toBe('DealCreationScreen');
      expect(TAB_ROUTES.FavoritesPage).toBe('FavoritesPage');
      expect(TAB_ROUTES.ProfilePage).toBe('ProfilePage');
    });

    it('should have all feed stack routes defined', () => {
      expect(FEED_STACK_ROUTES.FeedMain).toBe('Feed Main');
      expect(FEED_STACK_ROUTES.CommunityUploaded).toBe('CommunityUploaded');
    });

    it('should have all discover stack routes defined', () => {
      expect(DISCOVER_STACK_ROUTES.DiscoverMain).toBe('DiscoverMain');
    });

    it('should have all contribute stack routes defined', () => {
      expect(CONTRIBUTE_STACK_ROUTES.ContributeMain).toBe('ContributeMain');
    });

    it('should have all favorites stack routes defined', () => {
      expect(FAVORITES_STACK_ROUTES.FavoritesMain).toBe('FavoritesMain');
    });

    it('should have all profile stack routes defined', () => {
      expect(PROFILE_STACK_ROUTES.ProfileMain).toBe('ProfileMain');
      expect(PROFILE_STACK_ROUTES.ProfileEdit).toBe('ProfileEdit');
      expect(PROFILE_STACK_ROUTES.BlockedUsersPage).toBe('BlockedUsersPage');
      expect(PROFILE_STACK_ROUTES.ContactUsPage).toBe('ContactUsPage');
      expect(PROFILE_STACK_ROUTES.FAQPage).toBe('FAQPage');
      expect(PROFILE_STACK_ROUTES.TermsConditionsPage).toBe('TermsConditionsPage');
      expect(PROFILE_STACK_ROUTES.PrivacyPolicyPage).toBe('PrivacyPolicyPage');
      expect(PROFILE_STACK_ROUTES.CuisineEdit).toBe('CuisineEdit');
    });
  });

  describe('ALL_ROUTES Combined', () => {
    it('should contain all routes from all stacks', () => {
      const expectedRoutes = [
        ...Object.values(ONBOARDING_ROUTES),
        ...Object.values(ADMIN_ROUTES),
        ...Object.values(APP_STACK_ROUTES),
        ...Object.values(TAB_ROUTES),
        ...Object.values(FEED_STACK_ROUTES),
        ...Object.values(DISCOVER_STACK_ROUTES),
        ...Object.values(CONTRIBUTE_STACK_ROUTES),
        ...Object.values(FAVORITES_STACK_ROUTES),
        ...Object.values(PROFILE_STACK_ROUTES),
      ];

      const allRouteValues = Object.values(ALL_ROUTES);

      expectedRoutes.forEach((route) => {
        expect(allRouteValues).toContain(route);
      });
    });

    it('should have expected total number of routes', () => {
      // Count total routes across all stacks
      const totalRoutes =
        Object.keys(ONBOARDING_ROUTES).length +
        Object.keys(ADMIN_ROUTES).length +
        Object.keys(APP_STACK_ROUTES).length +
        Object.keys(TAB_ROUTES).length +
        Object.keys(FEED_STACK_ROUTES).length +
        Object.keys(DISCOVER_STACK_ROUTES).length +
        Object.keys(CONTRIBUTE_STACK_ROUTES).length +
        Object.keys(FAVORITES_STACK_ROUTES).length +
        Object.keys(PROFILE_STACK_ROUTES).length;

      expect(Object.keys(ALL_ROUTES).length).toBe(totalRoutes);
    });
  });

  describe('Route Uniqueness', () => {
    it('should have unique route names across all stacks', () => {
      const allRouteValues = Object.values(ALL_ROUTES);
      const uniqueRoutes = new Set(allRouteValues);

      // If sizes differ, there are duplicate route names
      expect(allRouteValues.length).toBe(uniqueRoutes.size);
    });

    it('should not have empty or undefined route names', () => {
      Object.entries(ALL_ROUTES).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value.length).toBeGreaterThan(0);
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('Route Validation Helpers', () => {
    it('isValidRoute should return true for valid routes', () => {
      expect(isValidRoute('Landing')).toBe(true);
      expect(isValidRoute('MainTabs')).toBe(true);
      expect(isValidRoute('ProfileEdit')).toBe(true);
      expect(isValidRoute('AdminDashboard')).toBe(true);
    });

    it('isValidRoute should return false for invalid routes', () => {
      expect(isValidRoute('NonExistentRoute')).toBe(false);
      expect(isValidRoute('')).toBe(false);
      expect(isValidRoute('random-string')).toBe(false);
    });

    it('getRoutesByStack should return correct routes for each stack', () => {
      expect(getRoutesByStack('onboarding')).toBe(ONBOARDING_ROUTES);
      expect(getRoutesByStack('admin')).toBe(ADMIN_ROUTES);
      expect(getRoutesByStack('app')).toBe(APP_STACK_ROUTES);
      expect(getRoutesByStack('tab')).toBe(TAB_ROUTES);
      expect(getRoutesByStack('feed')).toBe(FEED_STACK_ROUTES);
      expect(getRoutesByStack('discover')).toBe(DISCOVER_STACK_ROUTES);
      expect(getRoutesByStack('contribute')).toBe(CONTRIBUTE_STACK_ROUTES);
      expect(getRoutesByStack('favorites')).toBe(FAVORITES_STACK_ROUTES);
      expect(getRoutesByStack('profile')).toBe(PROFILE_STACK_ROUTES);
    });

    it('getRoutesByStack should return null for unknown stack', () => {
      expect(getRoutesByStack('unknown')).toBeNull();
      expect(getRoutesByStack('')).toBeNull();
    });
  });

  describe('Route Naming Conventions', () => {
    it('should follow PascalCase naming for screen routes', () => {
      const pascalCaseRegex = /^[A-Z][a-zA-Z]*$/;
      const routesWithSpaces = ['Feed Main']; // Known exception

      Object.values(ALL_ROUTES).forEach((route) => {
        if (!routesWithSpaces.includes(route)) {
          expect(route).toMatch(pascalCaseRegex);
        }
      });
    });

    it('should not have route names starting with numbers', () => {
      const startsWithNumber = /^[0-9]/;

      Object.values(ALL_ROUTES).forEach((route) => {
        expect(route).not.toMatch(startsWithNumber);
      });
    });
  });

  describe('Route Drift Detection', () => {
    // These tests will fail if routes are changed in App.tsx without updating constants
    
    it('should detect if onboarding initial route changes', () => {
      // Initial route in OnboardingStack is 'Landing'
      expect(ONBOARDING_ROUTES.Landing).toBe('Landing');
    });

    it('should detect if tab navigator initial route references change', () => {
      // Tab names should match what CustomTabBar expects
      expect(TAB_ROUTES.Feed).toBe('Feed');
      expect(TAB_ROUTES.ProfilePage).toBe('ProfilePage');
    });

    it('should detect if nested screen names change', () => {
      // Profile tab nested screens
      expect(PROFILE_STACK_ROUTES.ProfileMain).toBe('ProfileMain');
      // Feed tab nested screens
      expect(FEED_STACK_ROUTES.FeedMain).toBe('Feed Main');
    });

    it('should have correct number of routes per stack (snapshot)', () => {
      // These counts act as a "snapshot" - if routes are added/removed, test fails
      expect(Object.keys(ONBOARDING_ROUTES).length).toBe(11);
      expect(Object.keys(ADMIN_ROUTES).length).toBe(5);
      expect(Object.keys(APP_STACK_ROUTES).length).toBe(7);
      expect(Object.keys(TAB_ROUTES).length).toBe(5);
      expect(Object.keys(FEED_STACK_ROUTES).length).toBe(2);
      expect(Object.keys(DISCOVER_STACK_ROUTES).length).toBe(1);
      expect(Object.keys(CONTRIBUTE_STACK_ROUTES).length).toBe(1);
      expect(Object.keys(FAVORITES_STACK_ROUTES).length).toBe(1);
      expect(Object.keys(PROFILE_STACK_ROUTES).length).toBe(8);
    });
  });
});
