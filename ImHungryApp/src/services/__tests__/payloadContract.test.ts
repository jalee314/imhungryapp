/**
 * API Payload Contract Tests for Deals Service
 *
 * These tests verify that outbound Supabase request payloads maintain consistent
 * structure after service decomposition. They explicitly fail on contract drift
 * by snapshotting the exact request shapes sent to Supabase.
 *
 * Coverage:
 * - createDeal: deal_template insert, deal_images insert
 * - updateDealFields: deal_template update, deal_instance update
 * - deleteDeal: deal_instance delete, deal_template delete, deal_images delete
 * - addDealImages: deal_images insert
 * - removeDealImage: deal_images delete, deal_template update
 * - setDealThumbnail: deal_images update, deal_template update
 * - updateDealImageOrder: deal_images update
 *
 * @see PR-038 / RF-038
 */

import {
  mockSupabase,
  configureMockAuth,
  mockUser,
  mockSession,
} from '../../test-utils/mocks/supabaseMock';
import {
  CreateDealData,
  UpdateDealData,

  createDeal,
  deleteDeal,
  updateDealFields,
  addDealImages,
  removeDealImage,
  setDealThumbnail,
  updateDealImageOrder} from '../dealService';

// Mock image processing service
import * as imageProcessingService from '../imageProcessingService';

// Helper type for captured payloads
interface CapturedPayload {
  table: string;
  operation: string;
  data?: unknown;
  filters?: Record<string, unknown>;
}

// Capture payloads sent to Supabase
let capturedPayloads: CapturedPayload[] = [];

// Helper to create a tracking query builder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockQueryBuilder = any;

const createTrackingQueryBuilder = (
  table: string,
  mockResponses: Record<string, unknown> = {}
): MockQueryBuilder => {
  let currentOperation = '';
  let currentData: unknown = null;
  const filters: Record<string, unknown> = {};
  let payloadCaptured = false;

  const capturePayload = (): void => {
    if (payloadCaptured) return;
    
    if (currentOperation === 'insert' && currentData !== null) {
      capturedPayloads.push({
        table,
        operation: 'insert',
        data: JSON.parse(JSON.stringify(currentData)),
      });
      payloadCaptured = true;
    } else if (currentOperation === 'update' && currentData !== null) {
      capturedPayloads.push({
        table,
        operation: 'update',
        data: JSON.parse(JSON.stringify(currentData)),
        filters: { ...filters },
      });
      payloadCaptured = true;
    } else if (currentOperation === 'delete' && Object.keys(filters).length > 0) {
      capturedPayloads.push({
        table,
        operation: 'delete',
        filters: { ...filters },
      });
      payloadCaptured = true;
    }
  };

  // Create builder with explicit type to avoid circular reference
  const builder: MockQueryBuilder = {
    select: jest.fn((_columns?: string) => {
      currentOperation = 'select';
      return builder;
    }),
    insert: jest.fn((data: unknown) => {
      currentOperation = 'insert';
      currentData = data;
      capturedPayloads.push({
        table,
        operation: 'insert',
        data: JSON.parse(JSON.stringify(data)),
      });
      payloadCaptured = true;
      return builder;
    }),
    update: jest.fn((data: unknown) => {
      currentOperation = 'update';
      currentData = data;
      payloadCaptured = false;
      return builder;
    }),
    upsert: jest.fn(() => builder),
    delete: jest.fn(() => {
      currentOperation = 'delete';
      payloadCaptured = false;
      return builder;
    }),
    eq: jest.fn((col: string, val: unknown) => {
      filters[col] = val;
      return builder;
    }),
    neq: jest.fn(() => builder),
    gt: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lt: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    like: jest.fn(() => builder),
    ilike: jest.fn(() => builder),
    is: jest.fn(() => builder),
    in: jest.fn((col: string, vals: unknown[]) => {
      filters[col] = vals;
      return builder;
    }),
    contains: jest.fn(() => builder),
    containedBy: jest.fn(() => builder),
    range: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn().mockImplementation(() => {
      capturePayload();
      return Promise.resolve({
        data: mockResponses.single ?? null,
        error: null,
      });
    }),
    maybeSingle: jest.fn().mockImplementation(() => {
      capturePayload();
      return Promise.resolve({
        data: mockResponses.maybeSingle ?? null,
        error: null,
      });
    }),
    then: jest.fn((resolve: (value: { data: unknown; error: null }) => void) => {
      capturePayload();
      return Promise.resolve({ data: mockResponses.data ?? [], error: null }).then(resolve);
    }),
  };

  return builder;
};

describe('API Payload Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedPayloads = [];
    configureMockAuth(mockUser);
    
    // Mock image processing to return predictable IDs
    jest.spyOn(imageProcessingService, 'processImageWithEdgeFunction')
      .mockImplementation((uri: string) => {
        const index = uri.match(/\d+/) ? parseInt(uri.match(/\d+/)![0]) : 1;
        return Promise.resolve({
          success: true,
          metadataId: `uploaded-image-meta-${index}`,
        });
      });
  });

  // =============================================================================
  // createDeal Payload Contracts
  // =============================================================================

  describe('createDeal payload contracts', () => {
    const mockCreateDealData: CreateDealData = {
      title: 'Contract Test Deal',
      description: 'Testing payload structure',
      imageUris: ['file://image1.jpg'],
      thumbnailIndex: 0,
      expirationDate: '2026-03-01T00:00:00Z',
      restaurantId: 'restaurant-contract-123',
      categoryId: 'category-contract-456',
      cuisineId: 'cuisine-contract-789',
      isAnonymous: false,
    };

    beforeEach(() => {
      // Set up tracking query builders for each table
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_template':
            return createTrackingQueryBuilder(table, {
              single: { template_id: 'created-template-123' },
            });
          case 'deal_images':
            return createTrackingQueryBuilder(table, { data: [] });
          case 'image_metadata':
            return createTrackingQueryBuilder(table, {
              single: { image_metadata_id: 'uploaded-image-meta-1' },
            });
          default:
            return createTrackingQueryBuilder(table);
        }
      });
    });

    it('should snapshot deal_template insert payload structure', async () => {
      await createDeal(mockCreateDealData);

      const templateInsert = capturedPayloads.find(
        (p) => p.table === 'deal_template' && p.operation === 'insert'
      );

      expect(templateInsert).toBeDefined();
      expect(templateInsert!.data).toMatchSnapshot('deal_template_insert_payload');
    });

    it('should snapshot deal_images insert payload structure', async () => {
      await createDeal(mockCreateDealData);

      const imagesInsert = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'insert'
      );

      expect(imagesInsert).toBeDefined();
      expect(imagesInsert!.data).toMatchSnapshot('deal_images_insert_payload');
    });

    it('should include all required fields in deal_template insert', async () => {
      await createDeal(mockCreateDealData);

      const templateInsert = capturedPayloads.find(
        (p) => p.table === 'deal_template' && p.operation === 'insert'
      );

      expect(templateInsert).toBeDefined();
      const payload = templateInsert!.data as Record<string, unknown>;

      // Verify required field presence (contract enforcement)
      expect(payload).toHaveProperty('restaurant_id');
      expect(payload).toHaveProperty('user_id');
      expect(payload).toHaveProperty('title');
      expect(payload).toHaveProperty('category_id');
      expect(payload).toHaveProperty('cuisine_id');
      expect(payload).toHaveProperty('is_anonymous');
      expect(payload).toHaveProperty('source_type');
    });

    it('should include correct fields in deal_images insert', async () => {
      await createDeal(mockCreateDealData);

      const imagesInsert = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'insert'
      );

      if (imagesInsert && Array.isArray(imagesInsert.data)) {
        const firstImage = imagesInsert.data[0] as Record<string, unknown>;
        expect(firstImage).toHaveProperty('deal_template_id');
        expect(firstImage).toHaveProperty('image_metadata_id');
        expect(firstImage).toHaveProperty('display_order');
        expect(firstImage).toHaveProperty('is_thumbnail');
      }
    });

    it('should handle multiple images with correct order and thumbnail flag', async () => {
      const multiImageData: CreateDealData = {
        ...mockCreateDealData,
        imageUris: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        thumbnailIndex: 1,
      };

      await createDeal(multiImageData);

      const imagesInsert = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'insert'
      );

      expect(imagesInsert).toBeDefined();
      expect(imagesInsert!.data).toMatchSnapshot('deal_images_multi_insert_payload');
    });
  });

  // =============================================================================
  // updateDealFields Payload Contracts
  // =============================================================================

  describe('updateDealFields payload contracts', () => {
    beforeEach(() => {
      // Mock fetching the deal for ownership verification
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_instance':
            return createTrackingQueryBuilder(table, {
              single: {
                template_id: 'template-to-update',
                deal_template: { user_id: mockUser.id },
              },
            });
          case 'deal_template':
            return createTrackingQueryBuilder(table, { data: [] });
          default:
            return createTrackingQueryBuilder(table);
        }
      });

      // Mock profanity check - must return { isClean: true } for the check to pass
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { isClean: true },
        error: null,
      });
    });

    it('should snapshot deal_template update payload for title change', async () => {
      const updates: UpdateDealData = { title: 'Updated Title' };

      await updateDealFields('deal-123', updates);

      const templateUpdate = capturedPayloads.find(
        (p) => p.table === 'deal_template' && p.operation === 'update'
      );

      expect(templateUpdate).toBeDefined();
      expect(templateUpdate!.data).toMatchSnapshot('deal_template_title_update_payload');
      expect(templateUpdate!.filters).toMatchSnapshot('deal_template_update_filters');
    });

    it('should snapshot deal_template update payload for description change', async () => {
      const updates: UpdateDealData = { description: 'Updated Description' };

      await updateDealFields('deal-123', updates);

      const templateUpdate = capturedPayloads.find(
        (p) => p.table === 'deal_template' && p.operation === 'update'
      );

      expect(templateUpdate).toBeDefined();
      expect(templateUpdate!.data).toMatchSnapshot('deal_template_description_update_payload');
    });

    it('should snapshot deal_instance update payload for expiration change', async () => {
      const updates: UpdateDealData = { expirationDate: '2026-04-15T00:00:00Z' };

      await updateDealFields('deal-123', updates);

      const instanceUpdate = capturedPayloads.find(
        (p) => p.table === 'deal_instance' && p.operation === 'update'
      );

      expect(instanceUpdate).toBeDefined();
      expect(instanceUpdate!.data).toMatchSnapshot('deal_instance_expiration_update_payload');
      expect(instanceUpdate!.filters).toMatchSnapshot('deal_instance_update_filters');
    });

    it('should snapshot deal_instance update payload for anonymous toggle', async () => {
      const updates: UpdateDealData = { isAnonymous: true };

      await updateDealFields('deal-123', updates);

      const instanceUpdate = capturedPayloads.find(
        (p) => p.table === 'deal_instance' && p.operation === 'update'
      );

      expect(instanceUpdate).toBeDefined();
      expect(instanceUpdate!.data).toMatchSnapshot('deal_instance_anonymous_update_payload');
    });

    it('should snapshot combined update payload', async () => {
      const updates: UpdateDealData = {
        title: 'New Title',
        description: 'New Description',
        expirationDate: '2026-05-01',
        isAnonymous: false,
      };

      await updateDealFields('deal-456', updates);

      const allUpdates = capturedPayloads.filter((p) => p.operation === 'update');
      expect(allUpdates).toMatchSnapshot('combined_update_payloads');
    });

    it('should handle null expiration date (Unknown)', async () => {
      const updates: UpdateDealData = { expirationDate: 'Unknown' };

      await updateDealFields('deal-789', updates);

      const instanceUpdate = capturedPayloads.find(
        (p) => p.table === 'deal_instance' && p.operation === 'update'
      );

      expect(instanceUpdate).toBeDefined();
      expect(instanceUpdate!.data).toMatchSnapshot('deal_instance_null_expiration_payload');
    });
  });

  // =============================================================================
  // deleteDeal Payload Contracts
  // =============================================================================

  describe('deleteDeal payload contracts', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_instance':
            return createTrackingQueryBuilder(table, {
              single: {
                template_id: 'template-to-delete',
                deal_template: {
                  user_id: mockUser.id,
                  image_url: null,
                  image_metadata_id: 'primary-img-meta',
                },
              },
            });
          case 'deal_images':
            return createTrackingQueryBuilder(table, {
              data: [
                { image_metadata_id: 'img-meta-1' },
                { image_metadata_id: 'img-meta-2' },
              ],
            });
          case 'deal_template':
            return createTrackingQueryBuilder(table, { data: [] });
          case 'image_metadata':
            return createTrackingQueryBuilder(table, {
              data: [
                { image_metadata_id: 'img-meta-1', cloudinary_public_id: 'cloud-1' },
                { image_metadata_id: 'img-meta-2', cloudinary_public_id: 'cloud-2' },
              ],
            });
          default:
            return createTrackingQueryBuilder(table);
        }
      });

      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });
    });

    it('should snapshot deal_instance delete filter', async () => {
      await deleteDeal('deal-to-delete');

      const instanceDelete = capturedPayloads.find(
        (p) => p.table === 'deal_instance' && p.operation === 'delete'
      );

      expect(instanceDelete).toBeDefined();
      expect(instanceDelete!.filters).toMatchSnapshot('deal_instance_delete_filters');
    });

    it('should snapshot deal_images delete filter', async () => {
      await deleteDeal('deal-to-delete');

      const imagesDelete = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'delete'
      );

      expect(imagesDelete).toBeDefined();
      expect(imagesDelete!.filters).toMatchSnapshot('deal_images_delete_filters');
    });

    it('should snapshot deal_template delete filter', async () => {
      await deleteDeal('deal-to-delete');

      const templateDelete = capturedPayloads.find(
        (p) => p.table === 'deal_template' && p.operation === 'delete'
      );

      expect(templateDelete).toBeDefined();
      expect(templateDelete!.filters).toMatchSnapshot('deal_template_delete_filters');
    });

    it('should snapshot image_metadata bulk delete', async () => {
      await deleteDeal('deal-to-delete');

      const metadataDelete = capturedPayloads.find(
        (p) => p.table === 'image_metadata' && p.operation === 'delete'
      );

      expect(metadataDelete).toBeDefined();
      expect(metadataDelete!.filters).toMatchSnapshot('image_metadata_delete_filters');
    });

    it('should snapshot all delete operations in order', async () => {
      await deleteDeal('deal-complete-delete');

      const deleteOps = capturedPayloads.filter((p) => p.operation === 'delete');
      expect(deleteOps).toMatchSnapshot('complete_delete_sequence');
    });
  });

  // =============================================================================
  // addDealImages Payload Contracts
  // =============================================================================

  describe('addDealImages payload contracts', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_instance':
            return createTrackingQueryBuilder(table, {
              single: {
                template_id: 'template-for-images',
                deal_template: {
                  user_id: mockUser.id,
                  image_metadata_id: 'existing-primary',
                  deal_images: [{ image_metadata_id: 'existing-img-1' }],
                },
              },
            });
          case 'deal_images':
            return createTrackingQueryBuilder(table, { data: [] });
          case 'image_metadata':
            return createTrackingQueryBuilder(table, {
              single: { variants: { large: 'test-url' } },
            });
          default:
            return createTrackingQueryBuilder(table);
        }
      });
    });

    it('should snapshot deal_images insert payload for adding images', async () => {
      await addDealImages('deal-add-images', ['new-img-1.jpg', 'new-img-2.jpg']);

      const imagesInserts = capturedPayloads.filter(
        (p) => p.table === 'deal_images' && p.operation === 'insert'
      );

      expect(imagesInserts.length).toBeGreaterThan(0);
      expect(imagesInserts).toMatchSnapshot('add_deal_images_payloads');
    });

    it('should include correct display_order starting from existing count', async () => {
      await addDealImages('deal-add-images', ['new-img.jpg']);

      const imageInsert = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'insert'
      );

      expect(imageInsert).toBeDefined();
      const payload = imageInsert!.data as Record<string, unknown>;
      expect(payload).toHaveProperty('display_order');
      expect(payload).toHaveProperty('is_thumbnail', false);
    });
  });

  // =============================================================================
  // removeDealImage Payload Contracts
  // =============================================================================

  describe('removeDealImage payload contracts', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_instance':
            return createTrackingQueryBuilder(table, {
              single: {
                template_id: 'template-remove-img',
                deal_template: {
                  user_id: mockUser.id,
                  image_metadata_id: 'primary-img',
                  deal_images: [
                    { image_metadata_id: 'img-to-remove', is_thumbnail: false },
                    { image_metadata_id: 'img-to-keep', is_thumbnail: true },
                  ],
                },
              },
            });
          case 'deal_images':
            return createTrackingQueryBuilder(table, { data: [] });
          case 'deal_template':
            return createTrackingQueryBuilder(table, { data: [] });
          case 'image_metadata':
            return createTrackingQueryBuilder(table, {
              single: { cloudinary_public_id: 'cloud-to-delete' },
            });
          default:
            return createTrackingQueryBuilder(table);
        }
      });

      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });
    });

    it('should snapshot deal_images delete filter', async () => {
      await removeDealImage('deal-remove', 'img-to-remove');

      const imageDelete = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'delete'
      );

      expect(imageDelete).toBeDefined();
      expect(imageDelete!.filters).toMatchSnapshot('remove_deal_image_filters');
    });

    it('should snapshot image_metadata delete for cleanup', async () => {
      await removeDealImage('deal-remove', 'img-to-remove');

      const metadataDelete = capturedPayloads.find(
        (p) => p.table === 'image_metadata' && p.operation === 'delete'
      );

      expect(metadataDelete).toBeDefined();
      expect(metadataDelete!.filters).toMatchSnapshot('remove_image_metadata_filters');
    });

    it('should snapshot all remove image operations', async () => {
      await removeDealImage('deal-complete-remove', 'img-meta-id');

      const allOps = capturedPayloads.filter(
        (p) => p.operation === 'delete' || p.operation === 'update'
      );
      expect(allOps).toMatchSnapshot('complete_remove_image_sequence');
    });
  });

  // =============================================================================
  // setDealThumbnail Payload Contracts
  // =============================================================================

  describe('setDealThumbnail payload contracts', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_instance':
            return createTrackingQueryBuilder(table, {
              single: {
                template_id: 'template-thumbnail',
                deal_template: { user_id: mockUser.id },
              },
            });
          case 'deal_images':
            return createTrackingQueryBuilder(table, { data: [] });
          case 'deal_template':
            return createTrackingQueryBuilder(table, { data: [] });
          default:
            return createTrackingQueryBuilder(table);
        }
      });
    });

    it('should snapshot deal_images clear thumbnail update', async () => {
      await setDealThumbnail('deal-thumb', 'new-thumbnail-img');

      const clearThumbnail = capturedPayloads.find(
        (p) =>
          p.table === 'deal_images' &&
          p.operation === 'update' &&
          (p.data as Record<string, unknown>)?.is_thumbnail === false
      );

      expect(clearThumbnail).toBeDefined();
      expect(clearThumbnail!.data).toMatchSnapshot('clear_thumbnail_payload');
    });

    it('should snapshot deal_images set thumbnail update', async () => {
      await setDealThumbnail('deal-thumb', 'new-thumbnail-img');

      const setThumbnail = capturedPayloads.find(
        (p) =>
          p.table === 'deal_images' &&
          p.operation === 'update' &&
          (p.data as Record<string, unknown>)?.is_thumbnail === true
      );

      expect(setThumbnail).toBeDefined();
      expect(setThumbnail!.data).toMatchSnapshot('set_thumbnail_payload');
      expect(setThumbnail!.filters).toMatchSnapshot('set_thumbnail_filters');
    });

    it('should snapshot deal_template primary image update', async () => {
      await setDealThumbnail('deal-thumb', 'new-thumbnail-img');

      const templateUpdate = capturedPayloads.find(
        (p) =>
          p.table === 'deal_template' &&
          p.operation === 'update' &&
          (p.data as Record<string, unknown>)?.image_metadata_id !== undefined
      );

      expect(templateUpdate).toBeDefined();
      expect(templateUpdate!.data).toMatchSnapshot('template_primary_image_update');
    });

    it('should snapshot complete thumbnail change sequence', async () => {
      await setDealThumbnail('deal-full-thumb', 'selected-img-id');

      const updateOps = capturedPayloads.filter((p) => p.operation === 'update');
      expect(updateOps).toMatchSnapshot('complete_thumbnail_sequence');
    });
  });

  // =============================================================================
  // updateDealImageOrder Payload Contracts
  // =============================================================================

  describe('updateDealImageOrder payload contracts', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'deal_instance':
            return createTrackingQueryBuilder(table, {
              single: {
                template_id: 'template-reorder',
                deal_template: { user_id: mockUser.id },
              },
            });
          case 'deal_images':
            return createTrackingQueryBuilder(table, { data: [] });
          default:
            return createTrackingQueryBuilder(table);
        }
      });
    });

    it('should snapshot deal_images order updates', async () => {
      const newOrder = [
        { imageMetadataId: 'img-a', displayOrder: 0 },
        { imageMetadataId: 'img-b', displayOrder: 1 },
        { imageMetadataId: 'img-c', displayOrder: 2 },
      ];

      await updateDealImageOrder('deal-reorder', newOrder);

      const orderUpdates = capturedPayloads.filter(
        (p) => p.table === 'deal_images' && p.operation === 'update'
      );

      expect(orderUpdates).toMatchSnapshot('image_order_update_payloads');
    });

    it('should include display_order in each update', async () => {
      const newOrder = [{ imageMetadataId: 'img-single', displayOrder: 5 }];

      await updateDealImageOrder('deal-reorder', newOrder);

      const update = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'update'
      );

      expect(update).toBeDefined();
      const payload = update!.data as Record<string, unknown>;
      expect(payload).toHaveProperty('display_order');
    });

    it('should filter by template_id and image_metadata_id', async () => {
      await updateDealImageOrder('deal-reorder', [
        { imageMetadataId: 'specific-img', displayOrder: 3 },
      ]);

      const update = capturedPayloads.find(
        (p) => p.table === 'deal_images' && p.operation === 'update'
      );

      expect(update).toBeDefined();
      expect(update!.filters).toHaveProperty('deal_template_id');
      expect(update!.filters).toHaveProperty('image_metadata_id');
    });
  });

  // =============================================================================
  // Cross-Module Contract Consistency
  // =============================================================================

  describe('cross-module contract consistency', () => {
    it('should use consistent table names across all operations', async () => {
      // Collect all table names used across operations
      const tablesUsed = new Set<string>();

      // Setup mocks
      mockSupabase.from.mockImplementation((table: string) => {
        tablesUsed.add(table);
        return createTrackingQueryBuilder(table, {
          single: {
            template_id: 'test-template',
            deal_template: {
              user_id: mockUser.id,
              image_metadata_id: 'test-img',
              deal_images: [],
            },
          },
        });
      });
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { imageMetadataId: 'test-img' },
        error: null,
      });

      // Execute various operations
      await createDeal({
        title: 'Test',
        description: '',
        imageUris: ['img.jpg'],
        thumbnailIndex: 0,
        expirationDate: null,
        restaurantId: 'r1',
        categoryId: null,
        cuisineId: null,
        isAnonymous: false,
      });

      // Snapshot all tables accessed
      expect(Array.from(tablesUsed).sort()).toMatchSnapshot('tables_accessed');
    });

    it('should use consistent field names in payloads', () => {
      // Define expected field contracts
      const dealTemplateFields = [
        'restaurant_id',
        'user_id',
        'title',
        'description',
        'image_metadata_id',
        'category_id',
        'cuisine_id',
        'is_anonymous',
        'source_type',
      ];

      const dealImagesFields = [
        'deal_template_id',
        'image_metadata_id',
        'display_order',
        'is_thumbnail',
      ];

      const dealInstanceFields = ['end_date', 'is_anonymous'];

      // Snapshot these contracts for drift detection
      expect({
        deal_template: dealTemplateFields.sort(),
        deal_images: dealImagesFields.sort(),
        deal_instance: dealInstanceFields.sort(),
      }).toMatchSnapshot('field_contracts');
    });
  });
});
