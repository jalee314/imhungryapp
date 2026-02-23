import { supabase } from '../../lib/supabase';

import { processImageWithEdgeFunction } from './imageProcessingService';
import { clearUserCache } from './userService';

/**
 * Check if a username is available
 * Returns true when available, false when already taken
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  // Fast client-side validation first
  if (!username || username.length < 3 || username.length > 20) return false;
  const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const { data, error } = await supabase.rpc('check_username_exists', { username_input: sanitized });
  if (error) throw error;
  // RPC returns true when username exists (taken). We invert.
  return !data;
};

/**
 * Complete signup with cuisine preferences and optional location + profile photo
 */
export const completeSignup = async (userData: any, selectedCuisines: string[]) => {
  // Convert phone to E.164
  const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
  const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`;

  const { data: signUpResult, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: e164Phone,
        username: userData.username,
        full_name: `${userData.firstName} ${userData.lastName}`,
        metadata_idprofile_photo_: null,
        cuisine_preferences: selectedCuisines,
        location_data: userData.locationData,
        display_name: userData.username,
      },
    },
  });

  if (error) throw error;

  // Insert preferences
  if (signUpResult.user) {
    await insertUserCuisinePreferences(signUpResult.user.id, selectedCuisines);

    if (userData.locationData) {
      await saveUserLocation(signUpResult.user.id, userData.locationData);
    }

    if (userData.profile_photo_url && userData.profile_photo_url !== 'default_avatar') {
      await ensureUserRecordExists(signUpResult.user.id);
      const result = await processImageWithEdgeFunction(userData.profile_photo_url, 'profile_image');
      if (result.success && result.metadataId) {
        await supabase
          .from('user')
          .update({ profile_photo_metadata_id: result.metadataId })
          .eq('user_id', signUpResult.user.id)
          .select();
      }
    }
  }
};

/**
 * Complete signup when user skips cuisine selection
 */
export const completeSignupSkip = async (userData: any) => {
  const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
  const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`;

  const { data: signUpResult, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: e164Phone,
        username: userData.username,
        full_name: `${userData.firstName} ${userData.lastName}`,
        profile_photo_metadata_id: null,
        cuisine_preferences: [],
      },
    },
  });

  if (error) throw error;

  if (signUpResult.user && userData.locationData) {
    await saveUserLocation(signUpResult.user.id, userData.locationData);
  }

  if (signUpResult.user && userData.profile_photo_url && userData.profile_photo_url !== 'default_avatar') {
    await ensureUserRecordExists(signUpResult.user.id);
    const result = await processImageWithEdgeFunction(userData.profile_photo_url, 'profile_image');
    if (result.success && result.metadataId) {
      await supabase
        .from('user')
        .update({ profile_photo_metadata_id: result.metadataId })
        .eq('user_id', signUpResult.user.id)
        .select();
      setTimeout(async () => {
        await clearUserCache();
      }, 1000);
    }
  }
};

// ========== helpers (kept internal to service) ==========

const insertUserCuisinePreferences = async (userId: string, cuisines: string[]) => {
  if (cuisines.length === 0) return;
  const { data: cuisineData, error: cuisineError } = await supabase
    .from('cuisine')
    .select('cuisine_id, cuisine_name')
    .in('cuisine_name', cuisines);
  if (cuisineError) throw cuisineError;
  const preferences = cuisineData.map((c) => ({ user_id: userId, cuisine_id: c.cuisine_id }));
  const { error: preferencesError } = await supabase.from('user_cuisine_preference').insert(preferences);
  if (preferencesError) throw preferencesError;
};

const saveUserLocation = async (userId: string, locationData: any) => {
  if (!locationData || !locationData.latitude || !locationData.longitude) return;
  if (
    locationData.latitude < -90 ||
    locationData.latitude > 90 ||
    locationData.longitude < -180 ||
    locationData.longitude > 180
  ) {
    return;
  }
  await supabase.rpc('update_user_location', {
    user_uuid: userId,
    lat: locationData.latitude,
    lng: locationData.longitude,
    city: locationData.city,
    state: locationData.state || null,
  });
};

const ensureUserRecordExists = async (userId: string) => {
  let retries = 0;
  const maxRetries = 5;
  while (retries < maxRetries) {
    await new Promise((r) => setTimeout(r, 1000 * (retries + 1)));
    const { data: userCheck, error: userCheckError } = await supabase
      .from('user')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    if (!userCheckError) return;
    retries++;
  }
  throw new Error('User record was not created after multiple attempts');
};
