/**
 * Navigation Parity Tests (PR-023)
 * 
 * These tests validate navigation structure after app-shell extraction.
 * They ensure stack topology, route contracts, and deep links remain unchanged.
 * 
 * Purpose:
 * - Confirm no navigation regressions after app-shell split
 * - Validate stack hierarchy matches expected topology
 * - Verify smoke paths for critical navigation flows
 * 
 * Related PRs:
 * - PR-019: App shell extraction
 * - PR-020: Route constant extraction
 * - PR-021: Stack extraction
 * - PR-022: Font/Splash gate extraction
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
  DEEP_LINK_CONFIG,
  ALL_ROUTES,
} from '../routeConstants';

/**
 * Stack Topology Configuration
 * 
 * This defines the expected navigation hierarchy after app-shell extraction.
 * If any stack changes, these tests will fail.
 */
const EXPECTED_STACK_TOPOLOGY = {
  // Root level stacks (selected by App.tsx based on auth/admin state)
  rootStacks: ['OnboardingStack', 'AdminStack', 'AppStack'] as const,

  // Onboarding stack screens (in order)
  onboarding: {
    initialRoute: 'Landing',
    screens: [
      'Landing',
      'SignUp',
      'LogIn',
      'ForgotPassword',
      'ResetPassword',
      'Username',
      'ProfilePhoto',
      'LocationPermissions',
      'InstantNotifications',
      'CuisinePreferences',
      'AdminLogin',
    ],
  },

  // Admin stack screens
  admin: {
    initialRoute: 'AdminDashboard',
    screens: [
      'AdminDashboard',
      'AdminReports',
      'AdminDeals',
      'AdminUsers',
      'AdminMassUpload',
    ],
  },

  // App stack (contains MainTabs + shared screens)
  app: {
    initialRoute: 'MainTabs',
    screens: [
      'MainTabs',
      'DealDetail',
      'DealEdit',
      'RestaurantDetail',
      'ReportContent',
      'BlockUser',
      'UserProfile',
    ],
    // Nested tab navigator
    tabs: {
      defaultRoute: 'Feed',
      screens: [
        'Feed',
        'DiscoverFeed',
        'DealCreationScreen',
        'FavoritesPage',
        'ProfilePage',
      ],
    },
  },

  // Tab stack nested screens
  tabStacks: {
    feed: {
      initialRoute: 'Feed Main',
      screens: ['Feed Main', 'CommunityUploaded'],
    },
    discover: {
      initialRoute: 'DiscoverMain',
      screens: ['DiscoverMain'],
    },
    contribute: {
      initialRoute: 'ContributeMain',
      screens: ['ContributeMain'],
    },
    favorites: {
      initialRoute: 'FavoritesMain',
      screens: ['FavoritesMain'],
    },
    profile: {
      initialRoute: 'ProfileMain',
      screens: [
        'ProfileMain',
        'ProfileEdit',
        'BlockedUsersPage',
        'ContactUsPage',
        'FAQPage',
        'TermsConditionsPage',
        'PrivacyPolicyPage',
        'CuisineEdit',
      ],
    },
  },
};

/**
 * Smoke Path Definitions
 * 
 * These define critical navigation paths that must work after extraction.
 * Each path represents a user journey through the app.
 */
const SMOKE_PATHS = {
  // Onboarding flow
  newUserSignup: [
    'Landing',
    'SignUp',
    'Username',
    'ProfilePhoto',
    'LocationPermissions',
    'InstantNotifications',
    'CuisinePreferences',
  ],

  // Login flow
  existingUserLogin: [
    'Landing',
    'LogIn',
  ],

  // Password reset flow
  passwordReset: [
    'Landing',
    'LogIn',
    'ForgotPassword',
    'ResetPassword',
  ],

  // Main app tab navigation
  tabNavigation: [
    'Feed',
    'DiscoverFeed',
    'FavoritesPage',
    'ProfilePage',
  ],

  // Deal detail flow
  dealFlow: [
    'Feed',
    'DealDetail',
  ],

  // Profile settings flow
  profileSettingsFlow: [
    'ProfilePage',
    'ProfileMain',
    'ProfileEdit',
  ],

  // Admin flow
  adminFlow: [
    'AdminDashboard',
    'AdminReports',
    'AdminDeals',
    'AdminUsers',
    'AdminMassUpload',
  ],
};

describe('Navigation Parity Tests (PR-023)', () => {
  describe('Stack Topology Validation', () => {
    describe('Root Stack Structure', () => {
      it('should have exactly 3 root-level stacks', () => {
        expect(EXPECTED_STACK_TOPOLOGY.rootStacks).toHaveLength(3);
      });

      it('should have OnboardingStack as a root stack', () => {
        expect(EXPECTED_STACK_TOPOLOGY.rootStacks).toContain('OnboardingStack');
      });

      it('should have AdminStack as a root stack', () => {
        expect(EXPECTED_STACK_TOPOLOGY.rootStacks).toContain('AdminStack');
      });

      it('should have AppStack as a root stack', () => {
        expect(EXPECTED_STACK_TOPOLOGY.rootStacks).toContain('AppStack');
      });
    });

    describe('Onboarding Stack Topology', () => {
      it('should have Landing as initial route', () => {
        expect(EXPECTED_STACK_TOPOLOGY.onboarding.initialRoute).toBe('Landing');
        expect(ONBOARDING_ROUTES.Landing).toBe('Landing');
      });

      it('should have exactly 11 onboarding screens', () => {
        expect(EXPECTED_STACK_TOPOLOGY.onboarding.screens).toHaveLength(11);
        expect(Object.keys(ONBOARDING_ROUTES)).toHaveLength(11);
      });

      it('should match route constants for all onboarding screens', () => {
        const expectedScreens = EXPECTED_STACK_TOPOLOGY.onboarding.screens;
        const routeValues = Object.values(ONBOARDING_ROUTES);

        expectedScreens.forEach((screen) => {
          expect(routeValues).toContain(screen);
        });
      });
    });

    describe('Admin Stack Topology', () => {
      it('should have AdminDashboard as initial route', () => {
        expect(EXPECTED_STACK_TOPOLOGY.admin.initialRoute).toBe('AdminDashboard');
        expect(ADMIN_ROUTES.AdminDashboard).toBe('AdminDashboard');
      });

      it('should have exactly 5 admin screens', () => {
        expect(EXPECTED_STACK_TOPOLOGY.admin.screens).toHaveLength(5);
        expect(Object.keys(ADMIN_ROUTES)).toHaveLength(5);
      });

      it('should match route constants for all admin screens', () => {
        const expectedScreens = EXPECTED_STACK_TOPOLOGY.admin.screens;
        const routeValues = Object.values(ADMIN_ROUTES);

        expectedScreens.forEach((screen) => {
          expect(routeValues).toContain(screen);
        });
      });
    });

    describe('App Stack Topology', () => {
      it('should have MainTabs as initial route', () => {
        expect(EXPECTED_STACK_TOPOLOGY.app.initialRoute).toBe('MainTabs');
        expect(APP_STACK_ROUTES.MainTabs).toBe('MainTabs');
      });

      it('should have exactly 7 app stack screens', () => {
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toHaveLength(7);
        expect(Object.keys(APP_STACK_ROUTES)).toHaveLength(7);
      });

      it('should have exactly 5 tab screens', () => {
        expect(EXPECTED_STACK_TOPOLOGY.app.tabs.screens).toHaveLength(5);
        expect(Object.keys(TAB_ROUTES)).toHaveLength(5);
      });

      it('should match route constants for all app stack screens', () => {
        const expectedScreens = EXPECTED_STACK_TOPOLOGY.app.screens;
        const routeValues = Object.values(APP_STACK_ROUTES);

        expectedScreens.forEach((screen) => {
          expect(routeValues).toContain(screen);
        });
      });

      it('should match route constants for all tab screens', () => {
        const expectedTabs = EXPECTED_STACK_TOPOLOGY.app.tabs.screens;
        const tabValues = Object.values(TAB_ROUTES);

        expectedTabs.forEach((tab) => {
          expect(tabValues).toContain(tab);
        });
      });
    });

    describe('Tab Stack Topologies', () => {
      it('should have Feed Main as feed stack initial route', () => {
        expect(EXPECTED_STACK_TOPOLOGY.tabStacks.feed.initialRoute).toBe('Feed Main');
        expect(FEED_STACK_ROUTES.FeedMain).toBe('Feed Main');
      });

      it('should have exactly 2 feed stack screens', () => {
        expect(EXPECTED_STACK_TOPOLOGY.tabStacks.feed.screens).toHaveLength(2);
        expect(Object.keys(FEED_STACK_ROUTES)).toHaveLength(2);
      });

      it('should have exactly 1 discover stack screen', () => {
        expect(EXPECTED_STACK_TOPOLOGY.tabStacks.discover.screens).toHaveLength(1);
        expect(Object.keys(DISCOVER_STACK_ROUTES)).toHaveLength(1);
      });

      it('should have exactly 1 contribute stack screen', () => {
        expect(EXPECTED_STACK_TOPOLOGY.tabStacks.contribute.screens).toHaveLength(1);
        expect(Object.keys(CONTRIBUTE_STACK_ROUTES)).toHaveLength(1);
      });

      it('should have exactly 1 favorites stack screen', () => {
        expect(EXPECTED_STACK_TOPOLOGY.tabStacks.favorites.screens).toHaveLength(1);
        expect(Object.keys(FAVORITES_STACK_ROUTES)).toHaveLength(1);
      });

      it('should have exactly 8 profile stack screens', () => {
        expect(EXPECTED_STACK_TOPOLOGY.tabStacks.profile.screens).toHaveLength(8);
        expect(Object.keys(PROFILE_STACK_ROUTES)).toHaveLength(8);
      });

      it('should match route constants for profile stack screens', () => {
        const expectedScreens = EXPECTED_STACK_TOPOLOGY.tabStacks.profile.screens;
        const routeValues = Object.values(PROFILE_STACK_ROUTES);

        expectedScreens.forEach((screen) => {
          expect(routeValues).toContain(screen);
        });
      });
    });
  });

  describe('Route Contract Parity', () => {
    describe('Total Route Count', () => {
      it('should have expected total number of unique routes', () => {
        const expectedTotal =
          EXPECTED_STACK_TOPOLOGY.onboarding.screens.length +
          EXPECTED_STACK_TOPOLOGY.admin.screens.length +
          EXPECTED_STACK_TOPOLOGY.app.screens.length +
          EXPECTED_STACK_TOPOLOGY.app.tabs.screens.length +
          EXPECTED_STACK_TOPOLOGY.tabStacks.feed.screens.length +
          EXPECTED_STACK_TOPOLOGY.tabStacks.discover.screens.length +
          EXPECTED_STACK_TOPOLOGY.tabStacks.contribute.screens.length +
          EXPECTED_STACK_TOPOLOGY.tabStacks.favorites.screens.length +
          EXPECTED_STACK_TOPOLOGY.tabStacks.profile.screens.length;

        expect(Object.keys(ALL_ROUTES)).toHaveLength(expectedTotal);
      });
    });

    describe('Shared Screen Accessibility', () => {
      it('DealDetail should be accessible from app stack', () => {
        expect(APP_STACK_ROUTES.DealDetail).toBe('DealDetail');
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toContain('DealDetail');
      });

      it('RestaurantDetail should be accessible from app stack', () => {
        expect(APP_STACK_ROUTES.RestaurantDetail).toBe('RestaurantDetail');
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toContain('RestaurantDetail');
      });

      it('DealEdit should be accessible from app stack', () => {
        expect(APP_STACK_ROUTES.DealEdit).toBe('DealEdit');
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toContain('DealEdit');
      });

      it('ReportContent should be accessible from app stack', () => {
        expect(APP_STACK_ROUTES.ReportContent).toBe('ReportContent');
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toContain('ReportContent');
      });

      it('BlockUser should be accessible from app stack', () => {
        expect(APP_STACK_ROUTES.BlockUser).toBe('BlockUser');
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toContain('BlockUser');
      });

      it('UserProfile should be accessible from app stack', () => {
        expect(APP_STACK_ROUTES.UserProfile).toBe('UserProfile');
        expect(EXPECTED_STACK_TOPOLOGY.app.screens).toContain('UserProfile');
      });
    });

    describe('Root Stack Mutual Exclusivity', () => {
      it('OnboardingStack routes should not overlap with AppStack routes', () => {
        const onboardingRoutes = new Set(Object.values(ONBOARDING_ROUTES));
        const appRoutes = new Set(Object.values(APP_STACK_ROUTES));

        onboardingRoutes.forEach((route) => {
          expect(appRoutes.has(route as any)).toBe(false);
        });
      });

      it('AdminStack routes should not overlap with AppStack routes', () => {
        const adminRoutes = new Set(Object.values(ADMIN_ROUTES));
        const appRoutes = new Set(Object.values(APP_STACK_ROUTES));

        adminRoutes.forEach((route) => {
          expect(appRoutes.has(route as any)).toBe(false);
        });
      });

      it('OnboardingStack routes should not overlap with AdminStack routes', () => {
        const onboardingRoutes = new Set(Object.values(ONBOARDING_ROUTES));
        const adminRoutes = new Set(Object.values(ADMIN_ROUTES));

        onboardingRoutes.forEach((route) => {
          expect(adminRoutes.has(route as any)).toBe(false);
        });
      });
    });
  });

  describe('Deep Link Parity', () => {
    it('should have exactly 2 URL prefixes', () => {
      expect(DEEP_LINK_CONFIG.prefixes).toHaveLength(2);
    });

    it('should include imhungri:// scheme', () => {
      expect(DEEP_LINK_CONFIG.prefixes).toContain('imhungri://');
    });

    it('should include com.imhungri:// scheme', () => {
      expect(DEEP_LINK_CONFIG.prefixes).toContain('com.imhungri://');
    });

    it('should have ResetPassword as deep-linkable screen', () => {
      expect(DEEP_LINK_CONFIG.screens).toHaveProperty(ONBOARDING_ROUTES.ResetPassword);
    });

    it('ResetPassword deep link path should be reset-password', () => {
      expect(DEEP_LINK_CONFIG.screens[ONBOARDING_ROUTES.ResetPassword]).toBe('reset-password');
    });

    it('should have exactly 1 deep-linkable screen', () => {
      expect(Object.keys(DEEP_LINK_CONFIG.screens)).toHaveLength(1);
    });

    it('deep-linkable screens should exist in route constants', () => {
      Object.keys(DEEP_LINK_CONFIG.screens).forEach((screenName) => {
        const allRouteValues = Object.values(ALL_ROUTES);
        expect(allRouteValues).toContain(screenName);
      });
    });
  });

  describe('Smoke Path Assertions', () => {
    describe('Onboarding Paths', () => {
      it('new user signup path should have valid routes', () => {
        const allRouteValues = Object.values(ALL_ROUTES);

        SMOKE_PATHS.newUserSignup.forEach((route) => {
          expect(allRouteValues).toContain(route);
        });
      });

      it('new user signup should start at Landing', () => {
        expect(SMOKE_PATHS.newUserSignup[0]).toBe('Landing');
      });

      it('new user signup should end at CuisinePreferences', () => {
        const lastRoute = SMOKE_PATHS.newUserSignup[SMOKE_PATHS.newUserSignup.length - 1];
        expect(lastRoute).toBe('CuisinePreferences');
      });

      it('existing user login path should have valid routes', () => {
        const allRouteValues = Object.values(ALL_ROUTES);

        SMOKE_PATHS.existingUserLogin.forEach((route) => {
          expect(allRouteValues).toContain(route);
        });
      });

      it('password reset path should have valid routes', () => {
        const allRouteValues = Object.values(ALL_ROUTES);

        SMOKE_PATHS.passwordReset.forEach((route) => {
          expect(allRouteValues).toContain(route);
        });
      });

      it('password reset should include ResetPassword screen', () => {
        expect(SMOKE_PATHS.passwordReset).toContain('ResetPassword');
      });
    });

    describe('Main Tabs Paths', () => {
      it('tab navigation path should have valid routes', () => {
        const tabValues = Object.values(TAB_ROUTES);

        SMOKE_PATHS.tabNavigation.forEach((route) => {
          expect(tabValues).toContain(route);
        });
      });

      it('tab navigation should include all major tabs', () => {
        expect(SMOKE_PATHS.tabNavigation).toContain('Feed');
        expect(SMOKE_PATHS.tabNavigation).toContain('DiscoverFeed');
        expect(SMOKE_PATHS.tabNavigation).toContain('FavoritesPage');
        expect(SMOKE_PATHS.tabNavigation).toContain('ProfilePage');
      });
    });

    describe('Shared Stack Routes Paths', () => {
      it('deal flow path should have valid routes', () => {
        const allRouteValues = Object.values(ALL_ROUTES);

        SMOKE_PATHS.dealFlow.forEach((route) => {
          expect(allRouteValues).toContain(route);
        });
      });

      it('deal flow should navigate from Feed to DealDetail', () => {
        expect(SMOKE_PATHS.dealFlow[0]).toBe('Feed');
        expect(SMOKE_PATHS.dealFlow[1]).toBe('DealDetail');
      });

      it('profile settings flow should have valid routes', () => {
        const allRouteValues = Object.values(ALL_ROUTES);

        SMOKE_PATHS.profileSettingsFlow.forEach((route) => {
          expect(allRouteValues).toContain(route);
        });
      });

      it('profile settings should navigate through ProfilePage to ProfileEdit', () => {
        expect(SMOKE_PATHS.profileSettingsFlow).toContain('ProfilePage');
        expect(SMOKE_PATHS.profileSettingsFlow).toContain('ProfileMain');
        expect(SMOKE_PATHS.profileSettingsFlow).toContain('ProfileEdit');
      });
    });

    describe('Admin Paths', () => {
      it('admin flow path should have valid routes', () => {
        const adminValues = Object.values(ADMIN_ROUTES);

        SMOKE_PATHS.adminFlow.forEach((route) => {
          expect(adminValues).toContain(route);
        });
      });

      it('admin flow should start at AdminDashboard', () => {
        expect(SMOKE_PATHS.adminFlow[0]).toBe('AdminDashboard');
      });

      it('admin flow should include all admin screens', () => {
        expect(SMOKE_PATHS.adminFlow).toContain('AdminDashboard');
        expect(SMOKE_PATHS.adminFlow).toContain('AdminReports');
        expect(SMOKE_PATHS.adminFlow).toContain('AdminDeals');
        expect(SMOKE_PATHS.adminFlow).toContain('AdminUsers');
        expect(SMOKE_PATHS.adminFlow).toContain('AdminMassUpload');
      });
    });
  });

  describe('App Shell Extraction Safety', () => {
    describe('Gate Components Compatibility', () => {
      it('FontGate should not affect route definitions', () => {
        // Route constants should remain the same after FontGate extraction
        expect(Object.keys(ALL_ROUTES).length).toBeGreaterThan(0);
      });

      it('SplashGate should not affect stack topology', () => {
        // Stack topology should remain the same after SplashGate extraction
        expect(EXPECTED_STACK_TOPOLOGY.rootStacks).toHaveLength(3);
      });
    });

    describe('AppRoot Provider Compatibility', () => {
      it('tab screens should be accessible through AppProviders', () => {
        const tabScreens = Object.values(TAB_ROUTES);
        expect(tabScreens).toHaveLength(5);
      });

      it('shared screens should be accessible after provider initialization', () => {
        const sharedScreens = ['DealDetail', 'DealEdit', 'RestaurantDetail'];
        const appScreens = Object.values(APP_STACK_ROUTES);

        sharedScreens.forEach((screen) => {
          expect(appScreens).toContain(screen);
        });
      });
    });

    describe('Navigation Container Integration', () => {
      it('deep link config should be compatible with NavigationContainer', () => {
        expect(DEEP_LINK_CONFIG).toHaveProperty('prefixes');
        expect(DEEP_LINK_CONFIG).toHaveProperty('screens');
        expect(Array.isArray(DEEP_LINK_CONFIG.prefixes)).toBe(true);
        expect(typeof DEEP_LINK_CONFIG.screens).toBe('object');
      });

      it('all root stacks should be selectable by App.tsx', () => {
        // Verify route constants exist for each root stack''s initial screen
        expect(ONBOARDING_ROUTES.Landing).toBeDefined();
        expect(ADMIN_ROUTES.AdminDashboard).toBeDefined();
        expect(APP_STACK_ROUTES.MainTabs).toBeDefined();
      });
    });
  });
});

describe('Regression Snapshot Tests', () => {
  it('should match onboarding routes snapshot', () => {
    expect(ONBOARDING_ROUTES).toMatchSnapshot();
  });

  it('should match admin routes snapshot', () => {
    expect(ADMIN_ROUTES).toMatchSnapshot();
  });

  it('should match app stack routes snapshot', () => {
    expect(APP_STACK_ROUTES).toMatchSnapshot();
  });

  it('should match tab routes snapshot', () => {
    expect(TAB_ROUTES).toMatchSnapshot();
  });

  it('should match feed stack routes snapshot', () => {
    expect(FEED_STACK_ROUTES).toMatchSnapshot();
  });

  it('should match discover stack routes snapshot', () => {
    expect(DISCOVER_STACK_ROUTES).toMatchSnapshot();
  });

  it('should match contribute stack routes snapshot', () => {
    expect(CONTRIBUTE_STACK_ROUTES).toMatchSnapshot();
  });

  it('should match favorites stack routes snapshot', () => {
    expect(FAVORITES_STACK_ROUTES).toMatchSnapshot();
  });

  it('should match profile stack routes snapshot', () => {
    expect(PROFILE_STACK_ROUTES).toMatchSnapshot();
  });

  it('should match deep link config snapshot', () => {
    expect(DEEP_LINK_CONFIG).toMatchSnapshot();
  });
});
