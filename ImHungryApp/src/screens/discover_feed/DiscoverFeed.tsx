import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions, // Add this import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RowCard, { RowCardData } from '../../components/RowCard';
import RowCardSkeleton from '../../components/RowCardSkeleton';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getRestaurantsWithDeals, getRestaurantsWithDealsDirect, DiscoverRestaurant } from '../../services/discoverService';
import { useLocation } from '../../context/LocationContext';

const { width: screenWidth } = Dimensions.get('window');

const DiscoverFeed: React.FC = () => {
  const navigation = useNavigation();
  const { currentLocation, updateLocation, selectedCoordinates } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<DiscoverRestaurant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load restaurants on mount and when location changes
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try the RPC function first, fallback to direct query
        // Pass selectedCoordinates if available
        let result = await getRestaurantsWithDeals(selectedCoordinates || undefined);

        // If RPC function fails, try direct query
        if (!result.success && result.error?.includes('function')) {
          console.log('RPC function not available, trying direct query...');
          result = await getRestaurantsWithDealsDirect(selectedCoordinates || undefined);
        }

        if (result.success) {
          setRestaurants(result.restaurants);
        } else {
          setError(result.error || 'Failed to load restaurants');
        }
      } catch (err) {
        console.error('Error loading restaurants:', err);
        setError('Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [selectedCoordinates]); // Re-load when selectedCoordinates changes

  // Load current location on mount and when location changes
  // This is now handled by LocationContext, so we can remove this effect

  // Maximum distance limit in miles
  const MAX_DISTANCE_MILES = 31;

  // Filter restaurants based on search query (name only) and 20-mile distance limit
  // Also sort by distance (nearest first)
  const filteredRestaurants = restaurants
    .filter(restaurant =>
      restaurant.distance_miles <= MAX_DISTANCE_MILES &&
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.distance_miles - b.distance_miles);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleRowCardPress = (id: string) => {
    const restaurant = restaurants.find(r => r.restaurant_id === id);
    if (restaurant) {
      (navigation as any).navigate('RestaurantDetail', {
        restaurant
      });
    }
  };

  // Convert DiscoverRestaurant to RowCardData
  const convertToRowCardData = (restaurant: DiscoverRestaurant): RowCardData => ({
    id: restaurant.restaurant_id,
    title: restaurant.name,
    subtitle: restaurant.address,
    image: restaurant.logo_image
      ? { uri: restaurant.logo_image }
      : require('../../../img/gallery.jpg'),
    distance: `${restaurant.distance_miles}mi`,
    dealCount: restaurant.deal_count,
  });


  const renderRestaurantCard = ({ item }: { item: DiscoverRestaurant }) => (
    <RowCard
      data={convertToRowCardData(item)}
      variant="rest-deal"
      onPress={handleRowCardPress}
    />
  );


  const renderSearchSkeleton = () => (
    <View style={styles.searchContainer}>
      <SkeletonLoader width={screenWidth - 24} height={35} borderRadius={30} />
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <RowCardSkeleton key={item} />
      ))}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
      <Text style={styles.errorTitle}>Unable to load restaurants</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => {
        setError(null);
        setLoading(true);
        // Reload restaurants
        const loadRestaurants = async () => {
          try {
            const result = await getRestaurantsWithDealsDirect();
            if (result.success) {
              setRestaurants(result.restaurants);
            } else {
              setError(result.error || 'Failed to load restaurants');
            }
          } catch (err) {
            setError('Failed to load restaurants');
          } finally {
            setLoading(false);
          }
        };
        loadRestaurants();
      }}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={48} color="#CCC" />
      <Text style={styles.emptyTitle}>No restaurants found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try a different search term' : 'No restaurants with deals available'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderSearchSkeleton()}
        {renderLoadingState()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderSearchSkeleton()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          searchQuery.length > 0 && styles.searchInputContainerFocused
        ]}>
          <Ionicons
            name="search"
            size={16}
            color="#666"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="rgba(60, 60, 67, 0.6)"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurantCard}
          keyExtractor={(item) => item.restaurant_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          numColumns={1}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffed',
    borderWidth: 0.5,
    borderColor: '#d7d7d7',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 35,
    gap: 16,
    elevation: 2,
  },
  searchInputContainerFocused: {
    borderColor: '#d7d7d7',
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: 'rgba(60, 60, 67, 0.6)',
    fontFamily: 'Inter',
    fontWeight: '400',
    letterSpacing: -0.41,
    lineHeight: 22,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 0, // Remove extra padding since MainAppLayout handles this
  },
  listContainer: {
    paddingBottom: 100, // Remove extra padding
    paddingHorizontal: 0, // Remove horizontal padding to let cards control their own spacing
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FFA05C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DiscoverFeed;
