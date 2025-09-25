import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
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

  // Updated sample data with local images only
  // Updated sample data with more deals and variety
  const communityDeals: Deal[] = [
    {
      id: '1',
      title: 'Buy 1 Get 1 FREE Sea Salt Coffee per Member',
      restaurant: '85 Degrees Bakery',
      details: 'Valid for members only',
      image: require('../../../img/albert.webp'),
      votes: 67,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '3h ago',
      author: 'Kevin Hu',
      milesAway: '3mi'
    },
    {
      id: '2',
      title: '$6 plate when Dodgers win @ home',
      restaurant: 'Panda Express',
      details: 'When Dodgers win at home games',
      image: require('../../../img/monkey.jpg'),
      votes: 67,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '3h ago',
      author: 'Kevin Hu',
      milesAway: '3mi'
    },
    {
      id: '3',
      title: 'Free Appetizer with Entree Purchase',
      restaurant: 'Local Bistro',
      details: 'Must purchase entree',
      image: require('../../../img/albert.webp'),
      votes: 45,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '5h ago',
      author: 'Sarah M',
      milesAway: '2mi'
    },
    {
      id: '4',
      title: '50% Off All Boba Drinks Every Tuesday',
      restaurant: 'Gong Cha',
      details: 'Tuesday special only',
      image: require('../../../img/monkey.jpg'),
      votes: 89,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '1h ago',
      author: 'Alex T',
      milesAway: '1mi'
    },
    {
      id: '5',
      title: 'Happy Hour: $3 Tacos 4-6pm',
      restaurant: 'Taco Bell',
      details: 'Weekdays only',
      image: require('../../../img/albert.webp'),
      votes: 112,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '30min ago',
      author: 'Maria L',
      milesAway: '4mi'
    }
  ];
  
  const dealsForYou: Deal[] = [
    {
      id: '6',
      title: '$1 Wings on Wednesdays',
      restaurant: 'CyberWings',
      details: 'Wednesdays only',
      image: require('../../../img/monkey.jpg'),
      votes: 67,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '3h ago',
      author: 'Kevin Hu',
      milesAway: '3mi'
    },
    {
      id: '7',
      title: 'Buy 1 Get 1 FREE Sea Salt Coffee per Member',
      restaurant: '85 Degrees Bakery',
      details: 'Members only',
      image: require('../../../img/albert.webp'),
      votes: 67,
      isUpvoted: false,
      isDownvoted: true,
      isFavorited: false,
      timeAgo: '3h ago',
      author: 'Sarah M',
      milesAway: '3mi'
    },
    {
      id: '8',
      title: '$2 Chicken Tenders on Thursdays',
      restaurant: 'Chicken Spot',
      details: 'Thursday special',
      image: require('../../../img/monkey.jpg'),
      votes: 89,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '2h ago',
      author: 'Kevin Hu',
      milesAway: '2mi'
    },
    {
      id: '9',
      title: '$6 plate when Dodgers win @ home',
      restaurant: 'Stadium Food',
      details: 'Game day special',
      image: require('../../../img/albert.webp'),
      votes: 123,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '1h ago',
      author: 'Sarah M',
      milesAway: '4mi'
    },
    {
      id: '10',
      title: 'Free Donut with Any Coffee Purchase',
      restaurant: 'Dunkin Donuts',
      details: 'Valid all day',
      image: require('../../../img/monkey.jpg'),
      votes: 156,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '45min ago',
      author: 'Mike R',
      milesAway: '1mi'
    },
    {
      id: '11',
      title: '25% Off Entire Menu After 9pm',
      restaurant: 'In-N-Out Burger',
      details: 'Late night special',
      image: require('../../../img/albert.webp'),
      votes: 201,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '2h ago',
      author: 'Jessica K',
      milesAway: '5mi'
    },
    {
      id: '12',
      title: 'Buy 2 Get 1 Free Pizza Slices',
      restaurant: 'Pizza Hut',
      details: 'Lunch hours 11am-3pm',
      image: require('../../../img/monkey.jpg'),
      votes: 78,
      isUpvoted: true,
      isDownvoted: false,
      isFavorited: false,
      timeAgo: '4h ago',
      author: 'Tom B',
      milesAway: '3mi'
    },
    {
      id: '13',
      title: 'Student Discount: 15% Off with ID',
      restaurant: 'Chipotle Mexican Grill',
      details: 'Valid student ID required',
      image: require('../../../img/albert.webp'),
      votes: 93,
      isUpvoted: false,
      isDownvoted: false,
      isFavorited: true,
      timeAgo: '6h ago',
      author: 'Amy S',
      milesAway: '2mi'
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
    backgroundColor: '#FFFFFF', // CHANGED: Pure white instead of eggshell
    paddingTop: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF', // CHANGED: Pure white instead of eggshell
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
},
leftCard: {
  width: '48%', // Takes up 48% of width, leaving space for gap
  marginBottom: 8,
},
rightCard: {
  width: '48%', // Takes up 48% of width, leaving space for gap  
  marginBottom: 8,
},
  // Community variant styles
  communityImage: {
    width: 204,
    height: 144,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#757575',
    marginBottom: 8,
  },
  communityTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    width: 204,
    marginBottom: 4, // Reduced margin
  },
  communityRestaurant: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    width: 204,
    marginBottom: 2,
    textAlign: 'left',
  },
  communityLocationAuthor: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#666666',
    width: 204,
    marginBottom: 8,
    textAlign: 'left',
  },
  
  // Standard variant styles
  standardTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'left',
    width: 169,
    marginBottom: 8,
  },
  standardImage: {
    width: 169,
    height: 144,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#757575',
    marginBottom: 8,
  },
  standardRestaurant: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    width: 169,
    marginBottom: 2,
    textAlign: 'left',
  },
  standardLocationAuthor: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#666666',
    width: 169,
    marginBottom: 8,
    textAlign: 'left',
  },
});

export default Feed;
