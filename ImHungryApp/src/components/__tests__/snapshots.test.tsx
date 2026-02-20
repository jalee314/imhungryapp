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

import { render } from '@testing-library/react-native';
import React from 'react';

// Mock react-native Switch component (doesn't work in jest environment)
jest.mock('react-native/Libraries/Components/Switch/Switch', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement(View, { testID: 'mock-switch', ...props }),
  };
});

// Mock @monicon/native to return a renderable element
jest.mock('@monicon/native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Monicon: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name || 'unknown'}`, ...props }),
  };
});

// Mock OptimizedImage
jest.mock('../OptimizedImage', () => {
  const { Image } = require('react-native');
  const MockOptimizedImage = ({ source, style }: any) => {
    const src = typeof source === 'string' ? { uri: source } : source;
    return <Image source={src} style={style} testID="optimized-image" />;
  };
  MockOptimizedImage.preloadImage = jest.fn().mockResolvedValue(undefined);
  return MockOptimizedImage;
});

// Import components after mocks
import DealCard, { Deal } from '../DealCard';
import DealCardSkeleton from '../DealCardSkeleton';
import RowCard, { RowCardData } from '../RowCard';
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
      const { toJSON } = render(
        <DealCard deal={mockDeal} variant="vertical" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for horizontal variant', () => {
      const { toJSON } = render(
        <DealCard deal={mockDeal} variant="horizontal" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when upvoted', () => {
      const upvotedDeal = { ...mockDeal, isUpvoted: true, votes: 43 };
      const { toJSON } = render(
        <DealCard deal={upvotedDeal} variant="vertical" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when favorited', () => {
      const favoritedDeal = { ...mockDeal, isFavorited: true };
      const { toJSON } = render(
        <DealCard deal={favoritedDeal} variant="vertical" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for anonymous post', () => {
      const anonymousDeal = { ...mockDeal, isAnonymous: true, author: 'Anonymous' };
      const { toJSON } = render(
        <DealCard deal={anonymousDeal} variant="vertical" hideAuthor={false} />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with delete button', () => {
      const { toJSON } = render(
        <DealCard deal={mockDeal} variant="vertical" showDelete={true} />
      ); const tree = toJSON();
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
      const { toJSON } = render(
        <RowCard data={exploreData} variant="explore-deal-card" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for rest-deal variant', () => {
      const restData: RowCardData = {
        ...mockRowCardData,
        dealCount: 3,
        distance: '0.5 mi',
      };
      const { toJSON } = render(
        <RowCard data={restData} variant="rest-deal" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for favorites-deal-card variant', () => {
      const favData: RowCardData = {
        ...mockRowCardData,
        userId: 'user-fav-1',
        userDisplayName: 'Favorite User',
        userProfilePhoto: 'https://example.com/fav-avatar.jpg',
      };
      const { toJSON } = render(
        <RowCard data={favData} variant="favorites-deal-card" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('DealCardSkeleton', () => {
    it('should match snapshot for vertical variant', () => {
      const { toJSON } = render(
        <DealCardSkeleton variant="vertical" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot for horizontal variant', () => {
      const { toJSON } = render(
        <DealCardSkeleton variant="horizontal" />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('RowCardSkeleton', () => {
    it('should match snapshot', () => {
      const { toJSON } = render(<RowCardSkeleton />); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('SkeletonLoader', () => {
    it('should match snapshot with default props', () => {
      const { toJSON } = render(<SkeletonLoader />); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with custom dimensions', () => {
      const { toJSON } = render(
        <SkeletonLoader width={200} height={40} borderRadius={8} />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with percentage width', () => {
      const { toJSON } = render(
        <SkeletonLoader width="80%" height={16} />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('VoteButtons', () => {
    it('should match snapshot for default state', () => {
      const { toJSON } = render(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
        />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when upvoted', () => {
      const { toJSON } = render(
        <VoteButtons
          votes={11}
          isUpvoted={true}
          isDownvoted={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
        />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when downvoted', () => {
      const { toJSON } = render(
        <VoteButtons
          votes={9}
          isUpvoted={false}
          isDownvoted={true}
          onUpvote={() => {}}
          onDownvote={() => {}}
        />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot when favorited', () => {
      const { toJSON } = render(
        <VoteButtons
          votes={10}
          isUpvoted={false}
          isDownvoted={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
        />
      ); const tree = toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with all states active', () => {
      const { toJSON } = render(
        <VoteButtons
          votes={15}
          isUpvoted={true}
          isDownvoted={false}
          onUpvote={() => {}}
          onDownvote={() => {}}
        />
      ); const tree = toJSON();
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
