import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileCacheService } from '../services/profileCacheService';
import { loadCriticalProfileData, updateUserProfileCache } from '../services/profileLoadingService';
import { UserProfileCache } from '../services/userProfileService';
import { fetchUserPosts, deleteDeal, transformDealForUI } from '../services/dealService';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../services/voteService';
import { logClick } from '../services/interactionService';
import { 
  uploadProfilePhoto, handleTakePhoto, handleChooseFromLibrary, handleUserLogout, handleAccountDeletion 
} from '../services/profileActionsService';
import { 
  formatJoinDate, getDisplayName, getUsernameFontSize, showProfilePhotoOptions, showDeleteAccountConfirmation 
} from '../services/profileUtilsService';
import { useDealUpdate } from './useDealUpdate';
import { useFavorites } from './useFavorites';

// Types kept intentionally broad to avoid tight coupling; can refine later
export interface UseProfileParams {
  navigation: any; // React Navigation object
  route: any;      // Route (expects params viewUser?: boolean, userId?: string)
}

export interface UseProfileResult {
  // Data
  profile: any | null;
  photoUrl: string | null;
  dealCount: number;
  userPosts: any[];
  hasData: boolean;
  activeTab: 'posts' | 'settings';
  postsLoading: boolean;
  postsError: string | null;
  displayName: string;
  joinDateText: string;
  locationCity: string;
  isViewingOtherUser: boolean;
  // UI state
  showLogoutModal: boolean;
  showDeleteModal: boolean;
  // Handlers
  setActiveTab: (tab: 'posts' | 'settings') => void;
  onRetryLoadPosts: () => void;
  onUpvote: (dealId: string) => void;
  onDownvote: (dealId: string) => void;
  onFavorite: (dealId: string) => void;
  onDealPress: (dealId: string) => void;
  onDeletePost: (dealId: string) => void;
  onEditProfile: () => void;
  onProfilePhotoPress: () => void;
  onProfileTabReselect: () => void;
  onShareProfile: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  confirmLogout: () => Promise<void>;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  confirmDeleteAccount: () => Promise<void>;
}

// Hook encapsulating all profile/business logic previously in the screen
export const useProfile = ({ navigation, route }: UseProfileParams): UseProfileResult => {
  const { viewUser, userId } = (route?.params as any) || {};
  const [profile, setProfile] = useState<any | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);
  const [dealCount, setDealCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, UserProfileCache>>(new Map());
  const postsLoadedRef = useRef(false);
  const { postAdded, setPostAdded } = useDealUpdate();
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  // ---------- Data Loading (current user) ----------
  const loadProfileData = useCallback(async () => {
    try {
      // 1) Show cached immediately (if any)
      const cached = await ProfileCacheService.getCachedProfile();
      if (cached) {
        setProfile(cached.profile);
        setPhotoUrl(cached.photoUrl);
        setCurrentUserPhotoUrl(cached.photoUrl);
        setDealCount(cached.dealCount);
        setHasData(true);
      }
      // 2) Then fetch fresh in background and overwrite state/cache
      const freshData = await ProfileCacheService.fetchFreshProfile();
      if (freshData) {
        setProfile(freshData.profile);
        setPhotoUrl(freshData.photoUrl);
        setCurrentUserPhotoUrl(freshData.photoUrl);
        setDealCount(freshData.dealCount);
        await ProfileCacheService.setCachedProfile(
          freshData.profile,
          freshData.photoUrl,
          freshData.dealCount
        );
      }
      if (!cached) setHasData(true);
    } catch (err) {
      console.error('Error loading profile:', err);
      setHasData(true);
    }
  }, []);

  // ---------- Data Loading (other user) ----------
  const loadOtherUserProfile = useCallback(async (targetUserId: string) => {
    try {
      setPostsLoading(true); // We'll load posts in phases
      const criticalData = await loadCriticalProfileData(targetUserId, currentUserPhotoUrl);
      setProfile(criticalData.profile);
      setPhotoUrl(criticalData.photoUrl);
      setCurrentUserPhotoUrl(criticalData.currentUserPhotoUrl || null);
      setUserData(criticalData.userData);
      setDealCount(criticalData.dealCount);
      setHasData(true);
      // Posts in background
      try {
        const { fetchUserPosts } = await import('../services/userPostsService');
        const posts = await fetchUserPosts(targetUserId, 20);
        const { updatePostsWithUserInfo } = await import('../services/userPostsService');
        const updatedPosts = updatePostsWithUserInfo(posts, criticalData.userData.username, criticalData.photoUrl);
        setUserPosts(updatedPosts);
        const cacheData = {
          profile: criticalData.profile,
          photoUrl: criticalData.photoUrl,
          dealCount: criticalData.dealCount,
          userData: criticalData.userData,
          userPosts: updatedPosts
        } as any;
        setUserProfileCache(prev => updateUserProfileCache(prev, targetUserId, cacheData));
      } catch (postsErr) {
        console.error('Error loading other user posts (non-critical):', postsErr);
      } finally {
        setPostsLoading(false);
      }
    } catch (err) {
      console.error('Error loading other user profile:', err);
      Alert.alert('Error', 'Could not load user profile');
      setPostsLoading(false);
    }
  }, [currentUserPhotoUrl]);

  // Initial load
  useEffect(() => {
    if (viewUser && userId) {
      loadOtherUserProfile(userId);
    } else {
      loadProfileData();
    }
    // Intentionally exclude function identities to avoid effect re-triggers on state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewUser, userId]);

  // Focus refresh
  useFocusEffect(
    useCallback(() => {
      if (!hasData) {
        loadProfileData();
      }
    }, [hasData, loadProfileData])
  );

  // Refresh after post added & for current user only
  const refreshProfile = useCallback(async () => {
    const freshData = await ProfileCacheService.forceRefresh();
    if (!freshData) return;
    // Only update if something actually changed
    const samePhoto = freshData.photoUrl === photoUrl;
    const sameDeals = freshData.dealCount === dealCount;
    const sameProfile = JSON.stringify(freshData.profile) === JSON.stringify(profile);
    if (samePhoto && sameDeals && sameProfile) return;
    setProfile(freshData.profile);
    setPhotoUrl(freshData.photoUrl);
    setCurrentUserPhotoUrl(freshData.photoUrl);
    setDealCount(freshData.dealCount);
  }, [photoUrl, dealCount, profile]);

  // Defer focus logic that depends on loadUserPosts until after its declaration

  // Load posts for current user (lazy)
  const loadUserPosts = useCallback(async () => {
    try {
      if (viewUser) return; // Skip for viewing other user
      if (postsLoading) return; // Prevent duplicate loads
      setPostsLoading(true);
      setPostsError(null);
      const posts = await fetchUserPosts();
      const transformed = posts.map(transformDealForUI);
      const unique = Array.from(new Map(transformed.map(p => [p.id, p])).values());
      setUserPosts(unique);
    } catch (err) {
      console.error('Error loading user posts:', err);
      setPostsError('Failed to load your posts');
    } finally {
      setPostsLoading(false);
    }
  }, [viewUser, postsLoading]);

  // Lazy load effect
  useEffect(() => {
    if (activeTab === 'posts' && hasData && !viewUser && !postsLoadedRef.current) {
      postsLoadedRef.current = true;
      loadUserPosts();
    }
  }, [activeTab, hasData, viewUser, loadUserPosts]);

  // Reset postsLoadedRef when screen unmounts/loses focus
  useFocusEffect(
    useCallback(() => {
      return () => { postsLoadedRef.current = false; };
    }, [])
  );

  // Focus-triggered refresh and post-added handling
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        if (postAdded) {
          await loadUserPosts();
          if (!cancelled) setPostAdded(false);
        }
        if (!viewUser) {
          await refreshProfile();
        }
      };
      run();
      return () => { cancelled = true; };
    }, [viewUser, postAdded, refreshProfile, loadUserPosts, setPostAdded])
  );

  // ---------- Optimistic vote/favorite handlers ----------
  const onUpvote = (dealId: string) => {
    let original: any | undefined;
    setUserPosts(prev => prev.map(d => {
      if (d.id === dealId) {
        original = d;
        const wasUp = d.isUpvoted; const wasDown = d.isDownvoted;
        return { ...d, isUpvoted: !wasUp, isDownvoted: false, votes: wasUp ? d.votes - 1 : (wasDown ? d.votes + 2 : d.votes + 1) };
      }
      return d;
    }));
    toggleUpvote(dealId).catch(err => {
      console.error('Failed upvote revert', err);
      if (original) setUserPosts(prev => prev.map(d => d.id === dealId ? original! : d));
    });
  };

  const onDownvote = (dealId: string) => {
    let original: any | undefined;
    setUserPosts(prev => prev.map(d => {
      if (d.id === dealId) {
        original = d;
        const wasDown = d.isDownvoted; const wasUp = d.isUpvoted;
        return { ...d, isDownvoted: !wasDown, isUpvoted: false, votes: wasDown ? d.votes + 1 : (wasUp ? d.votes - 2 : d.votes - 1) };
      }
      return d;
    }));
    toggleDownvote(dealId).catch(err => {
      console.error('Failed downvote revert', err);
      if (original) setUserPosts(prev => prev.map(d => d.id === dealId ? original! : d));
    });
  };

  const onFavorite = (dealId: string) => {
    const original = userPosts.find(d => d.id === dealId);
    if (!original) return;
    const wasFav = original.isFavorited;
    
    // 1. Optimistic UI update
    setUserPosts(prev => prev.map(d => d.id === dealId ? { ...d, isFavorited: !wasFav } : d));
    
    // 2. Notify global store for instant favorites page update
    if (wasFav) {
      markAsUnfavorited(dealId, 'deal');
    } else {
      markAsFavorited(dealId, 'deal', {
        id: original.id,
        title: original.title,
        description: original.details || '',
        imageUrl: typeof original.image === 'object' ? original.image.uri : '',
        restaurantName: original.restaurant,
        restaurantAddress: original.restaurantAddress || '',
        distance: original.milesAway || '',
        userId: original.userId,
        userDisplayName: original.userDisplayName,
        userProfilePhoto: original.userProfilePhoto,
        isAnonymous: original.isAnonymous,
        favoritedAt: new Date().toISOString(),
      });
    }
    
    // 3. Background database save
    toggleFavorite(dealId, wasFav).catch(err => {
      console.error('Failed favorite revert', err);
      if (original) setUserPosts(prev => prev.map(d => d.id === dealId ? original : d));
    });
  };

  // ---------- Deal & post actions ----------
  const onDealPress = (dealId: string) => {
    const selected = userPosts.find(d => d.id === dealId);
    if (!selected) return;
    const pos = userPosts.findIndex(d => d.id === dealId);
    logClick(dealId, 'profile', pos >= 0 ? pos : undefined).catch(() => {});
    navigation.navigate('DealDetail', { deal: selected });
  };

  const onDeletePost = (dealId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const result = await deleteDeal(dealId);
          if (result.success) {
            setUserPosts(prev => prev.filter(p => p.id !== dealId));
            setDealCount(prev => Math.max(0, prev - 1));
            Alert.alert('Success', 'Post deleted successfully');
          } else {
            Alert.alert('Error', result.error || 'Failed to delete post');
          }
        } catch (err) {
          console.error('Error deleting post:', err);
          Alert.alert('Error', 'An unexpected error occurred');
        }
      }}
    ]);
  };

  // ---------- Profile actions ----------
  const onEditProfile = () => {
    if (!profile || !profile.user_id) {
      Alert.alert('Error', 'Profile data not available. Please try again.');
      return;
    }
    navigation.navigate('ProfileEdit', { profile });
  };

  const uploadPhoto = async (uri: string) => {
    await uploadProfilePhoto(uri, profile, setPhotoUrl, setCurrentUserPhotoUrl, refreshProfile);
  };

  const onProfilePhotoPress = () => {
    if (viewUser) return; // Only own profile
    showProfilePhotoOptions(() => handleTakePhoto(uploadPhoto), () => handleChooseFromLibrary(uploadPhoto));
  };

  const onProfileTabReselect = () => {
    if (viewUser) {
      // Reset to current user
      setProfile(null); setPhotoUrl(null); setUserData(null); setUserPosts([]); setDealCount(0); setHasData(false);
      loadProfileData();
    }
  };

  const onShareProfile = async () => {
    try {
      const displayName = getDisplayName(userData, profile);
      const message = viewUser ? `Check out ${displayName}'s profile on ImHungri!` : `Check out my profile on ImHungri!`;
      await Share.share({ message });
    } catch (err) {
      console.error('Error sharing profile:', err);
      Alert.alert('Error', 'Could not share profile');
    }
  };

  // ---------- Auth / account modals ----------
  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const confirmLogout = async () => { closeLogoutModal(); await handleUserLogout(); };

  const openDeleteModal = () => setShowDeleteModal(true);
  const closeDeleteModal = () => setShowDeleteModal(false);
  const confirmDeleteAccount = async () => {
    showDeleteAccountConfirmation(async () => {
      closeDeleteModal();
      const success = await handleAccountDeletion(profile);
      if (success) navigation.navigate('LogIn');
    }, closeDeleteModal);
  };

  // ---------- Derived values ----------
  const displayName = getDisplayName(userData, profile);
  const joinDateText = formatJoinDate(profile);
  const locationCity = profile?.location_city || 'Location not set';

  return {
    profile,
    photoUrl,
    dealCount,
    userPosts,
    hasData,
    activeTab,
    postsLoading,
    postsError,
    displayName,
    joinDateText,
    locationCity,
    isViewingOtherUser: !!viewUser,
    showLogoutModal,
    showDeleteModal,
    setActiveTab,
    onRetryLoadPosts: loadUserPosts,
    onUpvote,
    onDownvote,
    onFavorite,
    onDealPress,
    onDeletePost,
    onEditProfile,
    onProfilePhotoPress,
    onProfileTabReselect,
    onShareProfile,
    openLogoutModal,
    closeLogoutModal,
    confirmLogout,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteAccount,
  };
};
