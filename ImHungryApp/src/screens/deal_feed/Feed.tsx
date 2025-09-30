import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import DealCard, { Deal } from '../../components/DealCard';
import CuisineFilter from '../../components/CuisineFilter';
import { feedService } from '../../services/feedService';
import { fetchRankedDeals, transformDealForUI } from '../../services/dealService';

const Feed: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cuisineFilters = [
    '🍕 Pizza',
    '🍔 Burgers', 
    '🌮 Mexican',
    '🍣 Japanese',
    '🍝 Italian',
    '🥗 Asian',
    '🍖 BBQ',
    '🥪 Sandwiches',
    '🍜 Vietnamese',
    '🥙 Mediterranean'
  ];


  // Fetch deals from database
  const loadDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dbDeals = await fetchRankedDeals();
      const transformedDeals = dbDeals.map(transformDealForUI);
      
      setDeals(transformedDeals);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  // Filter deals based on selected cuisine
  const filteredDeals = deals.filter(deal => {
    if (selectedCuisine === 'All') return true;
    return deal.cuisine?.toLowerCase().includes(selectedCuisine.toLowerCase()) || false;
  });

  // Split deals into community and "for you" sections - but show both simultaneously
  const communityDeals = filteredDeals.slice(0, 5); // First 5 deals for community section
  const dealsForYou = filteredDeals; // ALL deals for "for you" section (not just the rest)

  const handleCuisineFilterSelect = (filter: string) => {
    setSelectedCuisine(filter);
  };

  const handleUpvote = (dealId: string) => {
    // TODO: Implement upvote functionality
  };

  const handleDownvote = (dealId: string) => {
    // TODO: Implement downvote functionality
  };

  const handleFavorite = (dealId: string) => {
    // TODO: Implement favorite functionality
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  };

  const renderCommunityDeal = ({ item }: { item: Deal }) => (
  <DealCard
    deal={item}
    variant="horizontal"
    onUpvote={handleUpvote}
    onDownvote={handleDownvote}
    onFavorite={handleFavorite}
    onPress={handleDealPress}
  />
);

  const renderDealForYou = ({ item }: { item: Deal }) => (
    <DealCard
      deal={item}
      variant="vertical"
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
      onFavorite={handleFavorite}
      onPress={handleDealPress}
    />
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFA05C" />
      <Text style={styles.loadingText}>Loading deals...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadDeals}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No deals available</Text>
      <Text style={styles.emptySubtext}>Check back later for new deals!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Custom Header matching Figma design */}
      <View style={styles.header}>
        <View style={styles.logoLocation}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ImHungri</Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#000000" />
            <Text style={styles.locationText}>Fullerton, CA</Text>
            <Ionicons name="chevron-down" size={12} color="#000000" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cuisine Filters */}
        <CuisineFilter
          filters={cuisineFilters}
          selectedFilter={selectedCuisine}
          onFilterSelect={handleCuisineFilterSelect}
        />
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : deals.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Community Uploaded Section - Show first 5 deals horizontally */}
            {communityDeals.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>👥 Community Uploaded</Text>
                  <TouchableOpacity style={styles.seeAllButton}>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={communityDeals}
                  renderItem={renderCommunityDeal}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.communityList}
                />
              </>
            )}

            {/* Section Separator */}
            {communityDeals.length > 0 && dealsForYou.length > 0 && (
              <View style={styles.sectionSeparator} />
            )}

            {/* Deals For You Section - Show ALL deals in grid */}
            {dealsForYou.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>💰️ Deals For You</Text>
                </View>

                <View style={styles.dealsGrid}>
                  {dealsForYou.map((deal, index) => (
                    <View key={deal.id} style={[
                      index % 2 === 0 ? styles.leftCard : styles.rightCard
                    ]}>
                      <DealCard
                        deal={deal}
                        variant="vertical"
                        onUpvote={handleUpvote}
                        onDownvote={handleDownvote}
                        onFavorite={handleFavorite}
                        onPress={handleDealPress}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <BottomNavigation activeTab="feed" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 44, // Status bar height
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#BCBCBC',
  },
  logoLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  logoContainer: {
    height: 31,
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'MuseoModerno-Bold',
    fontWeight: '700',
    fontSize: 24,
    color: '#FF8C4C',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
  },
  seeAllButton: {
    backgroundColor: '#F1F1F1',
    borderWidth: 0.5,
    borderColor: '#AAAAAA',
    borderRadius: 50,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityList: {
    paddingBottom: 4,
  },
  sectionSeparator: {
    height: 0.5,
    backgroundColor: '#AAAAAA',
    marginVertical: 8,
    width: '100%',
  },

  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 100, // Space for bottom navigation
  },
  leftCard: {
    width: '48%',
    marginBottom: 8,
  },
  rightCard: {
    width: '48%',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
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
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

export default Feed;
