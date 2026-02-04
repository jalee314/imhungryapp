/**
 * FeedTabNavigator - Feed Screen Container
 * 
 * A container component that renders Header and current feed screen.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React, { useState, useCallback } from 'react';
import { Box } from './atoms';
import Header from './Header';
import LocationModal from './LocationModal';
import { useLocation } from '../context/LocationContext';
import Feed from '../screens/deal_feed/Feed';
import DiscoverFeed from '../screens/discover_feed/DiscoverFeed';

interface FeedTabNavigatorProps {
  currentTab?: 'feed' | 'discover';
  onTabChange?: (tab: 'feed' | 'discover') => void;
}

const FeedTabNavigator: React.FC<FeedTabNavigatorProps> = ({ 
  currentTab = 'feed',
  onTabChange 
}) => {
  const { currentLocation, updateLocation, refreshPermissionStatus } = useLocation();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const handleLocationPress = useCallback(async () => {
    await refreshPermissionStatus();
    setLocationModalVisible(true);
  }, [refreshPermissionStatus]);

  const handleLocationUpdate = useCallback((location: { 
    id: string; 
    city: string; 
    state: string; 
    coordinates?: { lat: number; lng: number } 
  }) => {
    updateLocation(location);
  }, [updateLocation]);

  const handleLocationModalClose = useCallback(() => {
    setLocationModalVisible(false);
  }, []);

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'feed':
        return <Feed />;
      case 'discover':
        return <DiscoverFeed />;
      default:
        return <Feed />;
    }
  };

  return (
    <Box flex={1} bg="background">
      {/* Persistent Header */}
      <Header 
        onLocationPress={handleLocationPress} 
        currentLocation={currentLocation}
      />
      
      {/* Current Screen Content */}
      <Box flex={1}>
        {renderCurrentScreen()}
      </Box>

      {/* Location Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={handleLocationModalClose}
        onLocationUpdate={handleLocationUpdate}
      />
    </Box>
  );
};

export default FeedTabNavigator;
