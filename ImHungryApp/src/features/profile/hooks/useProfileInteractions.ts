/**
 * @file useProfileInteractions — Optimistic vote, favorite, deal-press and
 * delete-post handlers for the profile posts list.
 */

import { Alert } from 'react-native';

import { useFavorites } from '../../../hooks/useFavorites';
import { calculateUpvoteToggle, calculateDownvoteToggle } from '../../../hooks/useFeedInteractionHandlers';
import { deleteDeal } from '../../../services/dealService';
import { logClick } from '../../../services/interactionService';
import type { UserPost } from '../../../services/userPostsService';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../../../services/voteService';
import type { ProfileInteractionHandlers, ProfileNavigation } from '../types';

// ============================================================================
// Hook
// ============================================================================

export interface UseProfileInteractionsParams {
  userPosts: UserPost[];
  setUserPosts: React.Dispatch<React.SetStateAction<UserPost[]>>;
  setDealCount: React.Dispatch<React.SetStateAction<number>>;
  navigation: ProfileNavigation;
}

export function useProfileInteractions({
  userPosts,
  setUserPosts,
  setDealCount,
  navigation,
}: UseProfileInteractionsParams): ProfileInteractionHandlers {
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  const onUpvote = (dealId: string) => {
    let original: UserPost | undefined;
    setUserPosts((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          original = d;
          const changes = calculateUpvoteToggle(d);
          return { ...d, ...changes };
        }
        return d;
      }),
    );
    toggleUpvote(dealId).catch((err) => {
      console.error('Failed upvote revert', err);
      const originalSnapshot = original;
      if (originalSnapshot) {
        setUserPosts((prev) => prev.map((d) => (d.id === dealId ? originalSnapshot : d)));
      }
    });
  };

  const onDownvote = (dealId: string) => {
    let original: UserPost | undefined;
    setUserPosts((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          original = d;
          const changes = calculateDownvoteToggle(d);
          return { ...d, ...changes };
        }
        return d;
      }),
    );
    toggleDownvote(dealId).catch((err) => {
      console.error('Failed downvote revert', err);
      const originalSnapshot = original;
      if (originalSnapshot) {
        setUserPosts((prev) => prev.map((d) => (d.id === dealId ? originalSnapshot : d)));
      }
    });
  };

  const onFavorite = (dealId: string) => {
    const original = userPosts.find((d) => d.id === dealId);
    if (!original) return;
    const wasFav = original.isFavorited;

    // 1. Optimistic UI update
    setUserPosts((prev) => prev.map((d) => (d.id === dealId ? { ...d, isFavorited: !wasFav } : d)));

    // 2. Notify global store for instant favorites page update
    if (wasFav) {
      markAsUnfavorited(dealId, 'deal');
    } else {
      markAsFavorited(dealId, 'deal', {
        id: original.id,
        title: original.title,
        description: original.details || '',
        imageUrl: typeof original.image === 'object' ? original.image.uri : '',
        restaurantName: original.restaurant,
        restaurantAddress: original.restaurantAddress || '',
        distance: original.milesAway || '',
        userId: original.userId,
        userDisplayName: original.userDisplayName,
        userProfilePhoto: original.userProfilePhoto,
        isAnonymous: original.isAnonymous,
        favoritedAt: new Date().toISOString(),
      });
    }

    // 3. Background database save
    toggleFavorite(dealId, wasFav).catch((err) => {
      console.error('Failed favorite revert', err);
      if (original) setUserPosts((prev) => prev.map((d) => (d.id === dealId ? original : d)));
    });
  };

  const onDealPress = (dealId: string) => {
    const selected = userPosts.find((d) => d.id === dealId);
    if (!selected) return;
    const pos = userPosts.findIndex((d) => d.id === dealId);
    logClick(dealId, 'profile', pos >= 0 ? pos : undefined).catch(() => {});
    navigation.navigate('DealDetail', { deal: selected });
  };

  const onDeletePost = (dealId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteDeal(dealId);
            if (result.success) {
              setUserPosts((prev) => prev.filter((p) => p.id !== dealId));
              setDealCount((prev) => Math.max(0, prev - 1));
              Alert.alert('Success', 'Post deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete post');
            }
          } catch (err) {
            console.error('Error deleting post:', err);
            Alert.alert('Error', 'An unexpected error occurred');
          }
        },
      },
    ]);
  };

  return { onUpvote, onDownvote, onFavorite, onDealPress, onDeletePost };
}
