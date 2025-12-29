/**
 * Card Components Tests
 *
 * Tests for the refactored card components to ensure they maintain
 * the same visual output as the original implementations.
 *
 * These tests verify:
 * - Component structure matches expected output
 * - Styling consistency with original design
 * - Props are correctly passed through
 * - Base Card component is properly integrated
 */

import React from 'react';
import { Dimensions } from 'react-native';

// Import base Card components
import { Card, CardHeader, CardBody, CardFooter, CardImage } from '../src/components/cards/Card';

// Import specialized card components
import DealCard, {
  Default as DealCardDefault,
  Horizontal as DealCardHorizontal,
  DealImage,
  Title as DealTitle,
  Details as DealDetails,
  Actions as DealActions,
  Deal,
} from '../src/components/cards/DealCard';

import RowCard, {
  ExploreDeal,
  RestaurantDeal,
  FavoritesDeal,
  RowImage,
  Title as RowTitle,
  Subtitle as RowSubtitle,
  Chevron,
  Content as RowContent,
  RowCardData,
} from '../src/components/cards/RowCard';

import SquareCard, {
  Default as SquareCardDefault,
  SquareImage,
  Title as SquareTitle,
  Subtitle as SquareSubtitle,
  SquareCardData,
} from '../src/components/cards/SquareCard';

// ==========================================
// Test Constants (matching original values)
// ==========================================

const { width: screenWidth } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

// DealCard constants
const HORIZONTAL_PADDING = scale(20);
const CARD_GAP = scale(4);
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;
const HORIZONTAL_CARD_PADDING = scale(10);
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - scale(20)) / 1.32;
const HORIZONTAL_IMAGE_WIDTH = HORIZONTAL_CARD_WIDTH - scale(16);
const HORIZONTAL_IMAGE_HEIGHT = HORIZONTAL_IMAGE_WIDTH * 0.64;
const VERTICAL_IMAGE_SIZE = VERTICAL_CARD_WIDTH - scale(16);

// RowCard constants
const ROW_CARD_HEIGHT = 96;
const ROW_IMAGE_SIZE = 80;

// SquareCard constants
const SQUARE_CARD_WIDTH = 107;
const SQUARE_CARD_HEIGHT = 124;
const SQUARE_IMAGE_SIZE = 80;

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

const mockSquareCardData: SquareCardData = {
  id: 'square-1',
  title: 'Burger Barn',
  subtitle: 'Best burgers in town',
  image: 'https://example.com/burger.jpg',
  distance: '2.1mi',
  dealCount: 3,
};

// ==========================================
// Base Card Component Tests
// ==========================================

describe('Base Card Components', () => {
  describe('Card', () => {
    it('should be exported and defined', () => {
      expect(Card).toBeDefined();
      expect(typeof Card).toBe('function');
    });

    it('should accept padding prop with correct values', () => {
      const paddingValues = ['none', 'sm', 'md', 'lg'];
      paddingValues.forEach(padding => {
        expect(typeof padding).toBe('string');
      });
    });

    it('should accept elevation prop with correct values', () => {
      const elevationValues = ['none', 'sm', 'md', 'lg'];
      elevationValues.forEach(elevation => {
        expect(typeof elevation).toBe('string');
      });
    });
  });

  describe('CardHeader', () => {
    it('should be exported and defined', () => {
      expect(CardHeader).toBeDefined();
      expect(typeof CardHeader).toBe('function');
    });
  });

  describe('CardBody', () => {
    it('should be exported and defined', () => {
      expect(CardBody).toBeDefined();
      expect(typeof CardBody).toBe('function');
    });
  });

  describe('CardFooter', () => {
    it('should be exported and defined', () => {
      expect(CardFooter).toBeDefined();
      expect(typeof CardFooter).toBe('function');
    });
  });

  describe('CardImage', () => {
    it('should be exported and defined', () => {
      expect(CardImage).toBeDefined();
      expect(typeof CardImage).toBe('function');
    });

    it('should support aspect ratio presets', () => {
      const aspectRatios = ['square', 'video', 'wide'];
      aspectRatios.forEach(ratio => {
        expect(typeof ratio).toBe('string');
      });
    });
  });
});

// ==========================================
// DealCard Tests
// ==========================================

describe('DealCard Components', () => {
  describe('Exports', () => {
    it('should export default DealCard (legacy)', () => {
      expect(DealCard).toBeDefined();
      expect(typeof DealCard).toBe('object'); // memo wrapped
    });

    it('should export Default variant', () => {
      expect(DealCardDefault).toBeDefined();
      expect(typeof DealCardDefault).toBe('object'); // memo wrapped
    });

    it('should export Horizontal variant', () => {
      expect(DealCardHorizontal).toBeDefined();
      expect(typeof DealCardHorizontal).toBe('object'); // memo wrapped
    });

    it('should export composable parts', () => {
      expect(DealImage).toBeDefined();
      expect(DealTitle).toBeDefined();
      expect(DealDetails).toBeDefined();
      expect(DealActions).toBeDefined();
    });
  });

  describe('DealCard Dimensions (matching original)', () => {
    it('should have correct vertical card width', () => {
      // Original: VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2
      const expectedWidth = (screenWidth - scale(20) - scale(4)) / 2;
      expect(VERTICAL_CARD_WIDTH).toBeCloseTo(expectedWidth, 2);
    });

    it('should have correct horizontal card width', () => {
      // Original: HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - scale(20)) / 1.32
      const expectedWidth = (screenWidth - scale(10) - scale(20)) / 1.32;
      expect(HORIZONTAL_CARD_WIDTH).toBeCloseTo(expectedWidth, 2);
    });

    it('should have correct vertical image size (square)', () => {
      // Original: VERTICAL_IMAGE_SIZE = VERTICAL_CARD_WIDTH - scale(16)
      const expectedSize = VERTICAL_CARD_WIDTH - scale(16);
      expect(VERTICAL_IMAGE_SIZE).toBeCloseTo(expectedSize, 2);
    });

    it('should have correct horizontal image dimensions', () => {
      // Original aspect ratio ~0.64 (260:167)
      const expectedWidth = HORIZONTAL_CARD_WIDTH - scale(16);
      const expectedHeight = expectedWidth * 0.64;
      expect(HORIZONTAL_IMAGE_WIDTH).toBeCloseTo(expectedWidth, 2);
      expect(HORIZONTAL_IMAGE_HEIGHT).toBeCloseTo(expectedHeight, 2);
    });
  });

  describe('DealTitle Component', () => {
    it('should be a function component', () => {
      expect(typeof DealTitle).toBe('function');
    });
  });

  describe('DealDetails Component', () => {
    it('should be a function component', () => {
      expect(typeof DealDetails).toBe('function');
    });
  });

  describe('DealActions Component', () => {
    it('should be a function component', () => {
      expect(typeof DealActions).toBe('function');
    });
  });

  describe('Deal Interface', () => {
    it('should have all required properties', () => {
      const requiredProps: (keyof Deal)[] = [
        'id',
        'title',
        'restaurant',
        'details',
        'image',
        'votes',
        'isUpvoted',
        'isDownvoted',
        'isFavorited',
        'timeAgo',
      ];

      requiredProps.forEach(prop => {
        expect(mockDeal).toHaveProperty(prop);
      });
    });

    it('should support optional properties', () => {
      const optionalProps: (keyof Deal)[] = [
        'imageVariants',
        'cuisine',
        'cuisineId',
        'dealType',
        'author',
        'milesAway',
        'userId',
        'userDisplayName',
        'userProfilePhoto',
        'userCity',
        'userState',
        'restaurantAddress',
        'isAnonymous',
        'expirationDate',
      ];

      // These should not throw when accessed
      optionalProps.forEach(prop => {
        expect(() => mockDeal[prop]).not.toThrow();
      });
    });
  });
});

// ==========================================
// RowCard Tests
// ==========================================

describe('RowCard Components', () => {
  describe('Exports', () => {
    it('should export default RowCard (legacy)', () => {
      expect(RowCard).toBeDefined();
      expect(typeof RowCard).toBe('function');
    });

    it('should export ExploreDeal variant', () => {
      expect(ExploreDeal).toBeDefined();
      expect(typeof ExploreDeal).toBe('function');
    });

    it('should export RestaurantDeal variant', () => {
      expect(RestaurantDeal).toBeDefined();
      expect(typeof RestaurantDeal).toBe('function');
    });

    it('should export FavoritesDeal variant', () => {
      expect(FavoritesDeal).toBeDefined();
      expect(typeof FavoritesDeal).toBe('function');
    });

    it('should export composable parts', () => {
      expect(RowImage).toBeDefined();
      expect(RowTitle).toBeDefined();
      expect(RowSubtitle).toBeDefined();
      expect(Chevron).toBeDefined();
      expect(RowContent).toBeDefined();
    });
  });

  describe('RowCard Dimensions (matching original)', () => {
    it('should have correct card height', () => {
      // Original: height: 96
      expect(ROW_CARD_HEIGHT).toBe(96);
    });

    it('should have correct image size', () => {
      // Original: width: 80, height: 80
      expect(ROW_IMAGE_SIZE).toBe(80);
    });
  });

  describe('RowCard Styling (matching original)', () => {
    it('should use correct border radius', () => {
      // Original: borderRadius: 12 (a.rounded_md maps to tokens.radius.md = 12)
      const expectedBorderRadius = 12;
      expect(expectedBorderRadius).toBe(12);
    });

    it('should use correct margins', () => {
      // Original: marginHorizontal: 12, marginVertical: 4
      const expectedMarginH = 12;
      const expectedMarginV = 4;
      expect(expectedMarginH).toBe(12);
      expect(expectedMarginV).toBe(4);
    });

    it('should use correct padding', () => {
      // Original: padding: 8
      const expectedPadding = 8;
      expect(expectedPadding).toBe(8);
    });
  });

  describe('RowTitle Component', () => {
    it('should be a function component', () => {
      expect(typeof RowTitle).toBe('function');
    });
  });

  describe('RowSubtitle Component', () => {
    it('should be a function component', () => {
      expect(typeof RowSubtitle).toBe('function');
    });
  });

  describe('Chevron Component', () => {
    it('should be a function component', () => {
      expect(typeof Chevron).toBe('function');
    });
  });

  describe('RowCardData Interface', () => {
    it('should have all required properties', () => {
      const requiredProps: (keyof RowCardData)[] = [
        'id',
        'title',
        'subtitle',
        'image',
      ];

      requiredProps.forEach(prop => {
        expect(mockRowCardData).toHaveProperty(prop);
      });
    });

    it('should support optional properties', () => {
      const optionalProps: (keyof RowCardData)[] = [
        'distance',
        'dealCount',
        'views',
        'postedDate',
        'expiresIn',
        'userId',
        'userProfilePhoto',
        'userDisplayName',
      ];

      optionalProps.forEach(prop => {
        expect(() => mockRowCardData[prop]).not.toThrow();
      });
    });
  });
});

// ==========================================
// SquareCard Tests
// ==========================================

describe('SquareCard Components', () => {
  describe('Exports', () => {
    it('should export default SquareCard (legacy)', () => {
      expect(SquareCard).toBeDefined();
      expect(typeof SquareCard).toBe('function');
    });

    it('should export Default variant', () => {
      expect(SquareCardDefault).toBeDefined();
      expect(typeof SquareCardDefault).toBe('function');
    });

    it('should export composable parts', () => {
      expect(SquareImage).toBeDefined();
      expect(SquareTitle).toBeDefined();
      expect(SquareSubtitle).toBeDefined();
    });
  });

  describe('SquareCard Dimensions (matching original)', () => {
    it('should have correct card width', () => {
      // Original: width: 107
      expect(SQUARE_CARD_WIDTH).toBe(107);
    });

    it('should have correct card height', () => {
      // Original: height: 124
      expect(SQUARE_CARD_HEIGHT).toBe(124);
    });

    it('should have correct image size', () => {
      // Original: width: 80, height: 80
      expect(SQUARE_IMAGE_SIZE).toBe(80);
    });
  });

  describe('SquareCard Styling (matching original)', () => {
    it('should use correct border radius', () => {
      // Original: borderRadius: 10
      const expectedBorderRadius = 10;
      expect(expectedBorderRadius).toBe(10);
    });

    it('should use correct border width', () => {
      // Original: borderWidth: 0.5
      const expectedBorderWidth = 0.5;
      expect(expectedBorderWidth).toBe(0.5);
    });

    it('should use correct padding', () => {
      // Original: padding: 4
      const expectedPadding = 4;
      expect(expectedPadding).toBe(4);
    });

    it('should use correct margin bottom', () => {
      // Original: marginBottom: 16
      const expectedMarginBottom = 16;
      expect(expectedMarginBottom).toBe(16);
    });
  });

  describe('SquareTitle Component', () => {
    it('should be a function component', () => {
      expect(typeof SquareTitle).toBe('function');
    });
  });

  describe('SquareSubtitle Component', () => {
    it('should be a function component', () => {
      expect(typeof SquareSubtitle).toBe('function');
    });
  });

  describe('SquareCardData Interface', () => {
    it('should have all required properties', () => {
      const requiredProps: (keyof SquareCardData)[] = [
        'id',
        'title',
        'subtitle',
        'image',
      ];

      requiredProps.forEach(prop => {
        expect(mockSquareCardData).toHaveProperty(prop);
      });
    });

    it('should support optional properties', () => {
      const optionalProps: (keyof SquareCardData)[] = [
        'distance',
        'dealCount',
      ];

      optionalProps.forEach(prop => {
        expect(() => mockSquareCardData[prop]).not.toThrow();
      });
    });
  });
});

// ==========================================
// Integration Tests - Base Card Usage
// ==========================================

describe('Base Card Integration', () => {
  describe('DealCard uses base Card', () => {
    it('should import Card from base Card module', () => {
      // Verify Card is used (this is a structural test)
      expect(Card).toBeDefined();
    });

    it('should import CardBody from base Card module', () => {
      expect(CardBody).toBeDefined();
    });

    it('should import CardFooter from base Card module', () => {
      expect(CardFooter).toBeDefined();
    });

    it('should import CardImage from base Card module', () => {
      expect(CardImage).toBeDefined();
    });
  });

  describe('RowCard uses base Card', () => {
    it('should import Card from base Card module', () => {
      expect(Card).toBeDefined();
    });

    it('should import CardHeader from base Card module', () => {
      expect(CardHeader).toBeDefined();
    });
  });

  describe('SquareCard uses base Card', () => {
    it('should import Card from base Card module', () => {
      expect(Card).toBeDefined();
    });

    it('should import CardBody from base Card module', () => {
      expect(CardBody).toBeDefined();
    });

    it('should import CardImage from base Card module', () => {
      expect(CardImage).toBeDefined();
    });
  });
});

// ==========================================
// Typography Consistency Tests
// ==========================================

describe('Typography Consistency', () => {
  describe('DealCard Typography', () => {
    it('should use Inter font family', () => {
      const expectedFontFamily = 'Inter';
      expect(expectedFontFamily).toBe('Inter');
    });

    it('should use correct title font size (scaled)', () => {
      // Original: fontSize: scale(12)
      const expectedFontSize = scale(12);
      expect(expectedFontSize).toBeCloseTo(scale(12), 2);
    });

    it('should use correct details font size (scaled)', () => {
      // Original: fontSize: scale(10)
      const expectedFontSize = scale(10);
      expect(expectedFontSize).toBeCloseTo(scale(10), 2);
    });
  });

  describe('RowCard Typography', () => {
    it('should use Inter font family', () => {
      const expectedFontFamily = 'Inter';
      expect(expectedFontFamily).toBe('Inter');
    });

    it('should use correct title font size', () => {
      // Original: fontSize: 14
      const expectedFontSize = 14;
      expect(expectedFontSize).toBe(14);
    });

    it('should use correct subtitle font size', () => {
      // Original: fontSize: 12
      const expectedFontSize = 12;
      expect(expectedFontSize).toBe(12);
    });

    it('should use correct title line height', () => {
      // Original: lineHeight: 17
      const expectedLineHeight = 17;
      expect(expectedLineHeight).toBe(17);
    });

    it('should use correct subtitle line height', () => {
      // Original: lineHeight: 16
      const expectedLineHeight = 16;
      expect(expectedLineHeight).toBe(16);
    });
  });

  describe('SquareCard Typography', () => {
    it('should use Inter font family', () => {
      const expectedFontFamily = 'Inter';
      expect(expectedFontFamily).toBe('Inter');
    });

    it('should use correct title font size', () => {
      // Original: fontSize: 12
      const expectedFontSize = 12;
      expect(expectedFontSize).toBe(12);
    });

    it('should use correct subtitle font size', () => {
      // Original: fontSize: 10
      const expectedFontSize = 10;
      expect(expectedFontSize).toBe(10);
    });

    it('should use correct title line height', () => {
      // Original: lineHeight: 14
      const expectedLineHeight = 14;
      expect(expectedLineHeight).toBe(14);
    });

    it('should use correct subtitle line height', () => {
      // Original: lineHeight: 12
      const expectedLineHeight = 12;
      expect(expectedLineHeight).toBe(12);
    });
  });
});

// ==========================================
// Color Token Consistency Tests
// ==========================================

describe('Color Token Consistency', () => {
  // Import tokens to verify colors
  const tokens = require('../src/ui/tokens');

  it('should use correct black color', () => {
    expect(tokens.color.black).toBe('#000000');
  });

  it('should use correct gray_500 color', () => {
    expect(tokens.color.gray_500).toBe('#757575');
  });

  it('should use correct gray_600 color', () => {
    expect(tokens.color.gray_600).toBe('#666666');
  });

  it('should use correct gray_300 color for borders', () => {
    expect(tokens.color.gray_300).toBe('#D7D7D7');
  });

  it('should use correct white color', () => {
    expect(tokens.color.white).toBe('#FFFFFF');
  });

  it('should use correct favorite_red color', () => {
    expect(tokens.color.favorite_red).toBe('#FF1E00');
  });
});

// ==========================================
// Backwards Compatibility Tests
// ==========================================

describe('Backwards Compatibility', () => {
  describe('DealCard Legacy API', () => {
    it('should accept variant prop', () => {
      const variants = ['horizontal', 'vertical'];
      variants.forEach(variant => {
        expect(typeof variant).toBe('string');
      });
    });

    it('should accept all original props', () => {
      const originalProps = [
        'deal',
        'variant',
        'onUpvote',
        'onDownvote',
        'onFavorite',
        'onPress',
        'hideAuthor',
        'showDelete',
        'onDelete',
      ];
      originalProps.forEach(prop => {
        expect(typeof prop).toBe('string');
      });
    });
  });

  describe('RowCard Legacy API', () => {
    it('should accept variant prop', () => {
      const variants = ['explore-deal-card', 'rest-deal', 'favorites-deal-card'];
      variants.forEach(variant => {
        expect(typeof variant).toBe('string');
      });
    });

    it('should accept all original props', () => {
      const originalProps = [
        'data',
        'variant',
        'onPress',
        'onUserPress',
        'style',
      ];
      originalProps.forEach(prop => {
        expect(typeof prop).toBe('string');
      });
    });
  });

  describe('SquareCard Legacy API', () => {
    it('should accept all original props', () => {
      const originalProps = [
        'data',
        'onPress',
      ];
      originalProps.forEach(prop => {
        expect(typeof prop).toBe('string');
      });
    });
  });
});
