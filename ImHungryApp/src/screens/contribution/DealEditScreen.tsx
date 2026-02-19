/**
 * @file DealEditScreen — Edit an existing deal
 *
 * Migrated to the shared contribution form engine (useDealForm) for text
 * fields, validation, and dirty tracking.  Image management remains
 * screen-specific because the edit flow operates on remote images with
 * metadata IDs, pending removals, uploads, and display-order updates.
 *
 * UI uses ALF primitives (Box, Text) and design tokens instead of raw
 * StyleSheet / inline literals.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import CalendarModal from '../../components/CalendarModal';
import PhotoActionModal from '../../components/PhotoActionModal';
import ImageCropperModal from '../../components/ImageCropperModal';
import InstagramPhotoPickerModal, { PhotoWithCrop } from '../../components/InstagramPhotoPickerModal';
import DraggableThumbnailStrip from '../../components/DraggableThumbnailStrip';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { ProfileCacheService } from '../../services/profileCacheService';
import { dealCacheService } from '../../services/dealCacheService';
import { invalidateDealImageCache } from '../deal_feed/DealDetailScreen';
import { clearAllPostsCache } from '../../services/userPostsService';
import { clearFavoritesCache } from '../../services/favoritesService';
import {
  fetchDealForEdit,
  updateDealFields,
  addDealImages,
  removeDealImage,
  setDealThumbnail,
  updateDealImageOrder,
  DealEditData,
} from '../../services/dealService';
import { Box, Text } from '../../ui/primitives';
import {
  BRAND,
  GRAY,
  STATIC,
  ALPHA_COLORS,
  SPACING,
  RADIUS,
  OPACITY,
  ICON_SIZE,
  DIMENSION,
  SEMANTIC,
  SHADOW,
  CAMERA,
} from '../../ui/alf';
import { useDealForm, IMAGES_MAX_COUNT } from '../../features/contribution/engine';
import {
  TitleSection,
  DetailsSection,
  DateRow,
  AnonymousToggle,
  FormDivider,
} from '../../features/contribution/sections';

const { width: screenWidth } = Dimensions.get('window');

type DealEditRouteProp = RouteProp<{ DealEdit: { dealId: string } }, 'DealEdit'>;

/** Image shape used by the edit screen's image management state. */
interface EditImage {
  imageMetadataId: string;
  url: string;
  isNew?: boolean;
  localUri?: string;
  /** The source image we always re-crop from (never changes once set). */
  originalUri?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Outer Shell — handles loading, error states, and data fetching
// ═══════════════════════════════════════════════════════════════════════════════

export default function DealEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<DealEditRouteProp>();
  const { dealId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dealData, setDealData] = useState<DealEditData | null>(null);

  const loadDealData = useCallback(async () => {
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

    console.log('DealEditScreen: Deal loaded successfully:', {
      title: result.data.title,
      imageCount: result.data.images.length,
    });

    setDealData(result.data);
    setIsLoading(false);
  }, [dealId]);

  useEffect(() => {
    loadDealData();
  }, [loadDealData]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
        <StatusBar style="dark" />
        <Box flex={1} center>
          <ActivityIndicator size="large" color={BRAND.accent} />
          <Text
            size="xs"
            color={GRAY[600]}
            mt="lg"
            style={{ fontFamily: 'Inter' }}
          >
            Loading deal...
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
        <StatusBar style="dark" />
        <Box flex={1} center px="2xl">
          <MaterialCommunityIcons name="alert-circle" size={48} color={SEMANTIC.error} />
          <Text
            size="xs"
            color={GRAY[600]}
            mt="lg"
            style={{ textAlign: 'center', fontFamily: 'Inter' }}
          >
            {loadError}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: SPACING['2xl'],
              backgroundColor: ALPHA_COLORS.brandPrimary80,
              paddingHorizontal: SPACING['3xl'],
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.pill,
            }}
            onPress={loadDealData}
          >
            <Text size="xs" color={STATIC.black} style={{ fontFamily: 'Inter' }}>
              Retry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: SPACING.md, paddingVertical: SPACING.md }}
            onPress={() => navigation.goBack()}
          >
            <Text size="xs" color={GRAY[600]} style={{ fontFamily: 'Inter' }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </Box>
      </SafeAreaView>
    );
  }

  return <DealEditForm dealId={dealId} dealData={dealData!} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Inner Form — uses the shared form engine for state + validation
// ═══════════════════════════════════════════════════════════════════════════════

function DealEditForm({
  dealId,
  dealData,
}: {
  dealId: string;
  dealData: DealEditData;
}) {
  const navigation = useNavigation();
  const { setPostAdded } = useDealUpdate();

  // ── Build initial image list from loaded data ─────────────────────────────
  const initialImages = useMemo<EditImage[]>(
    () =>
      [...dealData.images]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((img) => ({
          imageMetadataId: img.imageMetadataId,
          url: img.url,
          isNew: false,
          originalUri: img.url,
        })),
    [dealData],
  );

  // ── Form engine (replaces local title / details / anonymous / date state) ─
  const form = useDealForm({
    mode: 'edit',
    initialValues: {
      title: dealData.title,
      details: dealData.description || '',
      isAnonymous: dealData.isAnonymous,
      expirationDate: dealData.expirationDate,
      imageUris: initialImages.map((img) => img.url),
    },
  });

  // ── Image management (edit-specific: metadata IDs, pending ops) ───────────
  const [images, setImages] = useState<EditImage[]>(initialImages);
  const [pendingNewImages, setPendingNewImages] = useState<string[]>([]);
  const [pendingNewImageTempIds, setPendingNewImageTempIds] = useState<string[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ── UI / modal states ─────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isCropperVisible, setIsCropperVisible] = useState(false);
  const [pendingCropUri, setPendingCropUri] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [isInstagramPickerVisible, setIsInstagramPickerVisible] = useState(false);

  const carouselRef = useRef<FlatList>(null);

  // ── Derived: active images (exclude pending removals) ─────────────────────
  const activeImages = useMemo(
    () => images.filter((img) => !pendingRemovals.includes(img.imageMetadataId)),
    [images, pendingRemovals],
  );

  // ── Keep form.values.imageUris in sync with active images ─────────────────
  const activeImageUrls = useMemo(
    () => activeImages.map((img) => img.url),
    [activeImages],
  );

  const prevUrlsRef = useRef(activeImageUrls);

  useEffect(() => {
    const prev = prevUrlsRef.current;
    const curr = activeImageUrls;
    if (prev.length !== curr.length || prev.some((u, i) => u !== curr[i])) {
      prevUrlsRef.current = curr;
      form.setField('imageUris', curr);
    }
  }, [activeImageUrls]);

  // ── Dirty / changes detection ─────────────────────────────────────────────
  const hasImageChanges = useMemo(() => {
    if (pendingNewImages.length > 0) return true;
    if (pendingRemovals.length > 0) return true;
    const originalOrder = dealData.images?.map((img) => img.imageMetadataId) || [];
    const currentOrder = activeImages
      .filter((img) => !img.isNew)
      .map((img) => img.imageMetadataId);
    return JSON.stringify(originalOrder) !== JSON.stringify(currentOrder);
  }, [pendingNewImages, pendingRemovals, activeImages, dealData]);

  const hasChanges = form.dirty || hasImageChanges;

  // ── Date handlers ─────────────────────────────────────────────────────────
  const handleConfirmDate = (date: string | null) => {
    form.setField('expirationDate', date);
    setIsCalendarModalVisible(false);
  };

  const handleClearDate = () => {
    form.setField('expirationDate', null);
    setIsCalendarModalVisible(false);
  };

  // ── Photo handlers ────────────────────────────────────────────────────────
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
        aspect: CAMERA.aspectRatio as [number, number],
        quality: CAMERA.quality,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingCropUri(result.assets[0].uri);
        setEditingImageId(null); // New image, not editing
        setIsCropperVisible(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleChooseFromLibrary = () => {
    setIsCameraModalVisible(false);
    setIsInstagramPickerVisible(true);
  };

  // Handle photos selected from Instagram-style picker
  const handleInstagramPickerDone = (photos: PhotoWithCrop[]) => {
    setIsInstagramPickerVisible(false);
    if (photos.length > 0) {
      // Open cropper for the first photo (using the full original URI)
      setPendingCropUri(photos[0].uri);
      setEditingImageId(null);
      setIsCropperVisible(true);
    }
  };

  // Handle crop completion
  const handleCropComplete = (croppedUri: string) => {
    if (editingImageId) {
      const idx = images.findIndex((img) => img.imageMetadataId === editingImageId);
      if (idx === -1) {
        addNewImage(croppedUri, pendingCropUri || croppedUri);
      } else {
        const target = images[idx];
        const originalUri = target.originalUri || target.localUri || target.url;

        if (target.isNew) {
          // Re-cropping a local (not yet uploaded) image
          setImages((prev) => {
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
          setPendingNewImages((prev) => {
            const copy = [...prev];
            const i = copy.findIndex((u) => u === target.localUri);
            if (i !== -1) copy[i] = croppedUri;
            return copy;
          });
        } else {
          // Cropping an already-uploaded image: mark old for removal and add temp replacement
          const tempId = `new_${Date.now()}`;
          const targetIndex = images.findIndex(
            (img) => img.imageMetadataId === target.imageMetadataId,
          );

          setPendingRemovals((prev) =>
            prev.includes(target.imageMetadataId) ? prev : [...prev, target.imageMetadataId],
          );
          setPendingNewImages((prev) => [...prev, croppedUri]);
          setPendingNewImageTempIds((prev) => [...prev, tempId]);

          // Insert the new image at the same position as the old one
          setImages((prev) => {
            const newImages = [...prev];
            const insertIndex = targetIndex !== -1 ? targetIndex + 1 : prev.length;
            newImages.splice(insertIndex, 0, {
              imageMetadataId: tempId,
              url: croppedUri,
              isNew: true,
              localUri: croppedUri,
              originalUri,
            });
            return newImages;
          });
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
    if (totalImages >= IMAGES_MAX_COUNT) {
      Alert.alert('Limit Reached', `You can only have up to ${IMAGES_MAX_COUNT} photos.`);
      return;
    }

    const tempId = `new_${Date.now()}`;
    setImages((prev) => [
      ...prev,
      {
        imageMetadataId: tempId,
        url: displayUri,
        isNew: true,
        localUri: displayUri,
        originalUri: originalUri || displayUri,
      },
    ]);
    setPendingNewImages((prev) => [...prev, displayUri]);
    setPendingNewImageTempIds((prev) => [...prev, tempId]);
  };

  const handleRemoveImage = (imageMetadataId: string) => {
    if (activeImages.length <= 1) {
      Alert.alert('Cannot Remove', 'Your deal must have at least one photo.');
      return;
    }

    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const imageToRemove = images.find((img) => img.imageMetadataId === imageMetadataId);

          if (imageToRemove?.isNew) {
            // Remove from pending new images
            setPendingNewImages((prevUris) => {
              const idx = prevUris.findIndex((u) => u === imageToRemove.localUri);
              if (idx === -1) return prevUris;
              setPendingNewImageTempIds((prevTempIds) =>
                prevTempIds.filter((_, i) => i !== idx),
              );
              return prevUris.filter((_, i) => i !== idx);
            });
            setImages((prev) =>
              prev.filter((img) => img.imageMetadataId !== imageMetadataId),
            );
          } else {
            // Mark for removal (will be deleted on save)
            setPendingRemovals((prev) => [...prev, imageMetadataId]);
          }

          // Adjust current index if needed
          const remainingImages = images.filter(
            (img) =>
              img.imageMetadataId !== imageMetadataId &&
              !pendingRemovals.includes(img.imageMetadataId),
          );
          if (currentImageIndex >= remainingImages.length) {
            setCurrentImageIndex(Math.max(0, remainingImages.length - 1));
          }
        },
      },
    ]);
  };

  // Handle drag-and-drop reorder from thumbnail strip
  const handleReorderImages = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      const targetIdx = toIndex;

      setImages((prev) => {
        const currentActiveImages = prev.filter(
          (img) => !pendingRemovals.includes(img.imageMetadataId),
        );

        if (
          fromIndex < 0 ||
          fromIndex >= currentActiveImages.length ||
          toIndex < 0 ||
          toIndex >= currentActiveImages.length
        ) {
          console.warn('Invalid reorder indices:', {
            fromIndex,
            toIndex,
            activeCount: currentActiveImages.length,
          });
          return prev;
        }

        const fromImage = currentActiveImages[fromIndex];
        if (!fromImage) {
          console.warn('Could not find image at fromIndex:', fromIndex);
          return prev;
        }

        const newActiveImages = [...currentActiveImages];
        newActiveImages.splice(fromIndex, 1);
        newActiveImages.splice(toIndex, 0, fromImage);

        const removedImages = prev.filter((img) =>
          pendingRemovals.includes(img.imageMetadataId),
        );
        return [...newActiveImages, ...removedImages];
      });

      setCurrentImageIndex(targetIdx);
      requestAnimationFrame(() => {
        carouselRef.current?.scrollToIndex({ index: targetIdx, animated: false });
      });
    },
    [pendingRemovals],
  );

  const handleThumbnailPress = (index: number) => {
    setCurrentImageIndex(index);
    carouselRef.current?.scrollToIndex({ index, animated: true });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const result = form.validate();
    if (!result.valid) {
      Alert.alert('Missing Information', result.errors[0].message);
      return;
    }

    setIsSaving(true);

    try {
      const { values } = form;

      // 1. Update text fields
      const fieldsResult = await updateDealFields(dealId, {
        title: values.title,
        description: values.details || undefined,
        expirationDate: values.expirationDate,
        isAnonymous: values.isAnonymous,
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

      // 3. Add new images - track uploaded IDs for order update
      const uploadedImageMap = new Map<string, string>(); // tempId → uploadedId

      if (pendingNewImages.length > 0) {
        const addResult = await addDealImages(dealId, pendingNewImages);
        if (!addResult.success) {
          console.warn('Some images failed to upload:', addResult.error);
        } else if (addResult.newImages && addResult.newImages.length > 0) {
          // Map temp IDs to uploaded IDs
          const mappedCount = Math.min(
            addResult.newImages.length,
            pendingNewImageTempIds.length,
          );
          for (let i = 0; i < mappedCount; i++) {
            const tempId = pendingNewImageTempIds[i];
            const uploaded = addResult.newImages[i];
            uploadedImageMap.set(tempId, uploaded.imageMetadataId);
          }

          setImages((prev) => {
            const updated = [...prev];
            for (let i = 0; i < mappedCount; i++) {
              const tempId = pendingNewImageTempIds[i];
              const uploaded = addResult.newImages![i];
              const idx = updated.findIndex((img) => img.imageMetadataId === tempId);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  imageMetadataId: uploaded.imageMetadataId,
                  url: uploaded.url,
                  isNew: false,
                  localUri: undefined,
                };
              }
            }
            return updated;
          });
        }
      }

      // 4. Update display_order for all images based on current array order
      const currentActiveImages = images.filter(
        (img) => !pendingRemovals.includes(img.imageMetadataId),
      );
      const imageOrder = currentActiveImages
        .map((img, index) => {
          const resolvedId =
            uploadedImageMap.get(img.imageMetadataId) || img.imageMetadataId;
          return { imageMetadataId: resolvedId, displayOrder: index };
        })
        .filter((item) => !item.imageMetadataId.startsWith('new_'));

      if (imageOrder.length > 0) {
        await updateDealImageOrder(dealId, imageOrder);

        // 5. Set the first image as the thumbnail
        const firstImageId = imageOrder[0].imageMetadataId;
        await setDealThumbnail(dealId, firstImageId);
      }

      // Invalidate all caches to ensure fresh data everywhere
      invalidateDealImageCache(dealId);
      clearAllPostsCache();
      clearFavoritesCache();

      await ProfileCacheService.forceRefresh();
      await dealCacheService.invalidateAndRefresh();

      setPostAdded(true);

      Alert.alert('Success', 'Your deal has been updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving deal:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GRAY[100] }}>
      <StatusBar style="dark" />

      <KeyboardAwareScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{
          paddingBottom: SPACING.xl,
          paddingHorizontal: SPACING.md,
        }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={DIMENSION.extraScrollHeight}
      >
        {/* Top Button Row */}
        <Box row justify="space-between" align="center" mb="sm">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: DIMENSION.hitArea,
              height: DIMENSION.hitArea,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: RADIUS.circle,
            }}
          >
            <Ionicons name="arrow-back" size={ICON_SIZE.sm} color={STATIC.black} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: SPACING.sm,
              paddingHorizontal: SPACING.lg,
              backgroundColor: ALPHA_COLORS.brandPrimary80,
              borderRadius: RADIUS.pill,
              minWidth: DIMENSION.buttonMinWidth,
              opacity: isSaving || !hasChanges ? OPACITY.disabled : OPACITY.full,
            }}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={STATIC.black} />
            ) : (
              <Text
                size="xs"
                color={!hasChanges ? GRAY[500] : STATIC.black}
                style={{ fontFamily: 'Inter', fontWeight: '400' }}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </Box>

        {/* Restaurant Info (read-only) */}
        <Box
          row
          align="center"
          py="lg"
          px="lg"
          h={DIMENSION.restaurantBarHeight}
          bg={ALPHA_COLORS.whiteCard93}
          rounded={RADIUS.card}
        >
          <Box flex={1} mr="lg">
            <Text
              size="xs"
              weight="bold"
              color={STATIC.black}
              style={{
                lineHeight: DIMENSION.compactLineHeight,
                marginBottom: SPACING['2xs'],
              }}
            >
              {dealData.restaurantName}
            </Text>
            <Text
              size="xs"
              color={STATIC.black}
              style={{ lineHeight: DIMENSION.compactLineHeight }}
            >
              {dealData.restaurantAddress}
            </Text>
          </Box>
          <MaterialCommunityIcons name="store" size={ICON_SIZE.sm} color={BRAND.primary} />
        </Box>

        {/* Main Content Container */}
        <Box mt={6} flex={1}>
          <Box
            bg={STATIC.white}
            rounded={RADIUS.card}
            py="md"
            flex={1}
            minH={DIMENSION.formMinHeight}
          >
            {/* Deal Title Section */}
            <TitleSection
              value={form.values.title}
              onChangeText={(text) => form.setField('title', text)}
              placeholder="e.g., 50% off all pizzas"
            />

            <FormDivider />

            {/* Photos Section Header */}
            <Box row gap="lg" py={6} px="lg" align="center" style={{ minHeight: 38 }}>
              <Ionicons name="camera-outline" size={ICON_SIZE.sm} color={GRAY[800]} />
              <Text size="xs" color={STATIC.black}>
                Photos ({activeImages.length}/{IMAGES_MAX_COUNT})
              </Text>
            </Box>

            {/* Photo Carousel */}
            <Box
              mx="lg"
              rounded={RADIUS.card}
              style={{
                height: 350,
                overflow: 'hidden',
                backgroundColor: GRAY[100],
                borderWidth: 0.5,
                borderColor: GRAY[475],
              }}
            >
              {activeImages.length > 0 ? (
                <FlatList
                  ref={carouselRef}
                  data={activeImages}
                  extraData={currentImageIndex}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={screenWidth - 48}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  initialScrollIndex={currentImageIndex}
                  maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                  onMomentumScrollEnd={(event) => {
                    const carouselWidth = screenWidth - 48;
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / carouselWidth,
                    );
                    if (index >= 0 && index < activeImages.length) {
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
                    <Box
                      style={{
                        width: screenWidth - 48,
                        height: 350,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      {/* Delete button */}
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: SPACING.md,
                          right: SPACING.md,
                          ...SHADOW.sm,
                        }}
                        onPress={() => handleRemoveImage(item.imageMetadataId)}
                      >
                        <Ionicons name="close-circle" size={26} color={SEMANTIC.error} />
                      </TouchableOpacity>
                      {/* Edit / Crop button */}
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: SPACING.sm,
                          left: SPACING.sm,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 14,
                          gap: SPACING.xs,
                        }}
                        onPress={() => handleEditImage(index)}
                      >
                        <Ionicons name="crop" size={14} color={STATIC.white} />
                        <Text
                          size="xs"
                          color={STATIC.white}
                          style={{ fontSize: 11, fontWeight: '500', fontFamily: 'Inter' }}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </Box>
                  )}
                />
              ) : (
                <Box flex={1} center>
                  <Ionicons name="image-outline" size={40} color={GRAY[350]} />
                  <Text
                    size="xs"
                    color={GRAY[500]}
                    mt="sm"
                    style={{ fontFamily: 'Inter' }}
                  >
                    No photos
                  </Text>
                </Box>
              )}
            </Box>

            {/* Draggable thumbnail strip — drag to reorder, first image is cover */}
            <GestureHandlerRootView>
              <DraggableThumbnailStrip
                images={activeImages}
                currentIndex={currentImageIndex}
                onThumbnailPress={handleThumbnailPress}
                onReorder={handleReorderImages}
                onAddPress={() => setIsCameraModalVisible(true)}
                maxPhotos={IMAGES_MAX_COUNT}
              />
            </GestureHandlerRootView>

            <FormDivider />

            {/* Expiration Date */}
            <DateRow
              expirationDate={form.values.expirationDate}
              onPress={() => setIsCalendarModalVisible(true)}
              onClear={handleClearDate}
            />

            <FormDivider />

            {/* Anonymous Toggle */}
            <AnonymousToggle
              value={form.values.isAnonymous}
              onValueChange={(val) => form.setField('isAnonymous', val)}
            />

            <FormDivider />

            {/* Extra Details */}
            <DetailsSection
              value={form.values.details}
              onChangeText={(text) => form.setField('details', text)}
              placeholder="Add more details about the deal..."
            />
          </Box>
        </Box>
      </KeyboardAwareScrollView>

      {/* Calendar Modal */}
      <CalendarModal
        visible={isCalendarModalVisible}
        onClose={() => setIsCalendarModalVisible(false)}
        onConfirm={handleConfirmDate}
        initialDate={form.values.expirationDate}
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
        aspectRatio={(screenWidth - 48) / 350}
        onCancel={handleCropCancel}
        onComplete={handleCropComplete}
      />

      {/* Instagram Photo Picker Modal */}
      <InstagramPhotoPickerModal
        visible={isInstagramPickerVisible}
        onClose={() => setIsInstagramPickerVisible(false)}
        onDone={handleInstagramPickerDone}
        maxPhotos={IMAGES_MAX_COUNT}
        existingPhotosCount={activeImages.length}
      />
    </SafeAreaView>
  );
}
