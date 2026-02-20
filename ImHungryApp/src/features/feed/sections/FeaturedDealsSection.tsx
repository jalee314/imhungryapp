/**
 * @file FeaturedDealsSection — Horizontal carousel of featured deals
 * with a section header and "see all" arrow.
 *
 * Purely presentational. State & callbacks come from useFeed.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';

import DealCard from '../../../components/DealCard';
import type { Deal } from '../../../types/deal';
import {
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { FeedInteractions } from '../types';

export interface FeaturedDealsSectionProps {
  deals: Deal[];
  interactions: FeedInteractions;
}

const featuredDealsItemSeparatorStyle = { width: 0 };
const featuredDealsTitleStyle = { fontFamily: 'Inter' };
const featuredDealsArrowStyle = {
  backgroundColor: GRAY[100],
  borderRadius: RADIUS.full,
  width: 30,
  height: 30,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};
const featuredDealsContentStyle = { paddingLeft: 10.5, paddingRight: SPACING.md };

const renderCommunityDeal = (
  { item }: { item: Deal },
  interactions: FeedInteractions,
) => (
  <DealCard
    deal={item}
    variant="horizontal"
    onUpvote={interactions.handleUpvote}
    onDownvote={interactions.handleDownvote}
    onFavorite={interactions.handleFavorite}
    onPress={interactions.handleDealPress}
  />
);

const renderItemSeparator = () => <View style={featuredDealsItemSeparatorStyle} />;

export function FeaturedDealsSection({ deals, interactions }: FeaturedDealsSectionProps) {
  const navigation = useNavigation();

  if (deals.length === 0) return null;

  return (
    <>
      <Box
        row
        justify="space-between"
        align="center"
        pt="xs"
        pb="xs"
        pl="lg"
        pr={10}
      >
        <Text
          size={17}
          weight="bold"
          color={STATIC.black}
          style={featuredDealsTitleStyle}
        >
          ✨ Featured Deals
        </Text>
        <TouchableOpacity
          style={featuredDealsArrowStyle}
          onPress={() => navigation.navigate('CommunityUploaded' as never)}
        >
          <MaterialCommunityIcons name="arrow-right" size={20} color="#404040" />
        </TouchableOpacity>
      </Box>

      <FlatList
        data={deals}
        renderItem={(info) => renderCommunityDeal(info, interactions)}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={featuredDealsContentStyle}
        ItemSeparatorComponent={renderItemSeparator}
        extraData={deals.map(d => d.imageVariants?.cloudinary_id).join(',')}
      />
    </>
  );
}
