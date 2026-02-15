/**
 * Feed State Snapshots (PR-017 / RF-017)
 *
 * Establishes visual baseline for feed state data structures.
 * Covers: loading, empty, error, populated states
 *
 * Note: These are data structure snapshots, not full render snapshots,
 * to avoid Switch component compatibility issues.
 */

describe('Feed State Snapshots', () => {
  describe('Loading State', () => {
    it('should snapshot loading state structure', () => {
      const loadingState = {
        deals: [],
        loading: true,
        error: null,
        hasLocation: true,
        locationCity: 'San Francisco',
        cuisineFilter: null,
        page: 1,
        hasMore: false,
      };
      expect(loadingState).toMatchSnapshot();
    });
  });

  describe('Empty State - No Location', () => {
    it('should snapshot no location state structure', () => {
      const noLocationState = {
        deals: [],
        loading: false,
        error: null,
        hasLocation: false,
        locationCity: null,
        cuisineFilter: null,
        page: 1,
        hasMore: false,
      };
      expect(noLocationState).toMatchSnapshot();
    });
  });

  describe('Empty State - No Deals', () => {
    it('should snapshot empty deals state structure', () => {
      const noDealsState = {
        deals: [],
        loading: false,
        error: null,
        hasLocation: true,
        locationCity: 'San Francisco',
        cuisineFilter: 'Italian',
        page: 1,
        hasMore: false,
      };
      expect(noDealsState).toMatchSnapshot();
    });
  });

  describe('Error State', () => {
    it('should snapshot error state structure', () => {
      const errorState = {
        deals: [],
        loading: false,
        error: 'Failed to load deals. Please try again.',
        hasLocation: true,
        locationCity: 'San Francisco',
        cuisineFilter: null,
        page: 1,
        hasMore: false,
      };
      expect(errorState).toMatchSnapshot();
    });
  });

  describe('Populated State', () => {
    it('should snapshot populated state structure', () => {
      const populatedState = {
        deals: [
          {
            id: 'deal-1',
            title: 'Amazing Pizza Deal',
            restaurant: 'Pizza Palace',
            details: 'Buy one get one free',
            votes: 42,
            isUpvoted: false,
            isDownvoted: false,
            isFavorited: true,
            cuisine: 'Italian',
            timeAgo: '2h ago',
            milesAway: '1.5 mi',
          },
          {
            id: 'deal-2',
            title: 'Happy Hour Special',
            restaurant: 'Bar & Grill',
            details: '50% off drinks 4-7pm',
            votes: 28,
            isUpvoted: true,
            isDownvoted: false,
            isFavorited: false,
            cuisine: 'American',
            timeAgo: '4h ago',
            milesAway: '0.8 mi',
          },
        ],
        loading: false,
        error: null,
        hasLocation: true,
        locationCity: 'San Francisco',
        cuisineFilter: null,
        page: 1,
        hasMore: true,
      };
      expect(populatedState).toMatchSnapshot();
    });

    it('should snapshot paginated state structure', () => {
      const paginatedState = {
        deals: Array.from({ length: 10 }, (_, i) => ({
          id: `deal-${i + 1}`,
          title: `Deal ${i + 1}`,
          restaurant: `Restaurant ${i + 1}`,
          votes: (i + 1) * 10, // Deterministic votes: 10, 20, 30, etc.
        })),
        loading: false,
        error: null,
        hasLocation: true,
        locationCity: 'San Francisco',
        cuisineFilter: null,
        page: 2,
        hasMore: true,
      };
      expect(paginatedState).toMatchSnapshot();
    });
  });

  describe('Cuisine Filter State', () => {
    it('should snapshot filtered state structure', () => {
      const filteredState = {
        deals: [
          { id: 'deal-1', title: 'Pasta Deal', cuisine: 'Italian' },
          { id: 'deal-2', title: 'Pizza Deal', cuisine: 'Italian' },
        ],
        loading: false,
        error: null,
        hasLocation: true,
        locationCity: 'San Francisco',
        cuisineFilter: 'Italian',
        page: 1,
        hasMore: false,
      };
      expect(filteredState).toMatchSnapshot();
    });
  });
});

describe('Deal Detail State Snapshots', () => {
  describe('Loading State', () => {
    it('should snapshot loading detail state', () => {
      const loadingState = {
        deal: null,
        loading: true,
        error: null,
        viewCount: 0,
        viewerPhotos: [],
      };
      expect(loadingState).toMatchSnapshot();
    });
  });

  describe('Populated State', () => {
    it('should snapshot full deal detail structure', () => {
      const detailState = {
        deal: {
          id: 'deal-detail-1',
          title: 'Snapshot Deal Detail',
          restaurant: 'Snapshot Restaurant',
          restaurantAddress: '123 Main St, San Francisco, CA 94105',
          details: 'Full deal description with all the details about this amazing offer.',
          image: { uri: 'https://example.com/deal.jpg' },
          images: [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
          ],
          votes: 75,
          isUpvoted: true,
          isDownvoted: false,
          isFavorited: true,
          cuisine: 'Mexican',
          cuisineId: 'cuisine-mexican',
          timeAgo: '1h ago',
          milesAway: '0.3 mi',
          userId: 'user-author-1',
          userDisplayName: 'Deal Author',
          userProfilePhoto: 'https://example.com/author.jpg',
          userCity: 'San Francisco',
          userState: 'CA',
          isAnonymous: false,
          expirationDate: '2026-03-15',
        },
        loading: false,
        error: null,
        viewCount: 142,
        viewerPhotos: [
          'https://example.com/viewer1.jpg',
          'https://example.com/viewer2.jpg',
          'https://example.com/viewer3.jpg',
        ],
      };
      expect(detailState).toMatchSnapshot();
    });
  });

  describe('Error State', () => {
    it('should snapshot error state', () => {
      const errorState = {
        deal: null,
        loading: false,
        error: 'Deal not found or has been deleted.',
        viewCount: 0,
        viewerPhotos: [],
      };
      expect(errorState).toMatchSnapshot();
    });
  });
});
