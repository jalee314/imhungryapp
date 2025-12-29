import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Header } from '#/features/deals';
import { LocationModal } from '#/features/discover';
import { useLocation } from '#/features/discover';
import Feed from '#/features/deals/screens/Feed';
import DiscoverFeed from '#/features/discover/screens/DiscoverFeed';

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
    // Refresh permission status when modal is opened (in case user returned from settings)
    await refreshPermissionStatus();
    setLocationModalVisible(true);
  }, [refreshPermissionStatus]);

  const handleLocationUpdate = useCallback((location: { id: string; city: string; state: string; coordinates?: { lat: number; lng: number } }) => {
    updateLocation(location);
    console.log('Location updated to:', location);
  }, [updateLocation]);

  const handleLocationModalClose = useCallback(() => {
    setLocationModalVisible(false);
  }, []);

  // Render the appropriate screen based on currentTab
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
    <View style={styles.container}>
      {/* Persistent Header */}
      <Header 
        onLocationPress={handleLocationPress} 
        currentLocation={currentLocation}
      />
      
      {/* Current Screen Content */}
      <View style={styles.screenContainer}>
        {renderCurrentScreen()}
      </View>

      {/* Location Modal */}
      <LocationModal
        visible={locationModalVisible}
        onClose={handleLocationModalClose}
        onLocationUpdate={handleLocationUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
});

export default FeedTabNavigator;