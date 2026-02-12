/**
 * Characterization Tests for dealService
 *
 * These tests capture the exact behavior of the dealService as a regression guard.
 * They lock output shapes and transformation semantics before service decomposition.
 *
 * Behaviors captured:
 * - transformDealForUI: Transform database deals to UI format
 * - Image ordering: display_order prioritization, thumbnail selection
 * - Image variant selection for carousel (images array)
 * - User information handling (anonymous, profile photos)
 * - Distance and time formatting
 * - Create/Edit/Delete mutation payload shapes
 */

import {
  mockSupabase,
  configureMockAuth,
  mockUser,
} from '../../test-utils/mocks/supabaseMock';
import {
  transformDealForUI,
  DatabaseDeal,
  CreateDealData,
  UpdateDealData,
  DealEditData,
} from '../dealService';

// Type for the mock query builder
type MockQueryBuilder = ReturnType<typeof mockSupabase.from>;

describe('dealService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureMockAuth(mockUser);
    // Mock Date.now for consistent time calculations
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-12T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =============================================================================
  // transformDealForUI Tests
  // =============================================================================

  describe('transformDealForUI', () => {
    describe('output shape', () => {
      it('should transform DatabaseDeal to Deal shape', () => {
        const dbDeal = createMockDatabaseDeal();

        const result = transformDealForUI(dbDeal);

        // Verify all expected properties exist
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('restaurant');
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('image');
        expect(result).toHaveProperty('votes');
        expect(result).toHaveProperty('isUpvoted');
        expect(result).toHaveProperty('isDownvoted');
        expect(result).toHaveProperty('isFavorited');
        expect(result).toHaveProperty('cuisine');
        expect(result).toHaveProperty('cuisineId');
        expect(result).toHaveProperty('timeAgo');
        expect(result).toHaveProperty('author');
        expect(result).toHaveProperty('milesAway');
        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('userDisplayName');
        expect(result).toHaveProperty('userProfilePhoto');
        expect(result).toHaveProperty('userCity');
        expect(result).toHaveProperty('userState');
        expect(result).toHaveProperty('restaurantAddress');
        expect(result).toHaveProperty('isAnonymous');
        expect(result).toHaveProperty('expirationDate');
      });

      it('should snapshot the full output shape', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_id: 'deal-123',
          title: 'Test Deal Title',
          description: 'Test description',
          restaurant_name: 'Test Restaurant',
          restaurant_address: '123 Test St',
          cuisine_name: 'Italian',
          cuisine_id: 'cuisine-1',
          distance_miles: 2.5,
          votes: 42,
          is_upvoted: true,
          is_downvoted: false,
          is_favorited: true,
          user_display_name: 'Test Author',
          user_id: 'user-123',
          is_anonymous: false,
          created_at: '2026-02-12T11:00:00Z', // 1 hour ago
          end_date: '2026-03-01T00:00:00Z',
        });

        const result = transformDealForUI(dbDeal);

        expect(result).toMatchSnapshot();
      });

      it('should map deal_id to id', () => {
        const dbDeal = createMockDatabaseDeal({ deal_id: 'unique-deal-id' });

        const result = transformDealForUI(dbDeal);

        expect(result.id).toBe('unique-deal-id');
      });

      it('should map description to details', () => {
        const dbDeal = createMockDatabaseDeal({ description: 'Buy one get one free!' });

        const result = transformDealForUI(dbDeal);

        expect(result.details).toBe('Buy one get one free!');
      });

      it('should use empty string for null description', () => {
        const dbDeal = createMockDatabaseDeal({ description: null });

        const result = transformDealForUI(dbDeal);

        expect(result.details).toBe('');
      });

      it('should map restaurant_name to restaurant', () => {
        const dbDeal = createMockDatabaseDeal({ restaurant_name: 'Tasty Bites' });

        const result = transformDealForUI(dbDeal);

        expect(result.restaurant).toBe('Tasty Bites');
      });
    });

    describe('image source prioritization', () => {
      it('should prioritize first image by display_order from deal_images', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-2', display_order: 2, is_thumbnail: true, variants: { large: 'second-url' } },
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: { large: 'first-url' } },
          ],
          image_metadata: { variants: { large: 'primary-url' }, image_type: 'deal_image' },
        });

        const result = transformDealForUI(dbDeal);

        // imageVariants should be from the first image by display_order
        expect(result.imageVariants).toEqual({ large: 'first-url' });
      });

      it('should fallback to is_thumbnail when first by display_order has no variants', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            // @ts-expect-error Testing null variant handling
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: null },
            { image_metadata_id: 'img-2', display_order: 2, is_thumbnail: true, variants: { large: 'thumbnail-url' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toEqual({ large: 'thumbnail-url' });
      });

      it('should fallback to template image_metadata when no deal_images have variants', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [],
          image_metadata: { variants: { large: 'template-url' }, image_type: 'deal_image' },
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toEqual({ large: 'template-url' });
      });

      it('should set imageVariants to undefined when no images available', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [],
          image_metadata: undefined,
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toBeUndefined();
      });

      it('should always provide a fallback image source', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [],
          image_metadata: undefined,
        });

        const result = transformDealForUI(dbDeal);

        // Should return the require() default image
        expect(result.image).toBeDefined();
      });
    });

    describe('images array for carousel', () => {
      it('should extract image URLs sorted by display_order', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-3', display_order: 3, is_thumbnail: false, variants: { large: 'third' } },
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: { large: 'first' } },
            { image_metadata_id: 'img-2', display_order: 2, is_thumbnail: true, variants: { large: 'second' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['first', 'second', 'third']);
      });

      it('should prefer large variant for carousel images', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: { small: 'small', medium: 'medium', large: 'large' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['large']);
      });

      it('should fallback to medium when no large variant', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: { small: 'small', medium: 'medium' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['medium']);
      });

      it('should fallback to original when no large or medium', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: { original: 'original-url' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['original-url']);
      });

      it('should filter out images without variants', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: { large: 'valid' } },
            // @ts-expect-error Testing null variant handling
            { image_metadata_id: 'img-2', display_order: 2, is_thumbnail: false, variants: null },
            { image_metadata_id: 'img-3', display_order: 3, is_thumbnail: false, variants: { large: 'also-valid' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['valid', 'also-valid']);
      });

      it('should return undefined when no deal_images', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: undefined,
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toBeUndefined();
      });

      it('should filter out empty URLs', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'img-1', display_order: 1, is_thumbnail: false, variants: {} },
            { image_metadata_id: 'img-2', display_order: 2, is_thumbnail: false, variants: { large: 'valid-url' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['valid-url']);
      });
    });

    describe('user information handling', () => {
      it('should display Anonymous for anonymous posts', () => {
        const dbDeal = createMockDatabaseDeal({
          is_anonymous: true,
          user_display_name: 'Real Name',
        });

        const result = transformDealForUI(dbDeal);

        expect(result.author).toBe('Anonymous');
        expect(result.isAnonymous).toBe(true);
      });

      it('should display user display_name for non-anonymous posts', () => {
        const dbDeal = createMockDatabaseDeal({
          is_anonymous: false,
          user_display_name: 'John Doe',
        });

        const result = transformDealForUI(dbDeal);

        expect(result.author).toBe('John Doe');
        expect(result.isAnonymous).toBe(false);
      });

      it('should use Unknown when no user_display_name and not anonymous', () => {
        const dbDeal = createMockDatabaseDeal({
          is_anonymous: false,
          user_display_name: null,
        });

        const result = transformDealForUI(dbDeal);

        expect(result.author).toBe('Unknown');
      });

      it('should include user profile metadata fields', () => {
        const dbDeal = createMockDatabaseDeal({
          user_id: 'user-456',
          user_display_name: 'Test User',
          user_city: 'San Francisco',
          user_state: 'CA',
        });

        const result = transformDealForUI(dbDeal);

        expect(result.userId).toBe('user-456');
        expect(result.userDisplayName).toBe('Test User');
        expect(result.userCity).toBe('San Francisco');
        expect(result.userState).toBe('CA');
      });

      it('should use small variant for user profile photo', () => {
        const dbDeal = createMockDatabaseDeal({
          user_profile_metadata: {
            variants: { small: 'small-profile', thumbnail: 'thumb-profile' },
          },
        });

        const result = transformDealForUI(dbDeal);

        expect(result.userProfilePhoto).toBe('small-profile');
      });

      it('should fallback to thumbnail when no small variant', () => {
        const dbDeal = createMockDatabaseDeal({
          user_profile_metadata: {
            variants: { thumbnail: 'thumb-profile' },
          },
        });

        const result = transformDealForUI(dbDeal);

        expect(result.userProfilePhoto).toBe('thumb-profile');
      });

      it('should set userProfilePhoto to undefined when no variants', () => {
        const dbDeal = createMockDatabaseDeal({
          user_profile_metadata: undefined,
        });

        const result = transformDealForUI(dbDeal);

        expect(result.userProfilePhoto).toBeUndefined();
      });
    });

    describe('distance formatting', () => {
      it('should format distance to one decimal place', () => {
        const dbDeal = createMockDatabaseDeal({ distance_miles: 2.567 });

        const result = transformDealForUI(dbDeal);

        expect(result.milesAway).toBe('2.6mi');
      });

      it('should show whole number when distance is round', () => {
        const dbDeal = createMockDatabaseDeal({ distance_miles: 3.0 });

        const result = transformDealForUI(dbDeal);

        expect(result.milesAway).toBe('3mi');
      });

      it('should show ?mi when distance is null', () => {
        const dbDeal = createMockDatabaseDeal({ distance_miles: null });

        const result = transformDealForUI(dbDeal);

        expect(result.milesAway).toBe('?mi');
      });

      it('should show ?mi when distance is undefined', () => {
        const dbDeal = createMockDatabaseDeal({ distance_miles: undefined });

        const result = transformDealForUI(dbDeal);

        expect(result.milesAway).toBe('?mi');
      });

      it('should handle zero distance', () => {
        const dbDeal = createMockDatabaseDeal({ distance_miles: 0 });

        const result = transformDealForUI(dbDeal);

        expect(result.milesAway).toBe('0mi');
      });
    });

    describe('time ago formatting', () => {
      it('should show seconds ago for recent posts', () => {
        const dbDeal = createMockDatabaseDeal({
          created_at: '2026-02-12T11:59:30Z', // 30 seconds ago
        });

        const result = transformDealForUI(dbDeal);

        expect(result.timeAgo).toBe('30s ago');
      });

      it('should show minutes ago for posts under an hour', () => {
        const dbDeal = createMockDatabaseDeal({
          created_at: '2026-02-12T11:45:00Z', // 15 minutes ago
        });

        const result = transformDealForUI(dbDeal);

        expect(result.timeAgo).toBe('15m ago');
      });

      it('should show hours ago for posts under a day', () => {
        const dbDeal = createMockDatabaseDeal({
          created_at: '2026-02-12T06:00:00Z', // 6 hours ago
        });

        const result = transformDealForUI(dbDeal);

        expect(result.timeAgo).toBe('6h ago');
      });

      it('should show days ago for older posts', () => {
        const dbDeal = createMockDatabaseDeal({
          created_at: '2026-02-09T12:00:00Z', // 3 days ago
        });

        const result = transformDealForUI(dbDeal);

        expect(result.timeAgo).toBe('3d ago');
      });
    });

    describe('vote state handling', () => {
      it('should pass through vote count', () => {
        const dbDeal = createMockDatabaseDeal({ votes: 42 });

        const result = transformDealForUI(dbDeal);

        expect(result.votes).toBe(42);
      });

      it('should default to 0 when votes is undefined', () => {
        const dbDeal = createMockDatabaseDeal({ votes: undefined });

        const result = transformDealForUI(dbDeal);

        expect(result.votes).toBe(0);
      });

      it('should pass through upvote state', () => {
        const dbDeal = createMockDatabaseDeal({ is_upvoted: true });

        const result = transformDealForUI(dbDeal);

        expect(result.isUpvoted).toBe(true);
      });

      it('should pass through downvote state', () => {
        const dbDeal = createMockDatabaseDeal({ is_downvoted: true });

        const result = transformDealForUI(dbDeal);

        expect(result.isDownvoted).toBe(true);
      });

      it('should pass through favorite state', () => {
        const dbDeal = createMockDatabaseDeal({ is_favorited: true });

        const result = transformDealForUI(dbDeal);

        expect(result.isFavorited).toBe(true);
      });

      it('should default vote states to false', () => {
        const dbDeal = createMockDatabaseDeal({
          is_upvoted: undefined,
          is_downvoted: undefined,
          is_favorited: undefined,
        });

        const result = transformDealForUI(dbDeal);

        expect(result.isUpvoted).toBe(false);
        expect(result.isDownvoted).toBe(false);
        expect(result.isFavorited).toBe(false);
      });
    });

    describe('cuisine and category handling', () => {
      it('should use cuisine_name when available', () => {
        const dbDeal = createMockDatabaseDeal({ cuisine_name: 'Mexican' });

        const result = transformDealForUI(dbDeal);

        expect(result.cuisine).toBe('Mexican');
      });

      it('should default to Cuisine when cuisine_name is null', () => {
        const dbDeal = createMockDatabaseDeal({ cuisine_name: null });

        const result = transformDealForUI(dbDeal);

        expect(result.cuisine).toBe('Cuisine');
      });

      it('should pass through cuisineId', () => {
        const dbDeal = createMockDatabaseDeal({
          cuisine_id: 'cuisine-123',
        });

        const result = transformDealForUI(dbDeal);

        expect(result.cuisineId).toBe('cuisine-123');
      });

      it('should set cuisineId to undefined when null', () => {
        const dbDeal = createMockDatabaseDeal({ cuisine_id: null });

        const result = transformDealForUI(dbDeal);

        expect(result.cuisineId).toBeUndefined();
      });
    });

    describe('expiration date handling', () => {
      it('should pass through end_date as expirationDate', () => {
        const dbDeal = createMockDatabaseDeal({ end_date: '2026-03-15T00:00:00Z' });

        const result = transformDealForUI(dbDeal);

        expect(result.expirationDate).toBe('2026-03-15T00:00:00Z');
      });

      it('should set expirationDate to null when end_date is null', () => {
        const dbDeal = createMockDatabaseDeal({ end_date: null });

        const result = transformDealForUI(dbDeal);

        expect(result.expirationDate).toBeNull();
      });
    });
  });

  // =============================================================================
  // Mutation Payload Tests
  // =============================================================================

  describe('mutation payload shapes', () => {
    describe('CreateDealData interface', () => {
      it('should have expected shape', () => {
        const createData: CreateDealData = {
          title: 'Test Deal',
          description: 'Description',
          imageUris: ['file://image1.jpg', 'file://image2.jpg'],
          thumbnailIndex: 0,
          expirationDate: '2026-03-01T00:00:00Z',
          restaurantId: 'rest-123',
          categoryId: 'cat-123',
          cuisineId: 'cuisine-123',
          isAnonymous: false,
        };

        // Verify structure
        expect(createData).toHaveProperty('title');
        expect(createData).toHaveProperty('description');
        expect(createData).toHaveProperty('imageUris');
        expect(createData).toHaveProperty('thumbnailIndex');
        expect(createData).toHaveProperty('expirationDate');
        expect(createData).toHaveProperty('restaurantId');
        expect(createData).toHaveProperty('categoryId');
        expect(createData).toHaveProperty('cuisineId');
        expect(createData).toHaveProperty('isAnonymous');
      });

      it('should support multiple image URIs', () => {
        const createData: CreateDealData = {
          title: 'Multi-image Deal',
          description: '',
          imageUris: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'],
          thumbnailIndex: 2,
          expirationDate: null,
          restaurantId: 'rest-1',
          categoryId: null,
          cuisineId: null,
          isAnonymous: true,
        };

        expect(createData.imageUris).toHaveLength(5);
        expect(createData.thumbnailIndex).toBe(2);
      });

      it('should snapshot create payload shape', () => {
        const createData: CreateDealData = {
          title: 'Snapshot Test Deal',
          description: 'Test Description',
          imageUris: ['file://test.jpg'],
          thumbnailIndex: 0,
          expirationDate: '2026-04-01T00:00:00Z',
          restaurantId: 'restaurant-abc',
          categoryId: 'category-xyz',
          cuisineId: 'cuisine-123',
          isAnonymous: false,
        };

        expect(createData).toMatchSnapshot();
      });
    });

    describe('UpdateDealData interface', () => {
      it('should support partial updates', () => {
        const updateTitle: UpdateDealData = { title: 'New Title' };
        const updateDescription: UpdateDealData = { description: 'New Description' };
        const updateExpiration: UpdateDealData = { expirationDate: '2026-05-01' };
        const updateAnonymous: UpdateDealData = { isAnonymous: true };

        expect(updateTitle.title).toBe('New Title');
        expect(updateDescription.description).toBe('New Description');
        expect(updateExpiration.expirationDate).toBe('2026-05-01');
        expect(updateAnonymous.isAnonymous).toBe(true);
      });

      it('should support null expiration date', () => {
        const update: UpdateDealData = { expirationDate: null };

        expect(update.expirationDate).toBeNull();
      });

      it('should snapshot full update payload', () => {
        const update: UpdateDealData = {
          title: 'Updated Title',
          description: 'Updated Description',
          expirationDate: '2026-06-01T00:00:00Z',
          isAnonymous: false,
        };

        expect(update).toMatchSnapshot();
      });
    });

    describe('DealEditData interface', () => {
      it('should have complete structure for edit screen', () => {
        const editData: DealEditData = {
          templateId: 'template-123',
          dealId: 'deal-456',
          title: 'Current Title',
          description: 'Current Description',
          expirationDate: '2026-07-01T00:00:00Z',
          restaurantId: 'rest-789',
          restaurantName: 'Test Restaurant',
          restaurantAddress: '123 Main St',
          categoryId: 'cat-1',
          cuisineId: 'cuisine-1',
          isAnonymous: false,
          images: [
            {
              imageMetadataId: 'img-1',
              displayOrder: 0,
              isThumbnail: true,
              url: 'https://cloudinary.com/image1.jpg',
            },
            {
              imageMetadataId: 'img-2',
              displayOrder: 1,
              isThumbnail: false,
              url: 'https://cloudinary.com/image2.jpg',
            },
          ],
        };

        expect(editData).toHaveProperty('templateId');
        expect(editData).toHaveProperty('dealId');
        expect(editData).toHaveProperty('title');
        expect(editData).toHaveProperty('description');
        expect(editData).toHaveProperty('expirationDate');
        expect(editData).toHaveProperty('restaurantId');
        expect(editData).toHaveProperty('restaurantName');
        expect(editData).toHaveProperty('restaurantAddress');
        expect(editData).toHaveProperty('categoryId');
        expect(editData).toHaveProperty('cuisineId');
        expect(editData).toHaveProperty('isAnonymous');
        expect(editData).toHaveProperty('images');
        expect(editData.images).toHaveLength(2);
      });

      it('should snapshot edit data shape', () => {
        const editData: DealEditData = {
          templateId: 'tmpl-001',
          dealId: 'deal-001',
          title: 'Edit Test',
          description: null,
          expirationDate: null,
          restaurantId: 'rest-001',
          restaurantName: 'Sample Restaurant',
          restaurantAddress: '456 Oak Ave',
          categoryId: null,
          cuisineId: 'italian',
          isAnonymous: true,
          images: [
            {
              imageMetadataId: 'meta-1',
              displayOrder: 0,
              isThumbnail: true,
              url: 'https://example.com/img.jpg',
            },
          ],
        };

        expect(editData).toMatchSnapshot();
      });
    });
  });

  // =============================================================================
  // Image Ordering and Thumbnail Logic Tests
  // =============================================================================

  describe('image ordering logic', () => {
    describe('deal_images sorting', () => {
      it('should sort deal_images by display_order ascending', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'c', display_order: 3, is_thumbnail: false, variants: { large: 'url-c' } },
            { image_metadata_id: 'a', display_order: 1, is_thumbnail: false, variants: { large: 'url-a' } },
            { image_metadata_id: 'b', display_order: 2, is_thumbnail: false, variants: { large: 'url-b' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        // images array should be sorted by display_order
        expect(result.images).toEqual(['url-a', 'url-b', 'url-c']);
      });

      it('should handle non-sequential display_order values', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'b', display_order: 10, is_thumbnail: false, variants: { large: 'second' } },
            { image_metadata_id: 'a', display_order: 5, is_thumbnail: false, variants: { large: 'first' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.images).toEqual(['first', 'second']);
      });
    });

    describe('thumbnail selection', () => {
      it('should use first by display_order for imageVariants, not is_thumbnail', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            { image_metadata_id: 'thumb', display_order: 2, is_thumbnail: true, variants: { large: 'thumbnail-image' } },
            { image_metadata_id: 'first', display_order: 1, is_thumbnail: false, variants: { large: 'first-image' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        // Should use first by display_order, not the one marked is_thumbnail
        expect(result.imageVariants).toEqual({ large: 'first-image' });
      });

      it('should fall back to is_thumbnail when first by order has no variants', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [
            // @ts-expect-error Testing null variant handling
            { image_metadata_id: 'first', display_order: 1, is_thumbnail: false, variants: null },
            { image_metadata_id: 'thumb', display_order: 2, is_thumbnail: true, variants: { large: 'thumb-url' } },
          ],
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toEqual({ large: 'thumb-url' });
      });
    });

    describe('primary image fallback', () => {
      it('should use template image_metadata when deal_images is empty', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [],
          image_metadata: {
            variants: { large: 'primary-image', medium: 'med', small: 'sm' },
            image_type: 'deal_image',
          },
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toEqual({
          large: 'primary-image',
          medium: 'med',
          small: 'sm',
        });
      });

      it('should use template image_metadata when deal_images is undefined', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: undefined,
          image_metadata: {
            variants: { original: 'original-only' },
            image_type: 'deal_image',
          },
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toEqual({ original: 'original-only' });
      });

      it('should handle both deal_images and image_metadata being empty', () => {
        const dbDeal = createMockDatabaseDeal({
          deal_images: [],
          image_metadata: undefined,
        });

        const result = transformDealForUI(dbDeal);

        expect(result.imageVariants).toBeUndefined();
        expect(result.image).toBeDefined(); // Should still have fallback
      });
    });
  });

  // =============================================================================
  // DatabaseDeal Interface Snapshot
  // =============================================================================

  describe('DatabaseDeal interface', () => {
    it('should snapshot the full input structure', () => {
      const fullDatabaseDeal: DatabaseDeal = {
        deal_id: 'deal-full-123',
        template_id: 'template-full-123',
        title: 'Complete Deal',
        description: 'Full description text',
        image_url: 'legacy-url.jpg',
        restaurant_name: 'Complete Restaurant',
        restaurant_address: '999 Full St, City, ST 12345',
        cuisine_name: 'French',
        cuisine_id: 'french-cuisine-id',
        category_name: 'Fine Dining',
        created_at: '2026-02-10T08:00:00Z',
        start_date: '2026-02-01T00:00:00Z',
        end_date: '2026-02-28T23:59:59Z',
        is_anonymous: false,
        user_id: 'user-full-123',
        user_display_name: 'Full Test User',
        user_profile_photo: 'legacy-profile.jpg',
        user_city: 'Los Angeles',
        user_state: 'CA',
        restaurant_id: 'restaurant-full-123',
        image_metadata: {
          variants: {
            thumbnail: 'thumb.jpg',
            small: 'small.jpg',
            medium: 'medium.jpg',
            large: 'large.jpg',
            original: 'original.jpg',
          },
          image_type: 'deal_image',
        },
        deal_images: [
          {
            image_metadata_id: 'img-meta-1',
            display_order: 0,
            is_thumbnail: true,
            variants: {
              thumbnail: 'img1-thumb.jpg',
              small: 'img1-small.jpg',
              medium: 'img1-medium.jpg',
              large: 'img1-large.jpg',
              original: 'img1-original.jpg',
            },
          },
          {
            image_metadata_id: 'img-meta-2',
            display_order: 1,
            is_thumbnail: false,
            variants: {
              large: 'img2-large.jpg',
            },
          },
        ],
        user_profile_metadata: {
          variants: {
            thumbnail: 'profile-thumb.jpg',
            small: 'profile-small.jpg',
          },
        },
        distance_miles: 1.234,
        votes: 100,
        is_upvoted: true,
        is_downvoted: false,
        is_favorited: true,
      };

      expect(fullDatabaseDeal).toMatchSnapshot();
    });
  });
});

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a mock DatabaseDeal with sensible defaults that can be overridden
 */
function createMockDatabaseDeal(overrides: Partial<DatabaseDeal> = {}): DatabaseDeal {
  return {
    deal_id: 'deal-default-123',
    template_id: 'template-default-123',
    title: 'Default Test Deal',
    description: 'Default description',
    image_url: null,
    restaurant_name: 'Default Restaurant',
    restaurant_address: '100 Default St',
    cuisine_name: 'American',
    cuisine_id: 'american-id',
    category_name: 'Lunch Special',
    created_at: '2026-02-12T10:00:00Z', // 2 hours ago by default
    start_date: '2026-02-01T00:00:00Z',
    end_date: '2026-02-28T23:59:59Z',
    is_anonymous: false,
    user_id: 'user-default-123',
    user_display_name: 'Default User',
    user_profile_photo: null,
    user_city: 'Default City',
    user_state: 'CA',
    restaurant_id: 'restaurant-default-123',
    image_metadata: undefined,
    deal_images: undefined,
    user_profile_metadata: undefined,
    distance_miles: 1.5,
    votes: 10,
    is_upvoted: false,
    is_downvoted: false,
    is_favorited: false,
    ...overrides,
  };
}
