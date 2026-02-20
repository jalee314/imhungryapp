import { useNavigation } from '@react-navigation/native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';

import { ProfileCacheService } from '../services/profileCacheService';
import {
  fetchCurrentUserCuisines,
  saveUserCuisines,
  updateCurrentUserProfile,
  getCurrentUserId
} from '../services/profileUpdateService';
import type { ProfileRecord } from '../services/userProfileService';

interface UseProfileEditParams {
  route?: {
    params?: {
      profile?: ProfileRecord;
      updatedCuisines?: string[];
    };
  };
}

interface UseProfileEditResult {
  formData: { fullName: string; username: string; email: string; city: string };
  setField: (field: keyof UseProfileEditResult['formData'], value: string) => void;
  loading: boolean;
  userCuisines: string[];
  hasChanges: boolean;
  handleSave: () => Promise<void>;
  handleCuisinePress: () => void;
}

export const useProfileEdit = ({ route }: UseProfileEditParams): UseProfileEditResult => {
  const navigation = useNavigation();
  const profile = route?.params?.profile;
  const updatedCuisines = route?.params?.updatedCuisines as string[] | undefined;
  const hasUpdatedCuisines = useRef(false);

  const initialFormData = useRef({
    fullName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    username: profile?.display_name || '',
    email: profile?.email || '',
    city: profile?.location_city || '',
  });

  const [formData, setFormData] = useState({
    fullName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    username: profile?.display_name || '',
    email: profile?.email || '',
    city: profile?.location_city || '',
  });
  const [loading, setLoading] = useState(false);
  const [userCuisines, setUserCuisines] = useState<string[]>([]);
  const [savedCuisines, setSavedCuisines] = useState<string[]>([]);

  // Check if any changes were made
  const hasChanges =
    formData.fullName !== initialFormData.current.fullName ||
    formData.username !== initialFormData.current.username ||
    formData.email !== initialFormData.current.email ||
    formData.city !== initialFormData.current.city ||
    JSON.stringify([...userCuisines].sort()) !== JSON.stringify([...savedCuisines].sort());

  // Initial fetch
  useEffect(() => { fetchUserCuisines(); }, []);

  // Listen for updated cuisines
  useEffect(() => {
    if (updatedCuisines && Array.isArray(updatedCuisines)) {
      hasUpdatedCuisines.current = true;
      setUserCuisines(updatedCuisines);
    }
  }, [updatedCuisines]);

  const setField = (field: keyof UseProfileEditResult['formData'], value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchUserCuisines = async () => {
    try {
      const cuisineNames = await fetchCurrentUserCuisines();
      if (!hasUpdatedCuisines.current) setUserCuisines(cuisineNames);
      setSavedCuisines(cuisineNames);
    } catch (err) {
      console.error('Error fetching cuisines:', err);
    }
  };


  const handleSave = useCallback(async () => {
    if (!formData.fullName || !formData.username || !formData.email || !formData.city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (formData.username.length < 3 || formData.username.length > 15) {
      Alert.alert('Error', 'Username must be 3-15 characters long');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await updateCurrentUserProfile(formData);
      const userId = await getCurrentUserId();
      const cuisinesChanged = JSON.stringify([...userCuisines].sort()) !== JSON.stringify([...savedCuisines].sort());
      if (cuisinesChanged) await saveUserCuisines(userId, userCuisines);
      await ProfileCacheService.clearCache();
      hasUpdatedCuisines.current = false;
      Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      console.error('Profile update error', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, userCuisines, savedCuisines, navigation]);

  const handleCuisinePress = () => {
    navigation.navigate('CuisineEdit', { selectedCuisines: userCuisines, profile });
  };

  return { formData, setField, loading, userCuisines, hasChanges, handleSave, handleCuisinePress };
};
