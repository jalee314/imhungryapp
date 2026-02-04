/**
 * PostsGrid - Profile Feature Component
 * 
 * Grid display of user's posts with loading, error, and empty states.
 */

import React from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, Pressable } from '../../../components/atoms';
import { colors, spacing } from '../../../lib/theme';
import DealCard from '../../../components/DealCard';
import DealCardSkeleton from '../../../components/DealCardSkeleton';

interface PostsGridProps {
  posts: any[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  isViewingOtherUser: boolean;
  onRetry: () => void;
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onPress: (dealId: string) => void;
  onDelete: (dealId: string) => void;
}

export const PostsGrid: React.FC<PostsGridProps> = ({
  posts,
  isLoading,
  isInitialized,
  error,
  isViewingOtherUser,
  onRetry,
  onUpvote,
  onDownvote,
  onPress,
  onDelete,
}) => {
  const gridStyle = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-start' as const,
    paddingTop: spacing.m,
    paddingBottom: spacing['9xl'],
    paddingHorizontal: spacing.md,
    width: '100%' as const,
  };

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <Box style={gridStyle}>
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <View 
            key={item} 
            style={{
              marginBottom: spacing.s,
              marginRight: index % 2 === 0 ? 2 : 0,
              marginLeft: index % 2 === 1 ? 2 : 0,
            }}
          >
            <DealCardSkeleton variant="vertical" />
          </View>
        ))}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box flex={1} center py="7xl">
        <Text size="base" color="textLight" align="center" mb={spacing.xl}>
          {error}
        </Text>
        <Pressable
          onPress={onRetry}
          bg="primary"
          px="3xl"
          py="l"
          rounded="sm"
        >
          <Text weight="semiBold" size="base" color="textInverse">
            Retry
          </Text>
        </Pressable>
      </Box>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <Box flex={1} center py="7xl" px="5xl">
        <MaterialCommunityIcons name="food-off" size={48} color={colors.textMuted} />
        <Text 
          size="lg" 
          weight="semiBold" 
          color="textLight" 
          align="center"
          mt={spacing.xl}
          mb={spacing.m}
        >
          No posts yet
        </Text>
        <Text size="md" color="textMuted" align="center">
          {isViewingOtherUser 
            ? "This user hasn't posted any deals yet." 
            : 'Support the platform by posting food deals you see!'
          }
        </Text>
      </Box>
    );
  }

  // Posts grid
  return (
    <Box style={gridStyle}>
      {posts.map((post, index) => (
        <View 
          key={post.id} 
          style={{
            marginBottom: spacing.s,
            marginRight: index % 2 === 0 ? 2 : 0,
            marginLeft: index % 2 === 1 ? 2 : 0,
          }}
        >
          <DealCard
            deal={post}
            variant="vertical"
            onUpvote={onUpvote}
            onDownvote={onDownvote}
            onPress={onPress}
            showDelete={!isViewingOtherUser}
            onDelete={onDelete}
            hideAuthor={true}
          />
        </View>
      ))}
    </Box>
  );
};

export default PostsGrid;
