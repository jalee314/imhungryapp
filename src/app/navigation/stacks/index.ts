/**
 * Navigation Stacks Module (PR-021)
 * 
 * Central export for all navigation stack components.
 */

// Root-level stacks
export { OnboardingStack } from './OnboardingStack';
export { AdminStack } from './AdminStack';
export { AppStack } from './AppStack';

// Tab navigator and custom tab bar
export { MainTabNavigator } from './MainTabNavigator';
export { CustomTabBar } from './CustomTabBar';

// Individual tab stacks
export {
  FeedStack,
  DiscoverStack,
  ContributeStack,
  FavoritesStack,
  ProfileStack,
} from './TabStacks';
