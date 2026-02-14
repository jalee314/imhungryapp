/**
 * UI Component Snapshot Tests (PR-017 / RF-017)
 *
 * Establishes visual baseline for critical UI components before styling migration.
 * Covers: DealCard variants, RowCard variants, Skeleton loaders, VoteButtons
 *
 * Snapshot Categories:
 * 1. DealCard: horizontal and vertical variants
 * 2. RowCard: explore-deal-card, rest-deal, favorites-deal-card variants
 * 3. Skeletons: DealCardSkeleton, RowCardSkeleton, SkeletonLoader
 * 4. VoteButtons: various states (upvoted, downvoted, favorited)
 */

import React from 'react';
import { create } from 'react-test-renderer';

// Mock @monicon/native
jest.mock('@monicon/native', () => ({
  Monicon: () => null,
}));

// Mock OptimizedImage
jest.mock('../OptimizedImage', () => {
  const { View, Image } = require('react-native');
  const MockOptimizedImage = ({ source, style }: any) => {
    const src = typeof source === 'string' ? { uri: source } : source;
    return <Image source={src} style={style} testID="optimized-image" />;
  };
  MockOptimizedImage.preloadImage = jest.fn().mockResolvedValue(undefined);
  return MockOptimizedImage;
});

// Import components after mocks
import DealCard, { Deal } from '../DealCard';
import RowCard, { RowCardData } from '../RowCard';
import DealCardSkeleton from '../DealCardSkeleton';
import RowCardSkeleton from '../RowCardSkeleton';
import SkeletonLoader from '../SkeletonLoader';
import VoteButtons from '../VoteButtons';

// Mock deal data
const mockDeal: Deal = {
  id: 'deal-snapshot-1',
  title: 'Snapshot Test Deal',
  restaurant: 'Snapshot Restaurant',
  details: '50% off all items - test snapshot',
  image: { uri: 'https://example.com/deal-image.jpg' },
  votes: 42,
  isUpvoted: false,
  isDownvoted: false,
  isFavorited: false,
  cuisine: 'Italian',
  cuisineId: 'cuisine-italian',
  timeAgo: '2h ago',
  author: 'SnapshotUser',
  milesAway: '1.5 mi',
  userId: 'user-snapshot-1',
  userDisplayName: 'Snapshot User',
  userProfilePhoto: 'https://example.com/avatar.jpg',
  restaurantAddress: '123 Snapshot St',
  isAnonymous: false,
  expirationDate: '2026-12-31',
};

const mockRowCardData: RowCardData = {
  id: 'row-snapshot-1',
  title: 'Snapshot Row Card',
  subtitle: 'Test subtitle for snapshot',
  image: { uri: 'https://example.com/row-image.jpg' },
  distance: '2.0 mi',
  dealCount: 5,
  views: 100,
  postedDate: 'Today',
  expiresIn: '3 days',
};

describe('UI Component Snapshots', () => {
  describe('DealCard', () => {
    it('should match snapshot for vertical variant', () => {
      const tree = create(
        <DealCard deal={mockDeal} variant="vertical" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for horizontal variant', () => {
      const tree = create(
        <DealCard deal={mockDeal} variant="horizontal" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when upvoted', () => {
      const upvotedDeal = { ...mockDeal, isUpvoted: true, votes: 43 };
      const tree = create(
        <DealCard deal={upvotedDeal} variant="vertical" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when favorited', () => {
      const favoritedDeal = { ...mockDeal, isFavorited: true };
      const tree = create(
        <DealCard deal={favoritedDeal} variant="vertical" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for anonymous post', () => {
      const anonymousDeal = { ...mockDeal, isAnonymous: true, author: 'Anonymous' };
      const tree = create(
        <DealCard deal={anonymousDeal} variant="vertical" hideAuthor={false} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with delete button', () => {
      const tree = create(
        <DealCard deal={mockDeal} variant="vertical" showDelete={true} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('RowCard', () => {
    it('should match snapshot for explore-deal-card variant', () => {
      const exploreData: RowCardData = {
        ...mockRowCardData,
        views: 150,
        postedDate: 'Yesterday',
        expiresIn: '2 days',
      };
      const tree = create(
        <RowCard data={exploreData} variant="explore-deal-card" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for rest-deal variant', () => {
      const restData: RowCardData = {
        ...mockRowCardData,
        dealCount: 3,
        distance: '0.5 mi',
      };
      const tree = create(
        <RowCard data={restData} variant="rest-deal" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for favorites-deal-card variant', () => {
      const favData: RowCardData = {
        ...mockRowCardData,
        userId: 'user-fav-1',
        userDisplayName: 'Favorite User',
        userProfilePhoto: 'https://example.com/fav-avatar.jpg',
      };
      const tree = create(
        <RowCard data={favData} variant="favorites-deal-card" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('DealCardSkeleton', () => {
    it('should match snapshot for vertical variant', () => {
      const tree = create(
        <DealCardSkeleton variant="vertical" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for horizontal variant', () => {
      const tree = create(
        <DealCardSkeleton variant="horizontal" />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('RowCardSkeleton', () => {
    it('should match snapshot', () => {
      const tree = create(<RowCardSkeleton />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('SkeletonLoader', () => {
    it('should match snapshot with default props', () => {
      const tree = create(<SkeletonLoader />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with custom dimensions', () => {
      const tree = create(
        <SkeletonLoader width={200} height={40} borderRadius={8} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with percentage width', () => {
      const tree = create(
        <SkeletonLoader width="80%" height={16} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('VoteButtons', () => {
    it('should match snapshot for default state', () => {
      const tree = create(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          isFavorited={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onFavorite={() => {}}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when upvoted', () => {
      const tree = create(
        <VoteButtons
          votes={11}
          isUpvoted={true}
          isDownvoted={false}
          isFavorited={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onFavorite={() => {}}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when downvoted', () => {
      const tree = create(
        <VoteButtons
          votes={9}
          isUpvoted={false}
          isDownvoted={true}
          isFavorited={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onFavorite={() => {}}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when favorited', () => {
      const tree = create(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          isFavorited={true}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onFavorite={() => {}}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with all states active', () => {
      const tree = create(
        <VoteButtons
          votes={15}
          isUpvoted={true}
          isDownvoted={false}
          isFavorited={true}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onFavorite={() => {}}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});

describe('Mock Data Shape Snapshots', () => {
  it('should snapshot Deal interface shape', () => {
    expect(mockDeal).toMatchSnapshot();
  });

  it('should snapshot RowCardData interface shape', () => {
    expect(mockRowCardData).toMatchSnapshot();
  });
});
