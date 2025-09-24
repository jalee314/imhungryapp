import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import DealCard, { Deal } from '../../components/DealCard';
import CuisineFilter from '../../components/CuisineFilter';

const Feed: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');

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

  const communityDeals: Deal[] = [
    {
      id: '1',
      title: 'Buy 1 Get 1 FREE Sea Salt Coffee per Member',
      restaurant: '85 Degrees Bakery',
      details: '3mi away • 3h ago • By Kevin Hu',
      image: 'https://via.placeholder.com/204x144/f0f0f0/999999?text=Coffee+Deal',
      votes: 67,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '3h ago',
      author: 'Kevin Hu'
    },
    {
      id: '2',
      title: '$6 plate when Dodgers win @ home',
      restaurant: 'Panda Express',
      details: '3mi away • 3h ago • Kevin Hu',
      image: 'https://via.placeholder.com/204x144/ff0000/ffffff?text=Panda+Deal',
      votes: 67,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '3h ago',
      author: 'Kevin Hu'
    },
    {
      id: '3',
      title: 'Free Appetizer with Entree Purchase',
      restaurant: 'Local Bistro',
      details: '2mi away • 5h ago • By Sarah M',
      image: 'https://via.placeholder.com/204x144/00ff00/ffffff?text=Free+App',
      votes: 45,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '5h ago',
      author: 'Sarah M'
    }
  ];

  const dealsForYou: Deal[] = [
    {
      id: '4',
      title: '$1 Wings on Wednesdays',
      restaurant: 'CyberWings',
      details: 'American • 3h ago • 3mi away',
      image: 'https://via.placeholder.com/169x144/ffa500/ffffff?text=Wings',
      votes: 67,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '3h ago'
    },
    {
      id: '5',
      title: 'Buy 1 Get 1 FREE Sea Salt Coffee per Member',
      restaurant: '85 Degrees Bakery',
      details: 'Korean • 3h ago • 3mi away',
      image: 'https://via.placeholder.com/169x144/0066ff/ffffff?text=Coffee',
      votes: 67,
      isUpvoted: false,
      isDownvoted: true,
      isFavorited: false,
      timeAgo: '3h ago'
    },
    {
      id: '6',
      title: '$2 Chicken Tenders on Thursdays',
      restaurant: 'Chicken Spot',
      details: 'American • 2h ago • 2mi away',
      image: 'https://via.placeholder.com/169x144/ff6600/ffffff?text=Chicken',
      votes: 89,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '2h ago'
    },
    {
      id: '7',
      title: '$6 plate when Dodgers win @ home',
      restaurant: 'Stadium Food',
      details: 'American • 1h ago • 4mi away',
      image: 'https://via.placeholder.com/169x144/cc00ff/ffffff?text=Stadium',
      votes: 123,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '1h ago'
    }
  ];

  const handleCuisineFilterSelect = (filter: string) => {
    setSelectedCuisine(filter);
    console.log('Selected cuisine:', filter);
    // Add logic to filter deals based on cuisine
  };

  const handleUpvote = (dealId: string) => {
    console.log('Upvote deal:', dealId);
    // Implement upvote logic here
  };

  const handleDownvote = (dealId: string) => {
    console.log('Downvote deal:', dealId);
    // Implement downvote logic here
  };

  const handleFavorite = (dealId: string) => {
    console.log('Favorite deal:', dealId);
    // Implement favorite logic here
  };

  const handleDealPress = (dealId: string) => {
    const selectedDeal = [...communityDeals, ...dealsForYou].find(deal => deal.id === dealId);
    if (selectedDeal) {
      navigation.navigate('DealDetail' as never, { deal: selectedDeal } as never);
    }
  };

  const renderCommunityDeal = ({ item }: { item: Deal }) => (
    <DealCard
      deal={item}
      variant="community"
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
      onFavorite={handleFavorite}
      onPress={handleDealPress}
    />
  );

  const renderDealForYou = ({ item }: { item: Deal }) => (
    <DealCard
      deal={item}
      variant="standard"
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
      onFavorite={handleFavorite}
      onPress={handleDealPress}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
      <Header />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cuisine Filters */}
        <CuisineFilter
          filters={cuisineFilters}
          selectedFilter={selectedCuisine}
          onFilterSelect={handleCuisineFilterSelect}
        />

        {/* Community Uploaded Section */}
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

        {/* Section Separator */}
        <View style={styles.sectionSeparator} />

        {/* Deals For You Section */}
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
                variant="standard"
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                onFavorite={handleFavorite}
                onPress={handleDealPress}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavigation activeTab="feed" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4F4',
    paddingTop: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    justifyContent: 'center',
    gap: 4,
  },
  leftCard: {
    marginRight: 2,
  },
  rightCard: {
    marginLeft: 2,
  },
});

export default Feed;
