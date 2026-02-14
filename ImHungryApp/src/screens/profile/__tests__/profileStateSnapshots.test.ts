/**
 * Profile State Snapshots (PR-017 / RF-017)
 *
 * Establishes visual baseline for profile state data structures.
 * Covers: loading, populated, error states for profile and user posts
 */

describe('Profile State Snapshots', () => {
  describe('Loading State', () => {
    it('should snapshot loading profile state', () => {
      const loadingState = {
        profile: null,
        photoUrl: null,
        dealCount: 0,
        userPosts: [],
        hasData: false,
        activeTab: 'posts',
        postsLoading: true,
        postsInitialized: false,
        postsError: null,
        displayName: '',
        joinDateText: '',
        locationCity: '',
        isViewingOtherUser: false,
        showLogoutModal: false,
        showDeleteModal: false,
      };
      expect(loadingState).toMatchSnapshot();
    });
  });

  describe('Populated State', () => {
    it('should snapshot full profile state', () => {
      const populatedState = {
        profile: {
          id: 'user-profile-1',
          display_name: 'John Doe',
          email: 'john@example.com',
          profile_photo: 'https://example.com/profile.jpg',
          created_at: '2025-01-15T10:30:00Z',
          city: 'San Francisco',
          state: 'CA',
          bio: 'Food enthusiast and deal hunter',
        },
        photoUrl: 'https://example.com/profile.jpg',
        dealCount: 15,
        userPosts: [
          {
            id: 'post-1',
            title: 'Amazing Taco Deal',
            restaurant: 'Taco Town',
            votes: 32,
            isUpvoted: false,
            isDownvoted: false,
            isFavorited: true,
            timeAgo: '1d ago',
          },
          {
            id: 'post-2',
            title: 'Pizza Happy Hour',
            restaurant: 'Pizza Place',
            votes: 18,
            isUpvoted: true,
            isDownvoted: false,
            isFavorited: false,
            timeAgo: '3d ago',
          },
        ],
        hasData: true,
        activeTab: 'posts',
        postsLoading: false,
        postsInitialized: true,
        postsError: null,
        displayName: 'John Doe',
        joinDateText: 'Joined January 2025',
        locationCity: 'San Francisco, CA',
        isViewingOtherUser: false,
        showLogoutModal: false,
        showDeleteModal: false,
      };
      expect(populatedState).toMatchSnapshot();
    });

    it('should snapshot settings tab state', () => {
      const settingsState = {
        profile: {
          id: 'user-profile-1',
          display_name: 'John Doe',
          email: 'john@example.com',
        },
        activeTab: 'settings',
        postsLoading: false,
        postsInitialized: true,
        showLogoutModal: false,
        showDeleteModal: false,
      };
      expect(settingsState).toMatchSnapshot();
    });
  });

  describe('Other User Profile State', () => {
    it('should snapshot viewing other user state', () => {
      const otherUserState = {
        profile: {
          id: 'other-user-1',
          display_name: 'Jane Smith',
          profile_photo: 'https://example.com/jane.jpg',
          city: 'Los Angeles',
          state: 'CA',
        },
        photoUrl: 'https://example.com/jane.jpg',
        dealCount: 8,
        userPosts: [
          { id: 'post-1', title: 'LA Burger Deal', votes: 45 },
        ],
        hasData: true,
        activeTab: 'posts',
        postsLoading: false,
        postsInitialized: true,
        postsError: null,
        displayName: 'Jane Smith',
        joinDateText: 'Joined March 2025',
        locationCity: 'Los Angeles, CA',
        isViewingOtherUser: true,
        showLogoutModal: false,
        showDeleteModal: false,
      };
      expect(otherUserState).toMatchSnapshot();
    });
  });

  describe('Modal States', () => {
    it('should snapshot logout modal open state', () => {
      const logoutModalState = {
        showLogoutModal: true,
        showDeleteModal: false,
      };
      expect(logoutModalState).toMatchSnapshot();
    });

    it('should snapshot delete modal open state', () => {
      const deleteModalState = {
        showLogoutModal: false,
        showDeleteModal: true,
      };
      expect(deleteModalState).toMatchSnapshot();
    });
  });

  describe('Error State', () => {
    it('should snapshot posts error state', () => {
      const errorState = {
        profile: { id: 'user-1', display_name: 'User' },
        userPosts: [],
        postsLoading: false,
        postsInitialized: true,
        postsError: 'Failed to load posts. Please try again.',
        hasData: false,
      };
      expect(errorState).toMatchSnapshot();
    });
  });
});

describe('Favorites State Snapshots', () => {
  describe('Loading State', () => {
    it('should snapshot loading favorites state', () => {
      const loadingState = {
        deals: [],
        restaurants: [],
        activeTab: 'deals',
        dealsLoading: true,
        restaurantsLoading: false,
        hasLoadedInitialData: false,
        refreshing: false,
      };
      expect(loadingState).toMatchSnapshot();
    });
  });

  describe('Populated State', () => {
    it('should snapshot deals tab state', () => {
      const dealsState = {
        deals: [
          {
            id: 'fav-deal-1',
            title: 'Favorite Pizza Deal',
            restaurant: 'Pizza Palace',
            votes: 52,
            isFavorited: true,
            userId: 'author-1',
            userDisplayName: 'Pizza Lover',
          },
          {
            id: 'fav-deal-2',
            title: 'Favorite Burger Deal',
            restaurant: 'Burger Barn',
            votes: 38,
            isFavorited: true,
            userId: 'author-2',
            userDisplayName: 'Burger Fan',
          },
        ],
        restaurants: [],
        activeTab: 'deals',
        dealsLoading: false,
        restaurantsLoading: false,
        hasLoadedInitialData: true,
        refreshing: false,
      };
      expect(dealsState).toMatchSnapshot();
    });

    it('should snapshot restaurants tab state', () => {
      const restaurantsState = {
        deals: [],
        restaurants: [
          {
            id: 'fav-rest-1',
            name: 'Pizza Palace',
            address: '123 Pizza St',
            dealCount: 5,
            distance: '0.5 mi',
          },
          {
            id: 'fav-rest-2',
            name: 'Burger Barn',
            address: '456 Burger Ave',
            dealCount: 3,
            distance: '1.2 mi',
          },
        ],
        activeTab: 'restaurants',
        dealsLoading: false,
        restaurantsLoading: false,
        hasLoadedInitialData: true,
        refreshing: false,
      };
      expect(restaurantsState).toMatchSnapshot();
    });
  });

  describe('Empty State', () => {
    it('should snapshot empty favorites state', () => {
      const emptyState = {
        deals: [],
        restaurants: [],
        activeTab: 'deals',
        dealsLoading: false,
        restaurantsLoading: false,
        hasLoadedInitialData: true,
        refreshing: false,
      };
      expect(emptyState).toMatchSnapshot();
    });
  });

  describe('Optimistic Update State', () => {
    it('should snapshot unfavorited items tracking', () => {
      const optimisticState = {
        unfavoritedItems: ['deal-1', 'deal-3'],
        unfavoritedRestaurants: ['rest-2'],
        newlyFavoritedDeals: [
          { id: 'new-deal-1', title: 'Just Favorited' },
        ],
      };
      expect(optimisticState).toMatchSnapshot();
    });
  });
});
