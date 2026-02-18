/**
 * @file FeaturedDealsSection — Horizontal carousel of featured deals
 * with a section header and "see all" arrow.
 *
 * Purely presentational. State & callbacks come from useFeed.
 */

import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Deal } from '../../../types/deal';
import DealCard from '../../../components/DealCard';
import { Box, Text } from '../../../ui/primitives';
import {
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
} from '../../../ui/alf';
import type { FeedInteractions } from '../types';

export interface FeaturedDealsSectionProps {
  deals: Deal[];
  interactions: FeedInteractions;
}

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

const renderItemSeparator = () => <View style={{ width: 0 }} />;

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
          style={{ fontFamily: 'Inter' }}
        >
          ✨ Featured Deals
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: GRAY[100],
            borderRadius: RADIUS.full,
            width: 30,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }}
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
        contentContainerStyle={{ paddingLeft: 10.5, paddingRight: SPACING.md }}
        ItemSeparatorComponent={renderItemSeparator}
        extraData={deals.map(d => d.imageVariants?.cloudinary_id).join(',')}
      />
    </>
  );
}
