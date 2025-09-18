import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

interface CachedProfileData {
  profile: any;
  photoUrl: string | null;
  dealCount: number;
  timestamp: number;
}

const PROFILE_CACHE_KEY = 'cached_profile_data';
const PHOTO_URL_CACHE_KEY = 'cached_photo_urls';

export class ProfileCacheService {
  // Show cached data immediately (no expiry check)
  static async getCachedProfile(): Promise<CachedProfileData | null> {
    try {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached profile:', error);
      return null;
    }
  }

  // Cache profile data persistently
  static async setCachedProfile(profile: any, photoUrl: string | null, dealCount: number): Promise<void> {
    try {
      const cacheData: CachedProfileData = {
        profile,
        photoUrl,
        dealCount,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
      
      // Also cache photo URL separately for quick access
      if (photoUrl) {
        const photoCache = await AsyncStorage.getItem(PHOTO_URL_CACHE_KEY) || '{}';
        const photoCacheObj = JSON.parse(photoCache);
        photoCacheObj[profile.user_id] = photoUrl;
        await AsyncStorage.setItem(PHOTO_URL_CACHE_KEY, JSON.stringify(photoCacheObj));
      }
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }

  // Get cached photo URL for a user
  static async getCachedPhotoUrl(userId: string): Promise<string | null> {
    try {
      const photoCache = await AsyncStorage.getItem(PHOTO_URL_CACHE_KEY);
      if (photoCache) {
        const photoCacheObj = JSON.parse(photoCache);
        return photoCacheObj[userId] || null;
      }
    } catch (error) {
      console.error('Error getting cached photo URL:', error);
    }
    return null;
  }

  // Fetch user's deal count
  static async fetchUserDealCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('deal_template')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;  // Use 'count' instead of 'data.length'
    } catch (error) {
      console.error('Error fetching deal count:', error);
      return 0;
    }
  }

  // Fetch fresh data in background (Instagram-style)
  static async fetchFreshProfile(): Promise<{ profile: any; photoUrl: string | null; dealCount: number } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch profile data and deal count in parallel
      const [profileResult, dealCount] = await Promise.all([
        supabase
          .from('user')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        this.fetchUserDealCount(user.id)
      ]);

      if (profileResult.error) throw profileResult.error;
      const profile = profileResult.data;

      // Generate photo URL if needed
      let photoUrl = null;
      if (profile.profile_photo && profile.profile_photo !== 'default_avatar.png') {
        // Check cache first
        photoUrl = await this.getCachedPhotoUrl(user.id);
        
        if (!photoUrl) {
          // Generate new URL
          const photoPath = profile.profile_photo.startsWith('public/') 
            ? profile.profile_photo 
            : `public/${profile.profile_photo}`;
          
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(photoPath);
          
          photoUrl = urlData.publicUrl;
        }
      }

      return { profile, photoUrl, dealCount };
    } catch (error) {
      console.error('Error fetching fresh profile:', error);
      return null;
    }
  }

  // Clear cache (when user logs out or deletes account)
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PROFILE_CACHE_KEY, PHOTO_URL_CACHE_KEY]);
    } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  }

  // Force refresh cache (when user makes profile changes)
  static async forceRefresh(): Promise<{ profile: any; photoUrl: string | null; dealCount: number } | null> {
    const freshData = await this.fetchFreshProfile();
    if (freshData) {
      await this.setCachedProfile(freshData.profile, freshData.photoUrl, freshData.dealCount);
    }
    return freshData;
  }
}
