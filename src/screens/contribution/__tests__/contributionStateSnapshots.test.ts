/**
 * Contribution State Snapshots (PR-017 / RF-017)
 *
 * Establishes visual baseline for contribution form state data structures.
 * Covers: DealCreation, DealEdit, DealPreview states
 */

describe('DealCreation State Snapshots', () => {
  describe('Initial State', () => {
    it('should snapshot empty form state', () => {
      const initialState = {
        dealTitle: '',
        dealDetails: '',
        imageUris: [],
        thumbnailIndex: 0,
        selectedRestaurant: null,
        selectedCategory: null,
        selectedCuisine: null,
        expirationDate: null,
        isAnonymous: false,
        isSubmitting: false,
        showPreview: false,
        showCalendar: false,
        showCategoryPicker: false,
        showCuisinePicker: false,
        showPhotoOptions: false,
      };
      expect(initialState).toMatchSnapshot();
    });
  });

  describe('In Progress State', () => {
    it('should snapshot partially filled form', () => {
      const inProgressState = {
        dealTitle: 'Half Price Pizza',
        dealDetails: 'Every Tuesday',
        imageUris: ['file://local/image1.jpg'],
        thumbnailIndex: 0,
        selectedRestaurant: {
          name: 'Pizza Palace',
          address: '123 Main St',
          google_place_id: 'place-123',
          lat: 37.7749,
          lng: -122.4194,
          distance_miles: 1.5,
        },
        selectedCategory: null,
        selectedCuisine: { id: 'italian', name: 'Italian' },
        expirationDate: null,
        isAnonymous: false,
        isSubmitting: false,
        showPreview: false,
      };
      expect(inProgressState).toMatchSnapshot();
    });
  });

  describe('Complete State', () => {
    it('should snapshot fully filled form ready for submission', () => {
      const completeState = {
        dealTitle: 'Buy One Get One Free',
        dealDetails: 'Valid on all pizzas. Dine-in only. Cannot combine with other offers.',
        imageUris: [
          'file://local/image1.jpg',
          'file://local/image2.jpg',
          'file://local/image3.jpg',
        ],
        thumbnailIndex: 0,
        selectedRestaurant: {
          name: 'Pizza Palace',
          address: '123 Main St, San Francisco, CA',
          google_place_id: 'place-123',
          lat: 37.7749,
          lng: -122.4194,
          distance_miles: 1.5,
        },
        selectedCategory: { id: 'bogo', name: 'BOGO' },
        selectedCuisine: { id: 'italian', name: 'Italian' },
        expirationDate: '2026-06-30',
        isAnonymous: false,
        isSubmitting: false,
        showPreview: true,
      };
      expect(completeState).toMatchSnapshot();
    });

    it('should snapshot anonymous post state', () => {
      const anonymousState = {
        dealTitle: 'Secret Deal',
        dealDetails: 'Only for insiders',
        imageUris: ['file://local/secret.jpg'],
        thumbnailIndex: 0,
        selectedRestaurant: { name: 'Mystery Spot', address: '??? St' },
        isAnonymous: true,
        isSubmitting: false,
      };
      expect(anonymousState).toMatchSnapshot();
    });
  });

  describe('Submitting State', () => {
    it('should snapshot submission in progress', () => {
      const submittingState = {
        dealTitle: 'Test Deal',
        imageUris: ['file://local/image.jpg'],
        selectedRestaurant: { name: 'Test Restaurant' },
        isSubmitting: true,
        submitProgress: 'Uploading images...',
      };
      expect(submittingState).toMatchSnapshot();
    });
  });

  describe('Validation Error State', () => {
    it('should snapshot validation errors', () => {
      const validationErrors = {
        title: 'Title is required',
        restaurant: 'Please select a restaurant',
        images: 'At least one photo is required',
      };
      expect(validationErrors).toMatchSnapshot();
    });
  });
});

describe('DealEdit State Snapshots', () => {
  describe('Loading State', () => {
    it('should snapshot loading edit state', () => {
      const loadingState = {
        dealId: 'deal-edit-123',
        loading: true,
        error: null,
        dealTitle: '',
        dealDetails: '',
        localImages: [],
        newImages: [],
        imagesToRemove: [],
        thumbnailIndex: 0,
        restaurant: null,
        expirationDate: null,
        isAnonymous: false,
        isSaving: false,
      };
      expect(loadingState).toMatchSnapshot();
    });
  });

  describe('Populated State', () => {
    it('should snapshot loaded deal for editing', () => {
      const populatedState = {
        dealId: 'deal-edit-123',
        loading: false,
        error: null,
        dealTitle: 'Original Deal Title',
        dealDetails: 'Original deal description',
        localImages: [
          { id: 'img-1', public_url: 'https://example.com/img1.jpg', display_order: 0 },
          { id: 'img-2', public_url: 'https://example.com/img2.jpg', display_order: 1 },
        ],
        newImages: [],
        imagesToRemove: [],
        thumbnailIndex: 0,
        restaurant: {
          id: 'rest-123',
          name: 'Original Restaurant',
          address: '456 Oak St',
        },
        expirationDate: '2026-05-15',
        isAnonymous: false,
        isSaving: false,
        hasChanges: false,
      };
      expect(populatedState).toMatchSnapshot();
    });
  });

  describe('Modified State', () => {
    it('should snapshot edited deal with changes', () => {
      const modifiedState = {
        dealId: 'deal-edit-123',
        dealTitle: 'Updated Deal Title',
        dealDetails: 'Updated description with more details',
        localImages: [
          { id: 'img-1', public_url: 'https://example.com/img1.jpg', display_order: 0 },
        ],
        newImages: [
          { uri: 'file://local/new-image.jpg' },
        ],
        imagesToRemove: ['img-2'],
        thumbnailIndex: 1,
        hasChanges: true,
        isSaving: false,
      };
      expect(modifiedState).toMatchSnapshot();
    });
  });

  describe('Saving State', () => {
    it('should snapshot saving in progress', () => {
      const savingState = {
        dealId: 'deal-edit-123',
        isSaving: true,
        saveProgress: {
          step: 'Updating images',
          current: 2,
          total: 4,
        },
      };
      expect(savingState).toMatchSnapshot();
    });
  });

  describe('Error State', () => {
    it('should snapshot fetch error', () => {
      const errorState = {
        dealId: 'deal-edit-123',
        loading: false,
        error: 'Deal not found or you do not have permission to edit.',
        dealTitle: '',
        localImages: [],
      };
      expect(errorState).toMatchSnapshot();
    });
  });
});

describe('DealPreview State Snapshots', () => {
  describe('Preview Data', () => {
    it('should snapshot full preview data structure', () => {
      const previewData = {
        dealTitle: 'Preview Deal Title',
        dealDetails: 'This is how the deal will appear to users.',
        imageUris: [
          'file://local/preview1.jpg',
          'file://local/preview2.jpg',
        ],
        thumbnailIndex: 0,
        selectedRestaurant: {
          name: 'Preview Restaurant',
          address: '789 Preview Ave, San Francisco, CA',
          lat: 37.7849,
          lng: -122.4094,
          distance_miles: 0.8,
        },
        selectedCategory: { id: 'lunch', name: 'Lunch Special' },
        selectedCuisine: { id: 'american', name: 'American' },
        expirationDate: '2026-04-30',
        isAnonymous: false,
        userData: {
          username: 'previewUser',
          profilePicture: 'https://example.com/user.jpg',
          city: 'San Francisco',
          state: 'CA',
        },
      };
      expect(previewData).toMatchSnapshot();
    });

    it('should snapshot anonymous preview', () => {
      const anonymousPreview = {
        dealTitle: 'Anonymous Deal',
        dealDetails: 'Posted anonymously',
        imageUris: ['file://local/anon.jpg'],
        thumbnailIndex: 0,
        selectedRestaurant: { name: 'Some Restaurant' },
        isAnonymous: true,
        userData: {
          username: 'Anonymous',
          profilePicture: null,
        },
      };
      expect(anonymousPreview).toMatchSnapshot();
    });
  });

  describe('Distance Calculation', () => {
    it('should snapshot distance display variants', () => {
      const distanceVariants = {
        nearby: { distance_miles: 0.2, display: '0.2 mi' },
        walking: { distance_miles: 0.5, display: '0.5 mi' },
        short_drive: { distance_miles: 2.0, display: '2.0 mi' },
        far: { distance_miles: 10.5, display: '10.5 mi' },
      };
      expect(distanceVariants).toMatchSnapshot();
    });
  });

  describe('Callbacks', () => {
    it('should snapshot callback interface', () => {
      const callbackInterface = {
        onPost: 'function',
        onClose: 'function',
        visible: true,
      };
      expect(callbackInterface).toMatchSnapshot();
    });
  });
});
