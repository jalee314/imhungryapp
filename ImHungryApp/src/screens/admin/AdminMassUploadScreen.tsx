import { Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';

import { supabase } from '../../../lib/supabase';
import ListSelectionModal from '../../components/ListSelectionModal';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { useDataCache } from '../../hooks/useDataCache';
import { processImageWithEdgeFunction } from '../../services/imageProcessingService';
import { getOrCreateRestaurant, searchRestaurants, GooglePlaceResult } from '../../services/restaurantService';
import { BRAND, STATIC, GRAY, SEMANTIC } from '../../ui/alf';

// --- Debounce Helper Function ---
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  google_place_id?: string;
  lat?: number;
  lng?: number;
}

interface DealForm {
  id: string;
  title: string;
  description: string;
  restaurant: Restaurant | null;
  category: string;
  cuisine: string;
  expirationDate: string;
  imageUri: string | null;
}

const AdminMassUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const { categories, cuisines } = useDataCache();
  const [dealForms, setDealForms] = useState<DealForm[]>([
    {
      id: '1',
      title: '',
      description: '',
      restaurant: null,
      category: '',
      cuisine: '',
      expirationDate: '',
      imageUri: null,
    },
  ]);
  const [uploading, setUploading] = useState(false);

  // Restaurant search state
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const addNewForm = () => {
    const newForm: DealForm = {
      id: Date.now().toString(),
      title: '',
      description: '',
      restaurant: null,
      category: '',
      cuisine: '',
      expirationDate: '',
      imageUri: null,
    };
    setDealForms([...dealForms, newForm]);
  };

  // Get device's current location for restaurant search
  const getDeviceLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting device location:', error);
      return null;
    }
  };

  // Debounced Google Places search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const deviceLocation = await getDeviceLocation();

        if (!deviceLocation) {
          setSearchError('Location not available. Please enable location services.');
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        const result = await searchRestaurants(
          query,
          deviceLocation.lat,
          deviceLocation.lng
        );

        if (!result.success) {
          setSearchError(result.error || 'Failed to search restaurants');
          setSearchResults([]);
        } else if (result.count === 0) {
          setSearchError('No restaurants found');
          setSearchResults([]);
        } else {
          const transformed = result.restaurants.map((place: GooglePlaceResult) => ({
            id: place.google_place_id,
            name: place.name,
            address: place.address.replace(/, USA$/, ''),
            google_place_id: place.google_place_id,
            lat: place.lat,
            lng: place.lng,
          }));

          setSearchResults(transformed);
          setSearchError(null);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle search query change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Handle restaurant selection
  const handleDoneSearch = async (selectedIds: string[]) => {
    if (selectedIds.length > 0 && activeFormId) {
      const selectedPlace = searchResults.find(r => r.id === selectedIds[0]);

      if (selectedPlace && selectedPlace.google_place_id) {
        setIsSearchModalVisible(false);

        if (selectedPlace.lat == null || selectedPlace.lng == null) {
          Alert.alert('Location unavailable', 'Selected place is missing coordinates. Please try another result.');
          return;
        }

        try {
          const result = await getOrCreateRestaurant({
            google_place_id: selectedPlace.google_place_id,
            name: selectedPlace.name,
            address: selectedPlace.address,
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
            distance_miles: 0,
          });

          if (result.success && result.restaurant_id) {
            updateForm(activeFormId, 'restaurant', {
              id: result.restaurant_id,
              name: selectedPlace.name,
              address: selectedPlace.address,
              google_place_id: selectedPlace.google_place_id,
              lat: selectedPlace.lat,
              lng: selectedPlace.lng,
            });
          } else {
            Alert.alert('Error', 'Failed to save restaurant. Please try again.');
          }
        } catch (error) {
          console.error('Error saving restaurant:', error);
          Alert.alert('Error', 'An unexpected error occurred.');
        }
      }
    }

    // Clear search state
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setActiveFormId(null);
  };

  const handleSearchPress = (formId: string) => {
    setActiveFormId(formId);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearchModalVisible(true);
  };

  const handleClearRestaurant = (formId: string) => {
    updateForm(formId, 'restaurant', null);
  };

  const pickImage = async (formId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateForm(formId, 'imageUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (formId: string) => {
    updateForm(formId, 'imageUri', null);
  };

  const removeForm = (id: string) => {
    if (dealForms.length === 1) {
      Alert.alert('Error', 'You must have at least one form');
      return;
    }
    setDealForms(dealForms.filter((form) => form.id !== id));
  };

  const updateForm = (id: string, field: keyof DealForm, value) => {
    setDealForms(
      dealForms.map((form) =>
        form.id === id ? { ...form, [field]: value } : form
      )
    );
  };

  const validateForm = (form: DealForm): boolean => {
    if (!form.title.trim()) return false;
    if (!form.restaurant) return false;
    if (!form.category) return false;
    if (!form.cuisine) return false;
    return true;
  };

  const resetDealForms = () => {
    setDealForms([
      {
        id: '1',
        title: '',
        description: '',
        restaurant: null,
        category: '',
        cuisine: '',
        expirationDate: '',
        imageUri: null,
      },
    ]);
  };

  const uploadDealTemplate = async (form: DealForm, userId: string): Promise<boolean> => {
    if (!form.restaurant?.id) {
      return false;
    }

    const category = categories.find((c) => c.name === form.category);
    const cuisine = cuisines.find((c) => c.name === form.cuisine);
    if (!category || !cuisine) {
      return false;
    }

    let imageMetadataId: string | null = null;
    if (form.imageUri) {
      const imageResult = await processImageWithEdgeFunction(form.imageUri, 'deal_image');
      if (imageResult.success && imageResult.metadataId) {
        imageMetadataId = imageResult.metadataId;
      }
    }

    const { error } = await supabase.from('deal_template').insert({
      restaurant_id: form.restaurant.id,
      user_id: userId,
      title: form.title,
      description: form.description || null,
      image_metadata_id: imageMetadataId,
      category_id: category.id,
      cuisine_id: cuisine.id,
      is_anonymous: false,
      source_type: 'admin_uploaded',
    });

    if (error) throw error;
    return true;
  };

  const handleUploadAll = async () => {
    // Validate all forms
    const invalidForms = dealForms.filter((form) => !validateForm(form));
    if (invalidForms.length > 0) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields (title, restaurant, category, and cuisine) for all deals.'
      );
      return;
    }

    Alert.alert(
      'Confirm Upload',
      `Are you sure you want to upload ${dealForms.length} deal(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            setUploading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('No authenticated user');

              let successCount = 0;
              let errorCount = 0;

              for (const form of dealForms) {
                try {
                  const uploaded = await uploadDealTemplate(form, user.id);
                  if (uploaded) {
                    successCount++;
                  } else {
                    errorCount++;
                  }
                } catch (error) {
                  console.error('Error uploading deal:', error);
                  errorCount++;
                }
              }

              setUploading(false);
              Alert.alert(
                'Upload Complete',
                `Successfully uploaded ${successCount} deal(s).${errorCount > 0 ? ` ${errorCount} failed.` : ''
                }`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (successCount > 0) resetDealForms();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error uploading deals:', error);
              setUploading(false);
              Alert.alert('Error', 'Failed to upload deals');
            }
          },
        },
      ]
    );
  };

  const renderDealForm = (form: DealForm, index: number) => (
    <View key={form.id} style={styles.formCard}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Deal #{index + 1}</Text>
        {dealForms.length > 1 && (
          <TouchableOpacity onPress={() => removeForm(form.id)}>
            <Monicon name="uil:trash-alt" size={24} color={SEMANTIC.error} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Deal Image</Text>
      {form.imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: form.imageUri }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => removeImage(form.id)}
          >
            <Ionicons name="close-circle" size={24} color={SEMANTIC.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={() => pickImage(form.id)}
        >
          <Ionicons name="camera" size={32} color={GRAY[600]} />
          <Text style={styles.imagePickerText}>Add Photo</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>
        Deal Title <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 50% off all pizzas"
        value={form.title}
        onChangeText={(text) => updateForm(form.id, 'title', text)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Optional details about the deal..."
        value={form.description}
        onChangeText={(text) => updateForm(form.id, 'description', text)}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>
        Restaurant <Text style={styles.required}>*</Text>
      </Text>
      {form.restaurant ? (
        <View style={styles.selectedRestaurantContainer}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{form.restaurant.name}</Text>
            <Text style={styles.restaurantAddress}>{form.restaurant.address}</Text>
          </View>
          <TouchableOpacity onPress={() => handleClearRestaurant(form.id)}>
            <Ionicons name="close-circle" size={24} color={SEMANTIC.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearchPress(form.id)}
        >
          <Ionicons name="search" size={20} color={GRAY[600]} />
          <Text style={styles.searchButtonText}>Search for Restaurant</Text>
          <Ionicons name="chevron-forward" size={20} color={GRAY[600]} />
        </TouchableOpacity>
      )}

      <Text style={styles.label}>
        Category <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.chipContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              form.category === cat.name && styles.chipSelected,
            ]}
            onPress={() => updateForm(form.id, 'category', cat.name)}
          >
            <Text
              style={[
                styles.chipText,
                form.category === cat.name && styles.chipTextSelected,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        Cuisine <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.chipContainer}>
        {cuisines.slice(0, 10).map((cui) => (
          <TouchableOpacity
            key={cui.id}
            style={[
              styles.chip,
              form.cuisine === cui.name && styles.chipSelected,
            ]}
            onPress={() => updateForm(form.id, 'cuisine', cui.name)}
          >
            <Text
              style={[
                styles.chipText,
                form.cuisine === cui.name && styles.chipTextSelected,
              ]}
            >
              {cui.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Mass Deal Upload" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={32} color={BRAND.accent} />
          <Text style={styles.infoText}>
            Add multiple deals at once by filling out the forms below. Click "Add
            Another Deal" to create more forms.
          </Text>
        </View>

        {dealForms.map((form, index) => renderDealForm(form, index))}

        <TouchableOpacity style={styles.addButton} onPress={addNewForm}>
          <Ionicons name="add-circle-outline" size={24} color={BRAND.accent} />
          <Text style={styles.addButtonText}>Add Another Deal</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUploadAll}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={STATIC.white} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color={STATIC.white} />
              <Text style={styles.uploadButtonText}>
                Upload {dealForms.length} Deal{dealForms.length > 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ListSelectionModal
        visible={isSearchModalVisible}
        onClose={() => {
          setIsSearchModalVisible(false);
          setSearchQuery('');
          setSearchResults([]);
          setSearchError(null);
          setActiveFormId(null);
        }}
        onDone={handleDoneSearch}
        data={
          isSearching
            ? [{ id: 'loading', name: 'Searching restaurants...', subtext: '' }]
            : searchError
              ? [{ id: 'error', name: searchError || 'Unknown error', subtext: 'Try a different search' }]
              : searchQuery.trim().length > 0
                ? (searchResults.length > 0
                  ? searchResults.map(r => ({ id: r.id, name: r.name, subtext: r.address }))
                  : [{ id: 'empty', name: 'No results found', subtext: 'Try a different search term' }])
                : [{ id: 'prompt', name: 'Search for a restaurant', subtext: 'Start typing to see results...' }]
        }
        title="Search Restaurant"
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY[100],
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: STATIC.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: GRAY[600],
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: STATIC.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: STATIC.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: STATIC.black,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: STATIC.black,
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: SEMANTIC.error,
  },
  input: {
    backgroundColor: GRAY[100],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: STATIC.black,
    borderWidth: 1,
    borderColor: GRAY[300],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: GRAY[100],
    borderWidth: 1,
    borderColor: GRAY[300],
  },
  chipSelected: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
  },
  chipText: {
    fontSize: 12,
    color: GRAY[600],
  },
  chipTextSelected: {
    color: STATIC.white,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BRAND.accent,
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    color: BRAND.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: STATIC.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY[300],
  },
  uploadButton: {
    backgroundColor: BRAND.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: GRAY[350],
  },
  uploadButtonText: {
    color: STATIC.white,
    fontSize: 16,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  imagePickerButton: {
    backgroundColor: GRAY[100],
    borderWidth: 2,
    borderColor: GRAY[300],
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: GRAY[600],
  },
  selectedRestaurantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GRAY[100],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: GRAY[300],
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: STATIC.black,
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 12,
    color: GRAY[600],
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GRAY[100],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: GRAY[300],
  },
  searchButtonText: {
    flex: 1,
    fontSize: 14,
    color: GRAY[600],
    marginLeft: 8,
  },
});

export default AdminMassUploadScreen;
