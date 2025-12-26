/**
 * TabBar.tsx
 * 
 * Custom tab bar component that wraps the existing BottomNavigation.
 * This follows Bluesky's pattern of separating tab bar logic from navigation.
 */

import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import BottomNavigation from '../../components/BottomNavigation';

// Tab index to tab name mapping
const TAB_MAPPING = ['feed', 'search', 'contribute', 'favorites', 'profile'] as const;

type TabName = typeof TAB_MAPPING[number];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  // Track last active tab for contribute button behavior
  const [lastActiveTab, setLastActiveTab] = React.useState<TabName>('feed');

  // Don't change activeTab if user is on contribute tab (index 2)
  const actualActiveTab: TabName = state.index === 2 
    ? lastActiveTab 
    : TAB_MAPPING[state.index];

  // Update last active tab when navigating to non-contribute tabs
  React.useEffect(() => {
    if (state.index !== 2) { // Not contribute tab
      setLastActiveTab(TAB_MAPPING[state.index]);
    }
  }, [state.index]);

  const handleTabPress = (tab: string) => {
    const typedTab = tab as TabName;
    const tabIndex = TAB_MAPPING.indexOf(typedTab);
    
    if (typedTab === 'contribute') {
      // For contribute, don't change navigation state
      // BottomNavigation component handles showing the modal
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
}

export default TabBar;
