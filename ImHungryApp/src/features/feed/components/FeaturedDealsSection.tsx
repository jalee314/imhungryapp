/**
 * FeaturedDealsSection - Horizontal list of featured deals
 */

import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Box, Text } from '../../../components/atoms';
import DealCard from '../../../components/DealCard';
import type { Deal } from '../types';

interface FeaturedDealsSectionProps {
  deals: Deal[];
  onDealPress: (dealId: string) => void;
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onFavorite: (dealId: string) => void;
  onSeeAll: () => void;
}

export const FeaturedDealsSection: React.FC<FeaturedDealsSectionProps> = ({
  deals,
  onDealPress,
  onUpvote,
  onDownvote,
  onFavorite,
  onSeeAll,
}) => {
  if (deals.length === 0) return null;

  const renderDeal = ({ item }: { item: Deal }) => (
    <DealCard 
      deal={item} 
      variant="horizontal" 
      onUpvote={onUpvote} 
      onDownvote={onDownvote} 
      onFavorite={onFavorite} 
      onPress={onDealPress} 
    />
  );

  const renderSeparator = () => <View style={{ width: 0 }} />;

  return (
    <>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingTop="s1"
        paddingBottom="s1"
        paddingLeft="s4"
        paddingRight="s3"
      >
        <Text variant="h3" weight="bold">✨ Featured Deals</Text>
        <TouchableOpacity 
          style={{
            backgroundColor: '#F1F1F1',
            borderRadius: 50,
            width: 30,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }} 
          onPress={onSeeAll}
        >
          <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
        </TouchableOpacity>
      </Box>
      <FlatList
        data={deals}
        renderItem={renderDeal}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 10.5, paddingRight: 10 }}
        ItemSeparatorComponent={renderSeparator}
        extraData={deals.map(d => d.imageVariants?.cloudinary_id).join(',')}
      />
    </>
  );
};
