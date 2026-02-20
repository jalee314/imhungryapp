import { Ionicons , MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';

import { supabase } from '../../../lib/supabase';
import RowCard, { RowCardData } from '../../components/RowCard';
import { useFavorites } from '../../hooks/useFavorites';
import { logClick } from '../../services/interactionService';
import { isRestaurantFavorited as checkRestaurantFavorited, toggleRestaurantFavorite } from '../../services/restaurantFavoriteService';
import type { DiscoverRestaurant } from '../../types/discover';
import { BRAND, STATIC, SEMANTIC } from '../../ui/alf';
import { logger } from '../../utils/logger';

import {
  formatRestaurantDistance,
  toDealForDetail,
  toRowCardData,
} from './RestaurantDetailScreen.helpers';
import { styles } from './RestaurantDetailScreen.styles';

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
  const { markAsUnfavorited, markAsFavorited } = useFavorites();
  const [deals, setDeals] = useState<RestaurantDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuisineName, setCuisineName] = useState<string>('');
  const [isRestaurantFavorited, setIsRestaurantFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  useEffect(() => {
    logger.info('🔄 useEffect triggered for restaurant:', restaurant.restaurant_id);
    logger.info('🔄 Restaurant object:', { id: restaurant.restaurant_id, name: restaurant.name });
    loadRestaurantDeals();
    loadRestaurantCuisine();
    checkRestaurantFavoriteStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.restaurant_id]); // Add dependency
  // Debug deals state changes
  useEffect(() => {
    logger.info('🔍 Deals state changed:', { length: deals.length, deals: deals.map(d => ({ id: d.deal_id, title: d.title })) });
  }, [deals]);
  const loadRestaurantDeals = async () => {
    logger.info('🔄 loadRestaurantDeals called for restaurant:', restaurant.restaurant_id);
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
            deal_images (
              image_metadata_id,
              display_order,
              is_thumbnail,
              image_metadata:image_metadata_id (
                variants
              )
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
        logger.error('Error fetching restaurant deals:', error);
        setError('Failed to load deals');
        return;
      }
      // Transform and process deals
      const processedDeals = await Promise.all(
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
          // Prioritize thumbnail from deal_images, fallback to deal_template.image_metadata
          const dealImages = template.deal_images || [];
          const thumbnailImage = dealImages.find((img) => img.is_thumbnail && img.image_metadata?.variants);
          const firstDealImage = !thumbnailImage ? dealImages.find((img) => img.image_metadata?.variants) : null;
          let imageMetadata;
          if (thumbnailImage?.image_metadata) {
            imageMetadata = thumbnailImage.image_metadata;
          } else if (firstDealImage?.image_metadata) {
            imageMetadata = firstDealImage.image_metadata;
          } else {
            imageMetadata = Array.isArray(template.image_metadata) ? template.image_metadata[0] : template.image_metadata;
          }
          logger.info('🔍 Processing deal:', template.title, {
            has_image_url: !!template.image_url,
            has_image_metadata: !!imageMetadata,
            image_metadata_variants: (imageMetadata)?.variants,
            image_url: template.image_url,
            deal_images_count: dealImages.length
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
      logger.info('🔍 Loaded deals:', processedDeals.map(d => ({ id: d.deal_id, title: d.title })));
      logger.info('🔍 Setting deals state with length:', processedDeals.length);
      setDeals(processedDeals as RestaurantDeal[]);
      logger.info('🔍 Deals state set successfully');
    } catch (err) {
      logger.error('Error loading restaurant deals:', err);
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
      logger.error('Error loading restaurant cuisine:', err);
    }
  };
  const checkRestaurantFavoriteStatus = async () => {
    try {
      const favorited = await checkRestaurantFavorited(restaurant.restaurant_id);
      setIsRestaurantFavorited(favorited);
    } catch (err) {
      logger.error('Error checking restaurant favorite status:', err);
    }
  };
  const handleRestaurantFavorite = async () => {
    try {
      setFavoriteLoading(true);
      // Notify global store for instant favorites page update
      if (isRestaurantFavorited) {
        markAsUnfavorited(restaurant.restaurant_id, 'restaurant');
      } else {
        markAsFavorited(restaurant.restaurant_id, 'restaurant');
      }
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
      logger.error('Error toggling restaurant favorite:', err);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDealPress = async (dealId: string) => {
    try {
      logger.info('🔍 handleDealPress called with dealId:', dealId);
      logger.info('🔍 Available deals count:', deals.length);
      logger.info('🔍 Available deal IDs:', deals.map(d => d.deal_id));
      // Find the deal data
      const dealData = deals.find(deal => deal.deal_id === dealId);
      if (!dealData) {
        logger.error('Deal not found:', dealId);
        return;
      }
      const dealForDetail = toDealForDetail(dealData, restaurant, cuisineName);
      // Log the click interaction
      logClick(dealId).catch(err => {
        logger.error('Failed to log click:', err);
      });
      // Navigate to deal detail screen
      (navigation).navigate('DealDetail', { deal: dealForDetail });
    } catch (error) {
      logger.error('Error handling deal press:', error);
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
      logger.error('Error opening directions:', error);
      Alert.alert('Error', 'Unable to open directions');
    }
  };
  const convertToRowCardData = useCallback((deal: RestaurantDeal): RowCardData => (
    toRowCardData(deal)
  ), []);
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
      <ActivityIndicator size="large" color={BRAND.primary} />
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
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />
      {/* Header with Title and Navigation */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={STATIC.black} />
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
              color={isRestaurantFavorited ? SEMANTIC.error : STATIC.black}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.restaurantDetailsContainer}>
          {cuisineName && (
            <Text style={styles.restaurantDetails}>
              <Text style={styles.cuisineText}>🍽 {cuisineName}</Text>
            </Text>
          )}
          <Text style={styles.restaurantDetails}>
            <Text style={styles.distanceText}>📍 {formatRestaurantDistance(restaurant.distance_miles)}mi away </Text>
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
export default RestaurantDetailScreen;
