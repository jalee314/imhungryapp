import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavigation from './BottomNavigation';

interface MainAppLayoutProps {
  children: React.ReactNode;
}

const MainAppLayout: React.FC<MainAppLayoutProps> = ({ children }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('feed');

  // Map route names to tab IDs
  const getTabFromRoute = (routeName: string): string => {
    switch (routeName) {
      case 'Feed':
        return 'feed';
      case 'DiscoverFeed':
        return 'search';
      case 'DealCreationScreen':
        return 'contribute';
      case 'FavoritesPage':
        return 'favorites';
      case 'ProfilePage':
        return 'profile';
      default:
        return 'feed';
    }
  };

  // Update active tab based on current route
  React.useEffect(() => {
    const currentTab = getTabFromRoute(route.name);
    setActiveTab(currentTab);
  }, [route.name]);

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      <BottomNavigation 
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingBottom: 60, // Add padding to account for bottom navigation height
  },
});

export default MainAppLayout;
