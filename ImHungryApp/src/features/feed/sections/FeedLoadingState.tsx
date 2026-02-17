/**
 * @file FeedLoadingState — Skeleton placeholder for the Feed while data loads.
 */

import React from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import DealCardSkeleton from '../../../components/DealCardSkeleton';
import SkeletonLoader from '../../../components/SkeletonLoader';
import { Box } from '../../../ui/primitives';
import { SPACING } from '../../../ui/alf';

const renderItemSeparator = () => <View style={{ width: 0 }} />;

export function FeedLoadingState() {
  return (
    <Box flex={1}>
      {/* Filter skeleton */}
      <Box mt="xs" mb="md">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 18.5, gap: SPACING.xs }}
        >
          {[60, 75, 55, 80, 65, 70].map((width, index) => (
            <SkeletonLoader
              key={index}
              width={width}
              height={34}
              borderRadius={20}
              style={{ marginRight: SPACING.xs }}
            />
          ))}
        </ScrollView>
      </Box>

      {/* Featured Deals skeleton */}
      <Box row justify="space-between" align="center" pt="xs" pb="xs" pl="lg" pr={10}>
        <SkeletonLoader width={140} height={20} borderRadius={4} />
        <SkeletonLoader width={30} height={30} borderRadius={15} />
      </Box>
      <FlatList
        data={[1, 2, 3]}
        renderItem={() => <DealCardSkeleton variant="horizontal" />}
        keyExtractor={(item) => item.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 10.5, paddingRight: SPACING.md }}
        ItemSeparatorComponent={renderItemSeparator}
      />

      {/* Separator skeleton */}
      <Box h={0.5} my="sm" />

      {/* Deals For You skeleton */}
      <Box row justify="space-between" align="center" pt="xs" pb="xs" pl="lg" pr={10}>
        <SkeletonLoader width={130} height={20} borderRadius={4} />
      </Box>
      <Box direction="row" wrap="wrap" justify="flex-start" pl={10} pr={10}>
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <View
            key={item}
            style={index % 2 === 0 ? { marginBottom: 0, marginRight: 2 } : { marginTop: 0, marginLeft: 2 }}
          >
            <DealCardSkeleton variant="vertical" />
          </View>
        ))}
      </Box>
    </Box>
  );
}
