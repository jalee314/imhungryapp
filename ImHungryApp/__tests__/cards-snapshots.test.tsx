/**
 * Card Components Snapshot Tests
 *
 * These tests create snapshots of the rendered card components to ensure
 * visual consistency after refactoring. Any changes to the component
 * structure will be caught by these snapshot tests.
 */

import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';

// Import specialized card components
import { Default as DealCardDefault, Horizontal as DealCardHorizontal, Deal } from '../src/components/cards/DealCard';
import { ExploreDeal, RestaurantDeal, FavoritesDeal, RowCardData } from '../src/components/cards/RowCard';
import { Default as SquareCardDefault, SquareCardData } from '../src/components/cards/SquareCard';

// ==========================================
// Mock Data
// ==========================================

const mockDeal: Deal = {
  id: 'deal-1',
  title: 'Buy One Get One Free Pizza',
  restaurant: 'Pizza Palace',
  details: 'Valid on all large pizzas',
  image: 'https://example.com/pizza.jpg',
  votes: 42,
  isUpvoted: false,
  isDownvoted: false,
  isFavorited: false,
  cuisine: 'Italian',
  timeAgo: '2h ago',
  milesAway: '1.5mi',
  author: 'FoodLover123',
};

const mockUpvotedDeal: Deal = {
  ...mockDeal,
  id: 'deal-2',
  isUpvoted: true,
  votes: 100,
};

const mockFavoritedDeal: Deal = {
  ...mockDeal,
  id: 'deal-3',
  isFavorited: true,
};

const mockRowCardData: RowCardData = {
  id: 'row-1',
  title: 'Taco Tuesday Special',
  subtitle: '$2 Tacos all day',
  image: 'https://example.com/tacos.jpg',
  distance: '0.8mi',
  dealCount: 5,
  views: 150,
  postedDate: '3d ago',
  expiresIn: '2d left',
};

const mockRowCardDataWithUser: RowCardData = {
  ...mockRowCardData,
  id: 'row-2',
  userId: 'user-123',
  userDisplayName: 'FoodFan',
  userProfilePhoto: 'https://example.com/avatar.jpg',
};

const mockSquareCardData: SquareCardData = {
  id: 'square-1',
  title: 'Burger Barn',
  subtitle: 'Best burgers in town',
  image: 'https://example.com/burger.jpg',
  distance: '2.1mi',
  dealCount: 3,
};

// ==========================================
// DealCard Snapshot Tests
// ==========================================

describe('DealCard Snapshots', () => {
  describe('Default (Vertical) Variant', () => {
    it('renders basic deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardDefault
            deal={mockDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders upvoted deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardDefault
            deal={mockUpvotedDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders favorited deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardDefault
            deal={mockFavoritedDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders deal with hidden author correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardDefault
            deal={mockDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
            hideAuthor={true}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders deal with delete button correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardDefault
            deal={mockDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
            showDelete={true}
            onDelete={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });
  });

  describe('Horizontal Variant', () => {
    it('renders basic horizontal deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardHorizontal
            deal={mockDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders upvoted horizontal deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardHorizontal
            deal={mockUpvotedDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders favorited horizontal deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <DealCardHorizontal
            deal={mockFavoritedDeal}
            onUpvote={() => {}}
            onDownvote={() => {}}
            onFavorite={() => {}}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });
  });
});

// ==========================================
// RowCard Snapshot Tests
// ==========================================

describe('RowCard Snapshots', () => {
  describe('ExploreDeal Variant', () => {
    it('renders basic explore deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExploreDeal
            data={mockRowCardData}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders explore deal with user info correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <ExploreDeal
            data={mockRowCardDataWithUser}
            onPress={() => {}}
            onUserPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });
  });

  describe('RestaurantDeal Variant', () => {
    it('renders basic restaurant deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <RestaurantDeal
            data={mockRowCardData}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });
  });

  describe('FavoritesDeal Variant', () => {
    it('renders basic favorites deal correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <FavoritesDeal
            data={mockRowCardData}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });
  });
});

// ==========================================
// SquareCard Snapshot Tests
// ==========================================

describe('SquareCard Snapshots', () => {
  describe('Default Variant', () => {
    it('renders basic square card correctly', () => {
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <SquareCardDefault
            data={mockSquareCardData}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });

    it('renders square card with different data correctly', () => {
      const differentData: SquareCardData = {
        id: 'square-2',
        title: 'Sushi Station',
        subtitle: 'Fresh daily',
        image: 'https://example.com/sushi.jpg',
        distance: '0.5mi',
        dealCount: 10,
      };
      let tree: ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <SquareCardDefault
            data={differentData}
            onPress={() => {}}
          />
        );
      });
      expect(tree!.toJSON()).toMatchSnapshot();
    });
  });
});

// ==========================================
// Cross-Card Consistency Tests
// ==========================================

describe('Cross-Card Consistency', () => {
  it('DealCard and RowCard should both render deals consistently', () => {
    // Convert deal to row card format
    const rowFromDeal: RowCardData = {
      id: mockDeal.id,
      title: mockDeal.title,
      subtitle: mockDeal.details || '',
      image: mockDeal.image,
      distance: mockDeal.milesAway,
    };

    let dealTree: ReactTestRenderer;
    let rowTree: ReactTestRenderer;
    
    act(() => {
      dealTree = renderer.create(
        <DealCardDefault
          deal={mockDeal}
          onUpvote={() => {}}
          onDownvote={() => {}}
          onFavorite={() => {}}
          onPress={() => {}}
        />
      );
    });

    act(() => {
      rowTree = renderer.create(
        <RestaurantDeal
          data={rowFromDeal}
          onPress={() => {}}
        />
      );
    });

    // Both should render without errors
    expect(dealTree!.toJSON()).toBeTruthy();
    expect(rowTree!.toJSON()).toBeTruthy();
  });
});
