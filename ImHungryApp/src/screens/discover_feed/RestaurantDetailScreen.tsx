import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import RowCard, { RowCardData } from '../../components/RowCard';
import { DiscoverRestaurant } from '../../services/discoverService';
import { getCurrentUserLocation } from '../../services/locationService';
import { calculateDistance } from '../../services/locationService';
import { isRestaurantFavorited as checkRestaurantFavorited, toggleRestaurantFavorite } from '../../services/restaurantFavoriteService';

type RestaurantDetailRouteProp = RouteProp<{ 
  RestaurantDetail: { 
    restaurant: DiscoverRestaurant;
  } 
}, 'RestaurantDetail'>;

export interface RestaurantDeal {
  deal_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  end_date: string | null;
  views: number;
  votes: number;
  is_upvoted: boolean;
  is_downvoted: boolean;
  is_favorited: boolean;
  user_display_name: string | null;
  user_profile_photo: string | null;
  is_anonymous: boolean;
}

const RestaurantDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RestaurantDetailRouteProp>();
  const { restaurant } = route.params;
  
  const [deals, setDeals] = useState<RestaurantDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuisineName, setCuisineName] = useState<string>('');
  const [isRestaurantFavorited, setIsRestaurantFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    loadRestaurantDeals();
    loadRestaurantCuisine();
    checkRestaurantFavoriteStatus();
  }, [restaurant.restaurant_id]); // Add dependency

  const loadRestaurantDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('deal_instance')
        .select(`
          deal_id,
          created_at,
          end_date,
          template_id,
          deal_template!inner(
            title,
            description,
            image_url,
            restaurant_id,
            user_id,
            is_anonymous,
            user!inner(
              display_name,
              profile_photo
            ),
            restaurant!inner(
              name
            )
          )
        `)
        .eq('deal_template.restaurant_id', restaurant.restaurant_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurant deals:', error);
        setError('Failed to load deals');
        return;
      }

      // Transform and process deals
      const processedDeals: RestaurantDeal[] = await Promise.all(
        data.map(async (deal) => {
          // Get view count for this deal (count of click-open interactions)
          const { count: viewCount } = await supabase
            .from('interaction')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.deal_id)
            .eq('interaction_type', 'click-open');

          // Get vote count from click-open interactions
          const { count: voteCount } = await supabase
            .from('interaction')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', deal.deal_id)
            .in('interaction_type', ['click-open', 'upvote', 'vote', 'click']);

          // Get favorite status
          const { data: favoriteData } = await supabase
            .from('favorite')
            .select('favorite_id')
            .eq('deal_id', deal.deal_id)
            .single();

          return {
            deal_id: deal.deal_id,
            title: deal.deal_template.title,
            description: deal.deal_template.description,
            image_url: deal.deal_template.image_url,
            created_at: deal.created_at,
            end_date: deal.end_date,
            views: viewCount || 0,
            votes: voteCount || 0,
            is_upvoted: false,
            is_downvoted: false,
            is_favorited: !!favoriteData,
            user_display_name: deal.deal_template.is_anonymous ? null : deal.deal_template.user.display_name,
            user_profile_photo: deal.deal_template.is_anonymous ? null : deal.deal_template.user.profile_photo,
            is_anonymous: deal.deal_template.is_anonymous,
          };
        })
      );

      setDeals(processedDeals);
    } catch (err) {
      console.error('Error loading restaurant deals:', err);
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantCuisine = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_cuisine')
        .select(`
          cuisine!inner(
            cuisine_name
          )
        `)
        .eq('restaurant_id', restaurant.restaurant_id)
        .limit(1);

      if (!error && data && data.length > 0) {
        setCuisineName(data[0].cuisine.cuisine_name);
      }
    } catch (err) {
      console.error('Error loading restaurant cuisine:', err);
    }
  };

  const checkRestaurantFavoriteStatus = async () => {
    try {
      const favorited = await checkRestaurantFavorited(restaurant.restaurant_id);
      setIsRestaurantFavorited(favorited);
    } catch (err) {
      console.error('Error checking restaurant favorite status:', err);
    }
  };

  const handleRestaurantFavorite = async () => {
    try {
      setFavoriteLoading(true);
      
      const result = await toggleRestaurantFavorite(
        restaurant.restaurant_id,
        isRestaurantFavorited, // Pass current state
        // Optimistic update callback - immediately update UI
        (isFavorited) => {
          setIsRestaurantFavorited(isFavorited);
        }
      );
      
      if (!result.success) {
        // Only show error if the operation failed
        Alert.alert('Error', result.error || 'Failed to update favorites');
      }
    } catch (err) {
      console.error('Error toggling restaurant favorite:', err);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDealPress = (dealId: string) => {
    // Navigate to deal detail screen
    // You'll need to implement this navigation
    console.log('Deal pressed:', dealId);
  };

  const handleDirections = async () => {
    try {
      const { lat, lng } = restaurant;
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps');
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to open directions');
    }
  };

  // Memoize the convertToRowCardData function to prevent unnecessary re-creations
  const convertToRowCardData = useCallback((deal: RestaurantDeal): RowCardData => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString();
      const day = date.getDate().toString();
      return `${month}/${day}`;
    };

    const formatExpiration = (endDate: string | null) => {
      if (!endDate) return 'No expiration';
      
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) return 'Expired';
      if (diffDays === 1) return '1 day';
      return `${diffDays} days`;
    };

    const getImageSource = () => {
      if (!deal.image_url) {
        return require('../../../img/gallery.jpg');
      }
      
      // Construct Supabase public URL
      const baseUrl = 'https://your-supabase-project.supabase.co/storage/v1/object/public';
      return { uri: `${baseUrl}/${deal.image_url}` };
    };

    return {
      id: deal.deal_id,
      title: deal.title,
      subtitle: '',
      image: getImageSource(),
      postedDate: formatDate(deal.created_at),
      expiresIn: formatExpiration(deal.end_date),
      views: deal.views,
    };
  }, []); // Empty dependency array since it doesn't depend on any props/state

  // Memoize the renderDealCard function
  const renderDealCard = useCallback(({ item }: { item: RestaurantDeal }) => (
    <RowCard
      data={convertToRowCardData(item)}
      variant="explore-deal-card"
      onPress={handleDealPress}
    />
  ), [convertToRowCardData]);

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF8C4C" />
      <Text style={styles.loadingText}>Loading deals...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadRestaurantDeals}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No deals found for this restaurant</Text>
    </View>
  );

  const formatDistance = (distance: number) => {
    return Math.round(distance).toString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Simple Header with Back Arrow and Directions */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Restaurant Info Section */}
      <View style={styles.restaurantInfoSection}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <TouchableOpacity style={styles.heartButton} onPress={handleRestaurantFavorite} disabled={favoriteLoading}>
            <Ionicons 
              name={isRestaurantFavorited ? "heart" : "heart-outline"} 
              size={22} 
              color={isRestaurantFavorited ? "#FF8C4C" : "#000000"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.restaurantDetailsContainer}>
          <Text style={styles.restaurantDetails}>
            <Text style={styles.cuisineText}>🍽 {cuisineName || 'Cuisine'}</Text>
          </Text>
          <Text style={styles.restaurantDetails}>
            <Text style={styles.distanceText}>📍 {formatDistance(restaurant.distance_miles)}mi away </Text>
            <Text style={styles.separator}>• </Text>
            <Text style={styles.addressText}>{restaurant.address}</Text>
          </Text>
        </View>
      </View>

      {/* Deals List */}
      <View style={styles.dealsContainer}>
        {loading ? renderLoadingState() : 
         error ? renderErrorState() : 
         deals.length === 0 ? renderEmptyState() :
         (
          <FlatList
            data={deals}
            renderItem={renderDealCard}
            keyExtractor={(item) => item.deal_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dealsList}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D7D7D7',
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerSpacer: {
    height: 20, // Space to push buttons down
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsButton: {
    backgroundColor: '#FF8C4C',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'Inter',
  },
  restaurantInfoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  heartButton: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantDetailsContainer: {
    flexDirection: 'column',
  },
  restaurantDetails: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  cuisineText: {
    color: '#000000',
  },
  distanceText: {
    color: '#000000',
  },
  separator: {
    color: '#000000',
    fontWeight: '300',
    marginHorizontal: 4,
  },
  addressText: {
    color: '#000000',
    marginLeft: 4,
  },
  dealsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dealsList: {
    paddingVertical: 8,
    paddingBottom: 64,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF8C4C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default RestaurantDetailScreen;
