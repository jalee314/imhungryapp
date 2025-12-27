/**
 * Component Migration Tests
 * 
 * These tests verify that migrated components maintain visual consistency
 * after being updated to use the UI token system instead of hardcoded colors.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import * as tokens from '../src/ui/tokens';

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
  useFonts: jest.fn().mockReturnValue([true, null]),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock lucide-react-native (used by VoteButtons)
jest.mock('lucide-react-native', () => ({
  ArrowBigUp: 'ArrowBigUp',
  ArrowBigDown: 'ArrowBigDown',
}));

describe('UI Token System', () => {
  describe('Color Tokens', () => {
    it('should have correct primary colors matching original design', () => {
      expect(tokens.color.primary_600).toBe('#FF8C4C');
      expect(tokens.color.primary_500).toBe('#FFA05C');
    });

    it('should have correct grayscale colors', () => {
      expect(tokens.color.white).toBe('#FFFFFF');
      expect(tokens.color.black).toBe('#000000');
      expect(tokens.color.gray_100).toBe('#F7F4F4');
      expect(tokens.color.gray_200).toBe('#DEDEDE');
      expect(tokens.color.gray_300).toBe('#D7D7D7');
      expect(tokens.color.gray_500).toBe('#757575');
      expect(tokens.color.gray_600).toBe('#666666');
    });

    it('should have correct text colors', () => {
      expect(tokens.color.text_primary).toBe('#181619');
      expect(tokens.color.gray_500).toBe('#757575'); // text_secondary
      expect(tokens.color.gray_400).toBe('#999999'); // text_tertiary-like
    });

    it('should have correct interaction colors', () => {
      expect(tokens.color.favorite_red).toBe('#FF1E00');
      // Upvote uses primary_600, downvote uses hardcoded #9796FF
      expect(tokens.color.primary_600).toBe('#FF8C4C');
    });
  });
});

describe('DealCard Component Migration', () => {
  // Import after mocks are set up
  let DealCard: any;
  
  beforeAll(() => {
    DealCard = require('../src/components/DealCard').default;
  });

  const mockDeal = {
    id: 'test-deal-1',
    title: 'Test Deal',
    restaurant: 'Test Restaurant',
    location: 'Test Location',
    distance: '0.5 mi',
    category: 'American',
    image: 'https://example.com/image.jpg',
    postedDate: '2024-01-01',
    expiresIn: '24h',
    views: 100,
    votes: 10,
    isUpvoted: false,
    isDownvoted: false,
    isFavorited: false,
    userId: 'user-1',
  };

  it('should render horizontal variant without crashing', () => {
    const { toJSON } = render(
      <DealCard deal={mockDeal} variant="horizontal" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should render vertical variant without crashing', () => {
    const { toJSON } = render(
      <DealCard deal={mockDeal} variant="vertical" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should use tokens for styling (verified via import)', () => {
    // Verify the component imports tokens
    const dealCardSource = require('fs').readFileSync(
      require.resolve('../src/components/DealCard'),
      'utf-8'
    );
    expect(dealCardSource).toContain("import * as tokens from '#/ui/tokens'");
    expect(dealCardSource).toContain('tokens.color.white');
    expect(dealCardSource).toContain('tokens.color.black');
    expect(dealCardSource).toContain('tokens.color.gray_');
  });
});

describe('RowCard Component Migration', () => {
  let RowCard: any;

  beforeAll(() => {
    RowCard = require('../src/components/RowCard').default;
  });

  const mockData = {
    id: 'test-row-1',
    title: 'Test Row Card',
    subtitle: 'Test subtitle',
    image: { uri: 'https://example.com/image.jpg' },
    distance: '1.2 mi',
    dealCount: 5,
  };

  it('should render explore-deal-card variant without crashing', () => {
    const { toJSON } = render(
      <RowCard data={mockData} variant="explore-deal-card" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should render rest-deal variant without crashing', () => {
    const { toJSON } = render(
      <RowCard data={mockData} variant="rest-deal" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should render favorites-deal-card variant without crashing', () => {
    const { toJSON } = render(
      <RowCard data={mockData} variant="favorites-deal-card" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should use tokens for styling (verified via import)', () => {
    const rowCardSource = require('fs').readFileSync(
      require.resolve('../src/components/RowCard'),
      'utf-8'
    );
    expect(rowCardSource).toContain("import * as tokens from '#/ui/tokens'");
    expect(rowCardSource).toContain('tokens.color.white');
    expect(rowCardSource).toContain('tokens.color.black');
  });
});

describe('SquareCard Component Migration', () => {
  let SquareCard: any;

  beforeAll(() => {
    SquareCard = require('../src/components/SquareCard').default;
  });

  const mockData = {
    id: 'test-square-1',
    title: 'Test Square Card',
    subtitle: 'Test subtitle',
    image: { uri: 'https://example.com/image.jpg' },
    distance: '0.8 mi',
    dealCount: 3,
  };

  it('should render without crashing', () => {
    const { toJSON } = render(<SquareCard data={mockData} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should use tokens for styling (verified via import)', () => {
    const squareCardSource = require('fs').readFileSync(
      require.resolve('../src/components/SquareCard'),
      'utf-8'
    );
    expect(squareCardSource).toContain("import * as tokens from '#/ui/tokens'");
    expect(squareCardSource).toContain('tokens.color.white');
    expect(squareCardSource).toContain('tokens.color.black');
    expect(squareCardSource).toContain('tokens.color.primary_500');
  });
});

describe('Header Component Migration', () => {
  let Header: any;

  beforeAll(() => {
    Header = require('../src/components/Header').default;
  });

  it('should render without crashing', () => {
    const { toJSON } = render(<Header />);
    expect(toJSON()).toBeTruthy();
  });

  it('should use tokens for styling (verified via import)', () => {
    const headerSource = require('fs').readFileSync(
      require.resolve('../src/components/Header'),
      'utf-8'
    );
    expect(headerSource).toContain("import * as tokens from '#/ui/tokens'");
    expect(headerSource).toContain('tokens.color.');
  });
});

describe('VoteButtons Component Migration', () => {
  let VoteButtons: any;

  beforeAll(() => {
    VoteButtons = require('../src/components/VoteButtons').default;
  });

  it('should render without crashing', () => {
    const { toJSON } = render(
      <VoteButtons
        votes={10}
        isUpvoted={false}
        isDownvoted={false}
        onUpvote={() => {}}
        onDownvote={() => {}}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('should use tokens for styling (verified via import)', () => {
    const voteButtonsSource = require('fs').readFileSync(
      require.resolve('../src/components/VoteButtons'),
      'utf-8'
    );
    expect(voteButtonsSource).toContain("import * as tokens from '#/ui/tokens'");
    expect(voteButtonsSource).toContain('tokens.color.primary_600'); // upvote color
    expect(voteButtonsSource).toContain('tokens.color.black');
  });
});

describe('CuisineFilter Component Migration', () => {
  it('should use tokens for styling (verified via import)', () => {
    const cuisineFilterSource = require('fs').readFileSync(
      require.resolve('../src/components/CuisineFilter'),
      'utf-8'
    );
    expect(cuisineFilterSource).toContain("import * as tokens from '#/ui/tokens'");
    expect(cuisineFilterSource).toContain('tokens.color.');
  });
});

describe('Token Value Consistency', () => {
  it('should maintain original hardcoded color values', () => {
    // These tests ensure token values match what was previously hardcoded
    // in components, guaranteeing visual consistency after migration
    
    // Vote container background (was #F7F4F4)
    expect(tokens.color.gray_100).toBe('#F7F4F4');
    
    // Vote container border (was #D7D7D7)
    expect(tokens.color.gray_300).toBe('#D7D7D7');
    
    // Vote separator (was #DEDEDE)
    expect(tokens.color.gray_200).toBe('#DEDEDE');
    
    // Detail text color (was #757575)
    expect(tokens.color.gray_500).toBe('#757575');
    
    // Upvote color uses primary_600 (was #FF8C4C)
    expect(tokens.color.primary_600).toBe('#FF8C4C');
    
    // Favorite heart color (was #FF1E00)
    expect(tokens.color.favorite_red).toBe('#FF1E00');
    
    // Primary accent (was #FFA05C)
    expect(tokens.color.primary_500).toBe('#FFA05C');
  });

  it('should have semantic color aliases', () => {
    // Verify semantic naming maps to correct values
    expect(tokens.color.text_primary).toBe('#181619');
    expect(tokens.color.gray_500).toBe('#757575'); // used as secondary
    expect(tokens.color.gray_400).toBe('#999999'); // used as tertiary
  });
});
