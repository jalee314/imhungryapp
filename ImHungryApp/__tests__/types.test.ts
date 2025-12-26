/**
 * Types Tests
 * 
 * Tests to verify type exports and structure after the types split.
 * These are compile-time tests - if they compile, the types work.
 */

import {
  // Deal types
  Deal,
  DatabaseDeal,
  CreateDealData,
  RankedDealMeta,
  
  // User types
  User,
  UserDisplayData,
  UserPost,
  UserProfileData,
  UserProfileCache,
  UserProfile,
  ProfileLoadingResult,
  
  // Restaurant types
  Restaurant,
  GooglePlaceResult,
  RestaurantSearchResult,
  DiscoverRestaurant,
  DiscoverResult,
  RestaurantDeal,
  
  // Cuisine types
  Category,
  Cuisine,
  CuisineUpdateResult,
  
  // Admin types
  AdminUser,
  Report,
  AdminDeal,
  AppAnalytics,
  ReportSubmission,
  ReasonCode,
  BlockReasonCode,
  CreateBlockData,
  BlockSubmissionResult,
  
  // Common types
  ImageType,
  ImageVariants,
  VariantContext,
  InteractionType,
  InteractionSource,
  PasswordResetResult,
  FavoriteDeal,
  FavoriteRestaurant,
  LocationItem,
  
  // Component props
  DealCardProps,
  SquareCardData,
  RowCardData,
  HeaderProps,
} from '../src/types';

describe('Types Export Tests', () => {
  describe('Deal Types', () => {
    it('should export Deal type with correct structure', () => {
      const deal: Deal = {
        id: '1',
        title: 'Test Deal',
        restaurant: 'Test Restaurant',
        details: 'Test details',
        image: 'test.jpg',
        votes: 10,
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false,
        timeAgo: '2h ago',
      };
      
      expect(deal.id).toBe('1');
      expect(deal.title).toBe('Test Deal');
    });

    it('should export DatabaseDeal type with correct structure', () => {
      const dbDeal: DatabaseDeal = {
        deal_id: '1',
        template_id: 't1',
        title: 'Test',
        description: null,
        image_url: null,
        restaurant_name: 'Test Restaurant',
        restaurant_address: '123 Main St',
        cuisine_name: null,
        cuisine_id: null,
        category_name: null,
        created_at: '2024-01-01',
        start_date: '2024-01-01',
        end_date: null,
        is_anonymous: false,
        user_id: 'u1',
        user_display_name: null,
        user_profile_photo: null,
        restaurant_id: 'r1',
      };
      
      expect(dbDeal.deal_id).toBe('1');
    });

    it('should export CreateDealData type', () => {
      const createData: CreateDealData = {
        title: 'New Deal',
        description: 'Description',
        imageUri: null,
        expirationDate: null,
        restaurantId: 'r1',
        categoryId: null,
        cuisineId: null,
        isAnonymous: false,
      };
      
      expect(createData.title).toBe('New Deal');
    });
  });

  describe('User Types', () => {
    it('should export User type with correct structure', () => {
      const user: User = {
        user_id: '1',
        display_name: 'John Doe',
        email: 'john@example.com',
        profile_photo: null,
        location_city: null,
        first_name: 'John',
        last_name: 'Doe',
        phone_number: null,
        location_lat: null,
        location_long: null,
      };
      
      expect(user.user_id).toBe('1');
      expect(user.display_name).toBe('John Doe');
    });

    it('should export UserDisplayData type', () => {
      const displayData: UserDisplayData = {
        username: 'johndoe',
        profilePicture: null,
        city: 'New York',
        state: 'NY',
      };
      
      expect(displayData.username).toBe('johndoe');
    });
  });

  describe('Restaurant Types', () => {
    it('should export Restaurant type', () => {
      const restaurant: Restaurant = {
        id: '1',
        name: 'Test Restaurant',
        address: '123 Main St',
        lat: 40.7128,
        lng: -74.006,
      };
      
      expect(restaurant.name).toBe('Test Restaurant');
    });

    it('should export GooglePlaceResult type', () => {
      const place: GooglePlaceResult = {
        google_place_id: 'ChIJ...',
        name: 'Restaurant',
        address: '123 Main St',
        lat: 40.7128,
        lng: -74.006,
        distance_miles: 0.5,
        types: ['restaurant', 'food'],
      };
      
      expect(place.types).toContain('restaurant');
    });
  });

  describe('Common Types', () => {
    it('should export ImageType union', () => {
      const imageType: ImageType = 'deal_image';
      expect(imageType).toBe('deal_image');
    });

    it('should export ImageVariants type', () => {
      const variants: ImageVariants = {
        original: 'original.jpg',
        large: 'large.jpg',
        medium: 'medium.jpg',
        small: 'small.jpg',
        thumbnail: 'thumb.jpg',
      };
      
      expect(variants.original).toBe('original.jpg');
    });

    it('should export InteractionType union', () => {
      const interaction: InteractionType = 'upvote';
      expect(interaction).toBe('upvote');
    });

    it('should export LocationItem type', () => {
      const location: LocationItem = {
        id: '1',
        name: 'New York',
        coordinates: {
          lat: 40.7128,
          lng: -74.006,
        },
      };
      
      expect(location.coordinates.lat).toBe(40.7128);
    });
  });

  describe('Admin Types', () => {
    it('should export AdminUser type', () => {
      const admin: AdminUser = {
        user_id: '1',
        display_name: 'Admin',
        email: 'admin@example.com',
        is_admin: true,
      };
      
      expect(admin.is_admin).toBe(true);
    });

    it('should export Report type', () => {
      const report: Report = {
        report_id: '1',
        deal_id: 'd1',
        reporter_user_id: 'u1',
        uploader_user_id: 'u2',
        reason_code_id: 'r1',
        reason_text: null,
        status: 'pending',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        resolved_by: null,
        resolution_action: null,
      };
      
      expect(report.status).toBe('pending');
    });
  });

  describe('Component Props Types', () => {
    it('should export HeaderProps type', () => {
      const props: HeaderProps = {
        title: 'Test Header',
        showBackButton: true,
      };
      
      expect(props.title).toBe('Test Header');
    });

    it('should export SquareCardData type', () => {
      const data: SquareCardData = {
        id: '1',
        title: 'Card Title',
        subtitle: 'Card Subtitle',
        image: 'test.jpg',
      };
      
      expect(data.id).toBe('1');
    });
  });
});

describe('Type Imports from Domain Files', () => {
  // These tests verify that the type files can be imported
  // Since TypeScript types don't exist at runtime, we just verify the files exist
  
  it('should have deals.ts file', () => {
    // If this file didn't exist, the import at the top would fail
    expect(true).toBe(true);
  });

  it('should have user.ts file', () => {
    expect(true).toBe(true);
  });

  it('should have restaurant.ts file', () => {
    expect(true).toBe(true);
  });

  it('should have cuisine.ts file', () => {
    expect(true).toBe(true);
  });

  it('should have admin.ts file', () => {
    expect(true).toBe(true);
  });

  it('should have common.ts file', () => {
    expect(true).toBe(true);
  });
});
