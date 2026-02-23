/**
 * CustomTabBar (PR-021)
 * 
 * Custom tab bar component that wraps BottomNavigation.
 * Handles tab state management and special contribute tab behavior.
 */

import React from 'react';

import BottomNavigation from '../../../components/BottomNavigation';

interface CustomTabBarProps {
  state: {
    index: number;
    routeNames: string[];
  };
  navigation: {
    navigate: (name: string, params?: object) => void;
  };
}

/** Tab mapping from index to tab name */
const TAB_MAPPING = ['feed', 'search', 'contribute', 'favorites', 'profile'] as const;

/**
 * CustomTabBar - Custom tab bar using BottomNavigation
 * 
 * Handles:
 * - Tab state tracking
 * - Contribute tab modal behavior (doesn't change nav state)
 * - Profile tab reset behavior
 */
export const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, navigation }) => {
  // Don't change activeTab if user is on contribute tab (which is index 2)
  const actualActiveTab = state.index === 2 ? 'feed' : TAB_MAPPING[state.index];
  const [lastActiveTab, setLastActiveTab] = React.useState('feed');

  // Update last active tab when navigating to non-contribute tabs
  React.useEffect(() => {
    if (state.index !== 2) { // Not contribute tab
      setLastActiveTab(TAB_MAPPING[state.index]);
    }
  }, [state.index]);

  const handleTabPress = (tab: string) => {
    const tabIndex = TAB_MAPPING.indexOf(tab as typeof TAB_MAPPING[number]);
    if (tab === 'contribute') {
      // For contribute, don't change navigation state, just show modal
      // The BottomNavigation component will handle showing the modal
      return;
    }
    
    // Special handling for Profile tab - always reset to own profile
    if (tab === 'profile') {
      // Reset the ProfileStack to ProfileMain with no params (shows own profile)
      navigation.navigate('ProfilePage', {
        screen: 'ProfileMain',
        params: { viewUser: false, userId: undefined },
      });
      return;
    }
    
    if (tabIndex !== -1 && tabIndex !== state.index) {
      navigation.navigate(state.routeNames[tabIndex]);
    }
  };

  return (
    <BottomNavigation
      activeTab={state.index === 2 ? lastActiveTab : actualActiveTab}
      onTabPress={handleTabPress}
    />
  );
};

export default CustomTabBar;
