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
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import RowCard, { RowCardData } from '../../components/RowCard';
import { DiscoverRestaurant } from '../../services/discoverService';
import { getCurrentUserLocation } from '../../services/locationService';
import { calculateDistance } from '../../services/locationService';
import { isRestaurantFavorited as checkRestaurantFavorited, toggleRestaurantFavorite } from '../../services/restaurantFavoriteService';
import { Deal } from '../../components/DealCard';
import { logClick } from '../../services/interactionService';

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
  image_metadata?: {
    variants?: {
      original?: string;
      large?: string;
      medium?: string;
      small?: string;
      thumbnail?: string;
    };
  };
  created_at: string;
  end_date: string | null;
  views: number;
  votes: number;
  is_upvoted: boolean;
  is_downvoted: boolean;
  is_favorited: boolean;
  user_id: string | null; // Add this field
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
    console.log('🔄 useEffect triggered for restaurant:', restaurant.restaurant_id);
    console.log('🔄 Restaurant object:', { id: restaurant.restaurant_id, name: restaurant.name });
    loadRestaurantDeals();
    loadRestaurantCuisine();
    checkRestaurantFavoriteStatus();
  }, [restaurant.restaurant_id]); // Add dependency

  // Debug deals state changes
  useEffect(() => {
    console.log('🔍 Deals state changed:', { length: deals.length, deals: deals.map(d => ({ id: d.deal_id, title: d.title })) });
  }, [deals]);

  const loadRestaurantDeals = async () => {
    console.log('🔄 loadRestaurantDeals called for restaurant:', restaurant.restaurant_id);
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
            image_metadata_id,
            restaurant_id,
            user_id,
            is_anonymous,
            image_metadata:image_metadata_id (
              variants
            ),
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

          const template = Array.isArray(deal.deal_template) ? deal.deal_template[0] : deal.deal_template;
          const user = Array.isArray(template.user) ? template.user[0] : template.user;
          const imageMetadata = Array.isArray(template.image_metadata) ? template.image_metadata[0] : template.image_metadata;
          
          console.log('🔍 Processing deal:', template.title, {
            has_image_url: !!template.image_url,
            has_image_metadata: !!imageMetadata,
            image_metadata_variants: imageMetadata?.variants,
            image_url: template.image_url
          });
          
          return {
            deal_id: deal.deal_id,
            title: template.title,
            description: template.description,
            image_url: template.image_url,
            image_metadata: imageMetadata,
            created_at: deal.created_at,
            end_date: deal.end_date,
            views: viewCount || 0,
            votes: voteCount || 0,
            is_upvoted: false,
            is_downvoted: false,
            is_favorited: !!favoriteData,
            user_id: template.user_id, // Add user_id for profile navigation
            user_display_name: template.is_anonymous ? null : user.display_name,
            user_profile_photo: template.is_anonymous ? null : user.profile_photo,
            is_anonymous: template.is_anonymous,
          };
        })
      );

      console.log('🔍 Loaded deals:', processedDeals.map(d => ({ id: d.deal_id, title: d.title })));
      console.log('🔍 Setting deals state with length:', processedDeals.length);
      setDeals(processedDeals);
      console.log('🔍 Deals state set successfully');
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
        const cuisine = Array.isArray(data[0].cuisine) ? data[0].cuisine[0] : data[0].cuisine;
        setCuisineName(cuisine.cuisine_name);
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

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleDealPress = async (dealId: string) => {
    try {
      console.log('🔍 handleDealPress called with dealId:', dealId);
      console.log('🔍 Available deals count:', deals.length);
      console.log('🔍 Available deal IDs:', deals.map(d => d.deal_id));

      // Find the deal data
      const dealData = deals.find(deal => deal.deal_id === dealId);
      if (!dealData) {
        console.error('Deal not found:', dealId);
        return;
      }

      // Convert RestaurantDeal to Deal format
      const dealForDetail: Deal = {
        id: dealData.deal_id,
        title: dealData.title,
        restaurant: restaurant.name,
        details: dealData.description || '',
        // Updated image handling to use Cloudinary or fallback
        image: (() => {
          let imageUrl;
          // If we have Cloudinary variants, use the medium variant as the primary image
          if (dealData.image_metadata?.variants?.medium) {
            imageUrl = dealData.image_metadata.variants.medium;
            console.log('🖼️ Using Cloudinary medium variant for deal:', dealData.title, imageUrl);
          } else if (dealData.image_metadata?.variants?.small) {
            imageUrl = dealData.image_metadata.variants.small;
            console.log('🖼️ Using Cloudinary small variant for deal:', dealData.title, imageUrl);
          } else if (dealData.image_metadata?.variants?.large) {
            imageUrl = dealData.image_metadata.variants.large;
            console.log('🖼️ Using Cloudinary large variant for deal:', dealData.title, imageUrl);
          } else if (dealData.image_url) {
            // Fallback to legacy image_url
            if (dealData.image_url.startsWith('http')) {
              imageUrl = dealData.image_url;
              console.log('🖼️ Using legacy HTTP URL for deal:', dealData.title, imageUrl);
            } else {
              imageUrl = supabase.storage.from('deal-images').getPublicUrl(dealData.image_url).data.publicUrl;
              console.log('🖼️ Using Supabase storage URL for deal:', dealData.title, imageUrl);
            }
          } else {
            // Ultimate fallback
            imageUrl = require('../../../img/gallery.jpg');
            console.log('🖼️ Using gallery fallback for deal:', dealData.title);
          }
          return imageUrl;
        })(),
        imageVariants: dealData.image_metadata?.variants, // For OptimizedImage component
        votes: dealData.votes,
        isUpvoted: dealData.is_upvoted,
        isDownvoted: dealData.is_downvoted,
        isFavorited: dealData.is_favorited,
        cuisine: cuisineName,
        timeAgo: formatTimeAgo(dealData.created_at),
        author: dealData.user_display_name || 'Anonymous',
        milesAway: formatDistance(restaurant.distance_miles),
        userId: dealData.user_display_name ? dealData.user_display_name : undefined,
        userDisplayName: dealData.user_display_name || undefined,
        userProfilePhoto: dealData.user_profile_photo ? 
          (dealData.user_profile_photo.startsWith('http') 
            ? dealData.user_profile_photo 
            : supabase.storage.from('avatars').getPublicUrl(dealData.user_profile_photo).data.publicUrl
          ) : undefined,
        restaurantAddress: restaurant.address,
        isAnonymous: dealData.is_anonymous,
      };

      // Log the click interaction
      logClick(dealId).catch(err => {
        console.error('Failed to log click:', err);
      });

      // Navigate to deal detail screen
      (navigation as any).navigate('DealDetail', { deal: dealForDetail });
    } catch (error) {
      console.error('Error handling deal press:', error);
    }
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

    // Convert relative image URL to full Supabase URL or use Cloudinary
    const getImageSource = () => {
      // If we have Cloudinary variants, use the small variant for the card
      if (deal.image_metadata?.variants?.small) {
        return { uri: deal.image_metadata.variants.small };
      } else if (deal.image_metadata?.variants?.thumbnail) {
        return { uri: deal.image_metadata.variants.thumbnail };
      } else if (deal.image_metadata?.variants?.medium) {
        return { uri: deal.image_metadata.variants.medium };
      } else if (deal.image_url) {
        // Fallback to legacy image_url
        if (deal.image_url.startsWith('http')) {
          return { uri: deal.image_url };
        }
        
        // Use Supabase storage to get the public URL
        const { data } = supabase.storage
          .from('deal-images')
          .getPublicUrl(deal.image_url);
        
        return { uri: data.publicUrl };
      }
      
      // Ultimate fallback
      return require('../../../img/gallery.jpg');
    };

    return {
      id: deal.deal_id,
      title: deal.title,
      subtitle: '',
      image: getImageSource(),
      postedDate: formatDate(deal.created_at),
      expiresIn: formatExpiration(deal.end_date),
      views: deal.views,
      userId: deal.user_id || undefined, // Add userId for user profile navigation
      userDisplayName: deal.user_display_name || undefined,
      userProfilePhoto: deal.user_profile_photo || undefined,
    };
  }, []); // Empty dependency array since it doesn't depend on any props/state

  // Memoize the renderDealCard function
  const renderDealCard = useCallback(({ item }: { item: RestaurantDeal }) => (
    <RowCard
      data={convertToRowCardData(item)}
      variant="explore-deal-card"
      onPress={handleDealPress}
    />
  ), [convertToRowCardData, handleDealPress]);

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Title and Navigation */}
      <View style={styles.header}>
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
          <TouchableOpacity 
            style={[styles.heartButton, isRestaurantFavorited && styles.favorited]} 
            onPress={handleRestaurantFavorite} 
            disabled={favoriteLoading}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name={isRestaurantFavorited ? "heart" : "heart-outline"}
              size={19} 
              color={isRestaurantFavorited ? "#FF1E00" : "#000"} 
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
    </SafeAreaView>
  );
};

// ... existing styles remain the same ...
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTop: {
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  directionsButton: {
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  directionsButtonText: {
    color: '#000000',
    fontWeight: '400',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 15,
    textAlign: 'center',
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
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  heartButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favorited: {
    // Don't change background - only the heart icon color changes
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