import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import CalendarModal from '../../components/CalendarModal';
import PhotoActionModal from '../../components/PhotoActionModal';
import ImageCropperModal from '../../components/ImageCropperModal';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { ProfileCacheService } from '../../services/profileCacheService';
import { dealCacheService } from '../../services/dealCacheService';
import { invalidateDealImageCache } from '../deal_feed/DealDetailScreen';
import {
  fetchDealForEdit,
  updateDealFields,
  addDealImages,
  removeDealImage,
  setDealThumbnail,
  DealEditData,
} from '../../services/dealService';

const { width: screenWidth } = Dimensions.get('window');
const MAX_PHOTOS = 5;
const THUMBNAIL_SIZE = 56;

type DealEditRouteProp = RouteProp<{ DealEdit: { dealId: string } }, 'DealEdit'>;

export default function DealEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<DealEditRouteProp>();
  const { dealId } = route.params;
  const { setPostAdded } = useDealUpdate();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Deal data
  const [dealData, setDealData] = useState<DealEditData | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealDetails, setDealDetails] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);

  // Image management
  const [images, setImages] = useState<Array<{
    imageMetadataId: string;
    url: string;
    isNew?: boolean;
    localUri?: string;
    // The source image we always re-crop from (never changes once set)
    originalUri?: string;
  }>>([]);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pendingNewImages, setPendingNewImages] = useState<string[]>([]);
  // Parallel array to keep track of which temp image each pendingNewImages entry belongs to
  const [pendingNewImageTempIds, setPendingNewImageTempIds] = useState<string[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);

  // Modal states
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);

  // Cropping state
  const [isCropperVisible, setIsCropperVisible] = useState(false);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  // Track the image by ID (not list index) so filtering doesn't break edits
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  // Ref for carousel
  const carouselRef = React.useRef<FlatList>(null);

  // Load deal data
  useEffect(() => {
    loadDealData();
  }, [dealId]);

  const loadDealData = async () => {
    setIsLoading(true);
    setLoadError(null);

    console.log('DealEditScreen: Loading deal for edit:', dealId);
    const result = await fetchDealForEdit(dealId);

    if (!result.success || !result.data) {
      console.error('DealEditScreen: Failed to load deal:', result.error);
      setLoadError(result.error || 'Failed to load deal');
      setIsLoading(false);
      return;
    }

    const data = result.data;
    console.log('DealEditScreen: Deal loaded successfully:', {
      title: data.title,
      imageCount: data.images.length,
    });

    setDealData(data);
    setDealTitle(data.title);
    setDealDetails(data.description || '');
    setIsAnonymous(data.isAnonymous);
    setExpirationDate(data.expirationDate);

    // Set images
    const loadedImages = data.images.map(img => ({
      imageMetadataId: img.imageMetadataId,
      url: img.url,
      isNew: false,
      originalUri: img.url,
    }));
    console.log('DealEditScreen: Setting images:', loadedImages.length);
    setImages(loadedImages);

    // Set thumbnail
    const thumbImage = data.images.find(img => img.isThumbnail);
    setThumbnailId(thumbImage?.imageMetadataId || data.images[0]?.imageMetadataId || null);

    setIsLoading(false);
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setExpirationDate(date);
    setIsCalendarModalVisible(false);
  };

  const handleClearDate = () => {
    setExpirationDate(null);
    setIsCalendarModalVisible(false);
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Photo handling
  const handleTakePhoto = async () => {
    setIsCameraModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false, // We'll use our own cropper
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Start cropping flow
        setPendingCropUri(result.assets[0].uri);
        setEditingImageId(null); // New image, not editing
        setIsCropperVisible(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleChooseFromLibrary = async () => {
    setIsCameraModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false, // We'll use our own cropper
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Start cropping flow
        setPendingCropUri(result.assets[0].uri);
        setEditingImageId(null); // New image, not editing
        setIsCropperVisible(true);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  // Handle crop completion
  const handleCropComplete = (croppedUri: string) => {
    if (editingImageId) {
      const idx = images.findIndex(img => img.imageMetadataId === editingImageId);
      if (idx === -1) {
        addNewImage(croppedUri, pendingCropUri || croppedUri);
      } else {
        const target = images[idx];
        const originalUri = target.originalUri || target.localUri || target.url;

        if (target.isNew) {
          // Re-cropping a local (not yet uploaded) image: keep originalUri, just update display/localUri
          setImages(prev => {
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              url: croppedUri,
              localUri: croppedUri,
              originalUri,
            };
            return copy;
          });

          // Replace the pending upload URI for this temp image
          setPendingNewImages(prev => {
            const copy = [...prev];
            const i = copy.findIndex(u => u === target.localUri);
            if (i !== -1) copy[i] = croppedUri;
            return copy;
          });
        } else {
          // Cropping an already-uploaded image: mark old for removal and add a new temp replacement
          const tempId = `new_${Date.now()}`;

          setPendingRemovals(prev => (prev.includes(target.imageMetadataId) ? prev : [...prev, target.imageMetadataId]));
          setPendingNewImages(prev => [...prev, croppedUri]);
          setPendingNewImageTempIds(prev => [...prev, tempId]);

          setImages(prev => [
            ...prev,
            {
              imageMetadataId: tempId,
              url: croppedUri,
              isNew: true,
              localUri: croppedUri,
              originalUri,
            },
          ]);

          if (thumbnailId === target.imageMetadataId) {
            setThumbnailId(tempId);
          }
        }
      }
    } else {
      // New image
      addNewImage(croppedUri, pendingCropUri || croppedUri);
    }
    setIsCropperVisible(false);
    setPendingCropUri(null);
    setEditingImageId(null);
  };

  const handleCropCancel = () => {
    setIsCropperVisible(false);
    setPendingCropUri(null);
    setEditingImageId(null);
  };

  // Edit existing image
  const handleEditImage = (index: number) => {
    const image = activeImages[index];
    setPendingCropUri(image.originalUri || image.localUri || image.url);
    setEditingImageId(image.imageMetadataId);
    setIsCropperVisible(true);
  };

  const addNewImage = (displayUri: string, originalUri?: string) => {
    const totalImages = images.length - pendingRemovals.length + pendingNewImages.length;
    if (totalImages >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can only have up to ${MAX_PHOTOS} photos.`);
      return;
    }

    // Add as a temporary new image
    const tempId = `new_${Date.now()}`;
    setImages(prev => [...prev, {
      imageMetadataId: tempId,
      url: displayUri,
      isNew: true,
      localUri: displayUri,
      originalUri: originalUri || displayUri,
    }]);
    setPendingNewImages(prev => [...prev, displayUri]);
    setPendingNewImageTempIds(prev => [...prev, tempId]);
  };

  const handleRemoveImage = (imageMetadataId: string) => {
    const activeImages = images.filter(img => !pendingRemovals.includes(img.imageMetadataId));
    if (activeImages.length <= 1) {
      Alert.alert('Cannot Remove', 'Your deal must have at least one photo.');
      return;
    }

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const imageToRemove = images.find(img => img.imageMetadataId === imageMetadataId);
            
            if (imageToRemove?.isNew) {
              // Remove from pending new images
              setPendingNewImages(prevUris => {
                const idx = prevUris.findIndex(u => u === imageToRemove.localUri);
                if (idx === -1) return prevUris;
                setPendingNewImageTempIds(prevTempIds => prevTempIds.filter((_, i) => i !== idx));
                return prevUris.filter((_, i) => i !== idx);
              });
              setImages(prev => prev.filter(img => img.imageMetadataId !== imageMetadataId));
            } else {
              // Mark for removal (will be deleted on save)
              setPendingRemovals(prev => [...prev, imageMetadataId]);
            }

            // If removing thumbnail, set a new one
            if (thumbnailId === imageMetadataId) {
              const remaining = images.filter(
                img => img.imageMetadataId !== imageMetadataId && !pendingRemovals.includes(img.imageMetadataId)
              );
              if (remaining.length > 0) {
                setThumbnailId(remaining[0].imageMetadataId);
              }
            }
          },
        },
      ]
    );
  };

  const handleSetThumbnail = (imageMetadataId: string) => {
    setThumbnailId(imageMetadataId);
  };

  const handleThumbnailPress = (index: number) => {
    setCurrentImageIndex(index);
    carouselRef.current?.scrollToIndex({ index, animated: true });
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!dealTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a deal title.');
      return false;
    }

    const activeImages = images.filter(img => !pendingRemovals.includes(img.imageMetadataId));
    if (activeImages.length === 0 && pendingNewImages.length === 0) {
      Alert.alert('Missing Photo', 'Your deal must have at least one photo.');
      return false;
    }

    return true;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm() || !dealData) return;

    setIsSaving(true);

    try {
      // 1. Update text fields
      const fieldsResult = await updateDealFields(dealId, {
        title: dealTitle,
        description: dealDetails || undefined,
        expirationDate,
        isAnonymous,
      });

      if (!fieldsResult.success) {
        Alert.alert('Error', fieldsResult.error || 'Failed to update deal');
        setIsSaving(false);
        return;
      }

      // 2. Remove deleted images
      for (const metadataId of pendingRemovals) {
        await removeDealImage(dealId, metadataId);
      }

      // 3. Add new images
      if (pendingNewImages.length > 0) {
        const addResult = await addDealImages(dealId, pendingNewImages);
        if (!addResult.success) {
          console.warn('Some images failed to upload:', addResult.error);
        } else if (addResult.newImages && addResult.newImages.length > 0) {
          // Best-effort: map returned new images to temp IDs by index
          const mappedCount = Math.min(addResult.newImages.length, pendingNewImageTempIds.length);
          let nextThumbnailId = thumbnailId;

          setImages(prev => {
            const updated = [...prev];
            for (let i = 0; i < mappedCount; i++) {
              const tempId = pendingNewImageTempIds[i];
              const uploaded = addResult.newImages![i];
              const idx = updated.findIndex(img => img.imageMetadataId === tempId);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  imageMetadataId: uploaded.imageMetadataId,
                  url: uploaded.url,
                  isNew: false,
                  localUri: undefined,
                  // keep originalUri as-is
                };
                if (nextThumbnailId === tempId) {
                  nextThumbnailId = uploaded.imageMetadataId;
                }
              }
            }
            return updated;
          });

          // If thumbnail was pointing to a temp image, update it to the uploaded id we mapped
          if (nextThumbnailId !== thumbnailId) {
            setThumbnailId(nextThumbnailId);
          }
        }
      }

      // 4. Update thumbnail if changed
      // If thumbnail is still a temp id at this point, we can't reliably set it server-side.
      if (thumbnailId && !thumbnailId.startsWith('new_')) {
        await setDealThumbnail(dealId, thumbnailId);
      }

      // Invalidate the in-memory image cache for this deal
      invalidateDealImageCache(dealId);

      // Success - refresh both profile and deal caches
      await Promise.all([
        ProfileCacheService.forceRefresh(),
        dealCacheService.invalidateAndRefresh(),
      ]);
      setPostAdded(true);

      Alert.alert('Success', 'Your deal has been updated!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving deal:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get active images (excluding pending removals)
  const activeImages = images.filter(img => !pendingRemovals.includes(img.imageMetadataId));

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C4C" />
          <Text style={styles.loadingText}>Loading deal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDealData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButtonError} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonErrorText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAwareScrollView
        style={styles.mainFrame}
        contentContainerStyle={styles.mainFrameContentContainer}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        {/* Top Button Row */}
        <View style={styles.topButtonRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Restaurant Info (read-only) */}
        <View style={styles.selectedRestaurantContainer}>
          <View style={styles.restaurantTextContainer}>
            <Text style={styles.selectedRestaurantName}>{dealData?.restaurantName}</Text>
            <Text style={styles.selectedRestaurantAddress} numberOfLines={1}>
              {dealData?.restaurantAddress}
            </Text>
          </View>
          <MaterialCommunityIcons name="store" size={20} color="#FF8C4C" />
        </View>

        {/* Main Content Container */}
        <View style={styles.dealContainerWrapper}>
          <View style={styles.unifiedContainer}>
            {/* Deal Title Section */}
            <View style={styles.optionRow}>
              <Ionicons name="menu-outline" size={20} color="#606060" />
              <Text style={styles.optionText}>Deal Title</Text>
            </View>
            <View style={styles.dealTitleInputContainer}>
              <TextInput
                style={styles.dealTitleText}
                value={dealTitle}
                onChangeText={setDealTitle}
                placeholder="e.g., 50% off all pizzas"
                placeholderTextColor="#C1C1C1"
                multiline
                maxLength={100}
              />
              <Text style={styles.characterCount}>{dealTitle.length}/100</Text>
            </View>

            <View style={styles.separator} />

            {/* Photos Section */}
            <View style={styles.optionRow}>
              <Ionicons name="camera-outline" size={20} color="#404040" />
              <Text style={styles.optionText}>Photos ({activeImages.length}/{MAX_PHOTOS})</Text>
            </View>

            {/* Photo Carousel */}
            <View style={styles.photoCarouselContainer}>
              {activeImages.length > 0 ? (
                <FlatList
                  ref={carouselRef}
                  data={activeImages}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => {
                    const carouselWidth = screenWidth - 48; // 12px padding + 12px margin on each side
                    const index = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
                    if (index !== currentImageIndex && index >= 0 && index < activeImages.length) {
                      setCurrentImageIndex(index);
                    }
                  }}
                  scrollEventThrottle={16}
                  keyExtractor={(item) => item.imageMetadataId}
                  getItemLayout={(_, index) => ({
                    length: screenWidth - 48,
                    offset: (screenWidth - 48) * index,
                    index,
                  })}
                  renderItem={({ item, index }) => (
                    <View style={[styles.carouselItem, { width: screenWidth - 48 }]}>
                      <Image source={{ uri: item.url }} style={styles.carouselImage} resizeMode="cover" />
                      
                      {/* Delete button */}
                      <TouchableOpacity
                        style={styles.deleteImageButton}
                        onPress={() => handleRemoveImage(item.imageMetadataId)}
                      >
                        <Ionicons name="close-circle" size={26} color="#FF3B30" />
                      </TouchableOpacity>

                      {/* Edit/Crop button */}
                      <TouchableOpacity
                        style={styles.editImageButton}
                        onPress={() => handleEditImage(index)}
                      >
                        <Ionicons name="crop" size={14} color="#FFF" />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>

                      {/* Set as cover button */}
                      <TouchableOpacity
                        style={[
                          styles.coverButton,
                          thumbnailId === item.imageMetadataId && styles.coverButtonActive,
                        ]}
                        onPress={() => handleSetThumbnail(item.imageMetadataId)}
                      >
                        <Ionicons
                          name={thumbnailId === item.imageMetadataId ? 'star' : 'star-outline'}
                          size={12}
                          color={thumbnailId === item.imageMetadataId ? '#FFD700' : '#FFF'}
                        />
                        <Text style={styles.coverButtonText}>
                          {thumbnailId === item.imageMetadataId ? 'Cover' : 'Set Cover'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.noPhotosContainer}>
                  <Ionicons name="image-outline" size={40} color="#CCC" />
                  <Text style={styles.noPhotosText}>No photos</Text>
                </View>
              )}
            </View>

            {/* Thumbnail strip + Add button */}
            <View style={styles.thumbnailStrip}>
              {activeImages.map((item, index) => (
                <TouchableOpacity
                  key={item.imageMetadataId}
                  style={[
                    styles.thumbnail,
                    currentImageIndex === index && styles.thumbnailSelected,
                    thumbnailId === item.imageMetadataId && styles.thumbnailIsCover,
                  ]}
                  onPress={() => handleThumbnailPress(index)}
                >
                  <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
                  {thumbnailId === item.imageMetadataId && (
                    <View style={styles.thumbnailCoverBadge}>
                      <Ionicons name="star" size={8} color="#FFD700" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* Add more button */}
              {activeImages.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => setIsCameraModalVisible(true)}
                >
                  <Ionicons name="add" size={20} color="#FF8C4C" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.separator} />

            {/* Expiration Date */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIsCalendarModalVisible(true)}
            >
              <Ionicons name="time-outline" size={20} color="#4E4E4E" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Expiration Date</Text>
                {expirationDate && (
                  <Text style={styles.optionSubText}>{formatDisplayDate(expirationDate)}</Text>
                )}
              </View>
              {expirationDate ? (
                <TouchableOpacity onPress={handleClearDate}>
                  <Ionicons name="close-circle" size={18} color="#888889" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={12} color="black" />
              )}
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Anonymous Toggle */}
            <View style={styles.optionRow}>
              <MaterialCommunityIcons name="incognito" size={20} color="#606060" />
              <Text style={[styles.optionText, { flex: 1 }]}>Anonymous</Text>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#D2D5DA', true: '#FFA05C' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.separator} />

            {/* Extra Details Section */}
            <View style={styles.optionRow}>
              <Ionicons name="menu-outline" size={20} color="#606060" />
              <Text style={[styles.optionText, { flex: 1 }]}>Extra Details</Text>
            </View>

            <View style={styles.extraDetailsInputContainer}>
              <TextInput
                style={styles.extraDetailsInput}
                value={dealDetails}
                onChangeText={setDealDetails}
                placeholder="Add more details about the deal..."
                placeholderTextColor="#C1C1C1"
                multiline
                maxLength={500}
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Calendar Modal */}
      <CalendarModal
        visible={isCalendarModalVisible}
        onClose={() => setIsCalendarModalVisible(false)}
        onSelect={handleDateSelect}
        selectedDate={expirationDate || undefined}
      />

      {/* Photo Action Modal */}
      <PhotoActionModal
        visible={isCameraModalVisible}
        onClose={() => setIsCameraModalVisible(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromAlbum={handleChooseFromLibrary}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        visible={isCropperVisible}
        imageUri={pendingCropUri || ''}
        aspectRatio={4 / 3}
        onCancel={handleCropCancel}
        onComplete={handleCropComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  backButtonError: {
    marginTop: 12,
    paddingVertical: 12,
  },
  backButtonErrorText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  mainFrame: {
    flex: 1,
    width: '100%',
  },
  mainFrameContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  topButtonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    borderRadius: 30,
    minWidth: 90,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#000000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectedRestaurantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 59,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    borderRadius: 10,
  },
  restaurantTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  selectedRestaurantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 17,
    color: '#000000',
    marginBottom: 2,
  },
  selectedRestaurantAddress: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 17,
    color: '#000000',
  },
  dealContainerWrapper: {
    marginTop: 6,
    flex: 1,
    width: '100%',
  },
  unifiedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
    minHeight: 600,
  },
  dealTitleInputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 4,
    minHeight: 70,
  },
  dealTitleText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
    minHeight: 50,
    textAlignVertical: 'top',
    lineHeight: 20,
    paddingTop: 0,
    paddingLeft: 4,
    includeFontPadding: false,
  },
  characterCount: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#888889',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  extraDetailsInputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 4,
    flex: 1,
    minHeight: 200,
  },
  extraDetailsInput: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
    flex: 1,
    minHeight: 180,
    textAlignVertical: 'top',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingLeft: 2,
    paddingBottom: 12,
    lineHeight: 20,
    includeFontPadding: false,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C1C1C1',
    marginVertical: 4,
  },
  photoCarouselContainer: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  carouselItem: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  editImageButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFF',
    fontFamily: 'Inter',
  },
  coverButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coverButtonActive: {
    backgroundColor: 'rgba(255, 140, 76, 0.9)',
  },
  coverButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFF',
    fontFamily: 'Inter',
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter',
  },
  thumbnailStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: '#FF8C4C',
  },
  thumbnailIsCover: {
    borderColor: '#FFD700',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailCoverBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 2,
  },
  addPhotoButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FF8C4C',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 76, 0.08)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 38,
    paddingVertical: 6,
    gap: 16,
  },
  optionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  optionSubText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#888889',
    marginTop: 2,
  },
});
