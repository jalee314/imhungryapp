/**
 * FeedLoadingState - Loading skeleton for Feed screen
 */

import React from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { Box } from '../../../components/atoms';
import DealCardSkeleton from '../../../components/DealCardSkeleton';
import SkeletonLoader from '../../../components/SkeletonLoader';
import { spacing } from '../../../lib/theme';

export const FeedLoadingState: React.FC = () => {
  const renderFilterSkeleton = () => (
    <Box marginTop="s1" marginBottom="s3">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: spacing.s5, gap: spacing.s1 }}
      >
        {[60, 75, 55, 80, 65, 70].map((width, index) => (
          <SkeletonLoader 
            key={index} 
            width={width} 
            height={34} 
            borderRadius={20} 
            style={{ marginRight: spacing.s1 }} 
          />
        ))}
      </ScrollView>
    </Box>
  );

  const renderItemSeparator = () => <View style={{ width: 0 }} />;

  return (
    <Box flex={1}>
      {renderFilterSkeleton()}
      
      {/* Featured Deals Section Skeleton */}
      <Box 
        flexDirection="row" 
        justifyContent="space-between" 
        alignItems="center"
        paddingTop="s1"
        paddingBottom="s1"
        paddingLeft="s4"
        paddingRight="s3"
      >
        <SkeletonLoader width={140} height={20} borderRadius={4} />
        <SkeletonLoader width={30} height={30} borderRadius={15} />
      </Box>
      
      <FlatList 
        data={[1, 2, 3]} 
        renderItem={() => <DealCardSkeleton variant="horizontal" />} 
        keyExtractor={(item) => item.toString()} 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 10.5, paddingRight: 10 }} 
        ItemSeparatorComponent={renderItemSeparator} 
      />
      
      <Box height={0.5} marginVertical="s2" />
      
      {/* Deals For You Section Skeleton */}
      <Box 
        flexDirection="row" 
        justifyContent="space-between" 
        alignItems="center"
        paddingTop="s1"
        paddingBottom="s1"
        paddingLeft="s4"
        paddingRight="s3"
      >
        <SkeletonLoader width={130} height={20} borderRadius={4} />
      </Box>
      
      <Box
        flexDirection="row"
        flexWrap="wrap"
        paddingLeft="s3"
        paddingRight="s3"
        paddingBottom="s6"
      >
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <Box 
            key={item} 
            marginBottom="s0"
            marginRight={index % 2 === 0 ? 2 : 0}
            marginLeft={index % 2 === 1 ? 2 : 0}
          >
            <DealCardSkeleton variant="vertical" />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
