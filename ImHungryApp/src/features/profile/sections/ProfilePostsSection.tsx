/**
 * @file ProfilePostsSection — Posts grid with loading / error / empty states.
 *
 * Purely presentational.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DealCard from '../../../components/DealCard';
import DealCardSkeleton from '../../../components/DealCardSkeleton';
import {
  STATIC,
  GRAY,
  BRAND,
  SPACING,
  RADIUS,
} from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';

// ============================================================================
// Props
// ============================================================================

export interface ProfilePostsSectionProps {
  userPosts: unknown[];
  postsLoading: boolean;
  postsInitialized: boolean;
  postsError: string | null;
  isViewingOtherUser: boolean;
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onDealPress: (dealId: string) => void;
  onDeletePost: (dealId: string) => void;
  onRetryLoadPosts: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ProfilePostsSection({
  userPosts,
  postsLoading,
  postsInitialized,
  postsError,
  isViewingOtherUser,
  onUpvote,
  onDownvote,
  onDealPress,
  onDeletePost,
  onRetryLoadPosts,
}: ProfilePostsSectionProps) {
  // Loading skeletons
  if (!postsInitialized || postsLoading) {
    return (
      <Box style={s.grid}>
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <Box
            key={item}
            mb="xs"
            style={index % 2 === 0 ? s.leftCard : s.rightCard}
          >
            <DealCardSkeleton variant="vertical" />
          </Box>
        ))}
      </Box>
    );
  }

  // Error state
  if (postsError) {
    return (
      <Box center py={60}>
        <Text size="md" color={GRAY[700]} textAlign="center" mb="lg" style={s.fontInter}>
          {postsError}
        </Text>
        <TouchableOpacity style={s.retryButton} onPress={onRetryLoadPosts}>
          <Text size="md" weight="semibold" color={STATIC.white} style={s.fontInter}>
            Retry
          </Text>
        </TouchableOpacity>
      </Box>
    );
  }

  // Empty state
  if (userPosts.length === 0) {
    return (
      <Box center py={60} px="4xl" w="100%">
        <MaterialCommunityIcons name="food-off" size={48} color={GRAY[500]} />
        <Text size="lg" weight="semibold" color={GRAY[700]} mt="lg" mb="sm" textAlign="center" style={s.fontInter}>
          No posts yet
        </Text>
        <Text size="sm" color={GRAY[500]} textAlign="center" style={s.fontInter}>
          {isViewingOtherUser
            ? "This user hasn't posted any deals yet."
            : 'Support the platform by posting food deals you see!'}
        </Text>
      </Box>
    );
  }

  // Posts grid
  return (
    <Box style={s.grid}>
      {userPosts.map((post, index) => (
        <Box
          key={post.id}
          mb="xs"
          style={index % 2 === 0 ? s.leftCard : s.rightCard}
        >
          <DealCard
            deal={post}
            variant="vertical"
            onUpvote={onUpvote}
            onDownvote={onDownvote}
            onPress={onDealPress}
            showDelete={!isViewingOtherUser}
            onDelete={onDeletePost}
            hideAuthor={true}
          />
        </Box>
      ))}
    </Box>
  );
}

// ============================================================================
// Styles
// ============================================================================

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: SPACING.sm,
    paddingBottom: 100,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%',
  },
  leftCard: { marginRight: 2 },
  rightCard: { marginLeft: 2 },
  retryButton: {
    backgroundColor: BRAND.accent,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  fontInter: { fontFamily: 'Inter' },
});
