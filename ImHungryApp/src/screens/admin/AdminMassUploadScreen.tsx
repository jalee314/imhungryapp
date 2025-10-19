import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDataCache } from '../../context/DataCacheContext';
import { getOrCreateRestaurant } from '../../services/restaurantService';
import { processImageWithEdgeFunction } from '../../services/imageProcessingService';
import { supabase } from '../../../lib/supabase';

interface DealForm {
  id: string;
  title: string;
  description: string;
  restaurantName: string;
  restaurantAddress: string;
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
      restaurantName: '',
      restaurantAddress: '',
      category: '',
      cuisine: '',
      expirationDate: '',
      imageUri: null,
    },
  ]);
  const [uploading, setUploading] = useState(false);

  const addNewForm = () => {
    const newForm: DealForm = {
      id: Date.now().toString(),
      title: '',
      description: '',
      restaurantName: '',
      restaurantAddress: '',
      category: '',
      cuisine: '',
      expirationDate: '',
      imageUri: null,
    };
    setDealForms([...dealForms, newForm]);
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

  const updateForm = (id: string, field: keyof DealForm, value: string | null) => {
    setDealForms(
      dealForms.map((form) =>
        form.id === id ? { ...form, [field]: value } : form
      )
    );
  };

  const validateForm = (form: DealForm): boolean => {
    if (!form.title.trim()) return false;
    if (!form.restaurantName.trim()) return false;
    if (!form.restaurantAddress.trim()) return false;
    if (!form.category) return false;
    if (!form.cuisine) return false;
    return true;
  };

  const handleUploadAll = async () => {
    // Validate all forms
    const invalidForms = dealForms.filter((form) => !validateForm(form));
    if (invalidForms.length > 0) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields (title, restaurant name, address, category, and cuisine) for all deals.'
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
                  // Get or create restaurant
                  const result = await getOrCreateRestaurant({
                    name: form.restaurantName,
                    address: form.restaurantAddress,
                    google_place_id: '',
                    lat: 0,
                    lng: 0,
                    distance_miles: 0,
                  });

                  if (!result.success || !result.restaurant_id) {
                    errorCount++;
                    continue;
                  }

                  // Find category and cuisine IDs
                  const category = categories.find(
                    (c) => c.name === form.category
                  );
                  const cuisine = cuisines.find(
                    (c) => c.name === form.cuisine
                  );

                  if (!category || !cuisine) {
                    errorCount++;
                    continue;
                  }

                  // Upload image if provided
                  let imageMetadataId: string | null = null;
                  if (form.imageUri) {
                    const imageResult = await processImageWithEdgeFunction(form.imageUri, 'deal_image');
                    if (imageResult.success && imageResult.metadataId) {
                      imageMetadataId = imageResult.metadataId;
                    }
                  }

                  // Create deal template
                  const { error } = await supabase.from('deal_template').insert({
                    restaurant_id: result.restaurant_id,
                    user_id: user.id,
                    title: form.title,
                    description: form.description || null,
                    image_metadata_id: imageMetadataId,
                    category_id: category.id,
                    cuisine_id: cuisine.id,
                    is_anonymous: false,
                    source_type: 'admin_uploaded',
                  });

                  if (error) throw error;
                  successCount++;
                } catch (error) {
                  console.error('Error uploading deal:', error);
                  errorCount++;
                }
              }

              setUploading(false);
              Alert.alert(
                'Upload Complete',
                `Successfully uploaded ${successCount} deal(s).${
                  errorCount > 0 ? ` ${errorCount} failed.` : ''
                }`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (successCount > 0) {
                        // Reset forms
                        setDealForms([
                          {
                            id: '1',
                            title: '',
                            description: '',
                            restaurantName: '',
                            restaurantAddress: '',
                            category: '',
                            cuisine: '',
                            expirationDate: '',
                            imageUri: null,
                          },
                        ]);
                      }
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
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
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
            <Ionicons name="close-circle" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={() => pickImage(form.id)}
        >
          <Ionicons name="camera" size={32} color="#666" />
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
        Restaurant Name <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Joe's Pizza"
        value={form.restaurantName}
        onChangeText={(text) => updateForm(form.id, 'restaurantName', text)}
      />

      <Text style={styles.label}>
        Restaurant Address <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="123 Main St, City, State"
        value={form.restaurantAddress}
        onChangeText={(text) => updateForm(form.id, 'restaurantAddress', text)}
      />

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mass Deal Upload</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={32} color="#FFA05C" />
          <Text style={styles.infoText}>
            Add multiple deals at once by filling out the forms below. Click "Add
            Another Deal" to create more forms.
          </Text>
        </View>

        {dealForms.map((form, index) => renderDealForm(form, index))}

        <TouchableOpacity style={styles.addButton} onPress={addNewForm}>
          <Ionicons name="add-circle-outline" size={24} color="#FFA05C" />
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
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFF" />
              <Text style={styles.uploadButtonText}>
                Upload {dealForms.length} Deal{dealForms.length > 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#FFF',
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
    color: '#666',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
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
    color: '#000',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#FFA05C',
    borderColor: '#FFA05C',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFA05C',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    color: '#FFA05C',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  uploadButton: {
    backgroundColor: '#FFA05C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#CCC',
  },
  uploadButtonText: {
    color: '#FFF',
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
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
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
    color: '#666',
  },
});

export default AdminMassUploadScreen;
