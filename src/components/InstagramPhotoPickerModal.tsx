import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    FlatList,
    Dimensions,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';

import { BRAND, STATIC, GRAY, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, ALPHA_COLORS } from '../ui/alf';

// Transform state for each photo's crop
interface PhotoTransformState {
    scale: number;
    translateX: number;
    translateY: number;
    imageScaledHeight: number;
    isPortrait: boolean;
}

// Crop region in normalized coordinates (0-1) for passing to other components
export interface CropRegion {
    // Normalized coordinates (0-1) relative to the original image
    x: number;      // Left edge (0 = left, 1 = right)
    y: number;      // Top edge (0 = top, 1 = bottom)
    width: number;  // Width as fraction of original (0-1)
    height: number; // Height as fraction of original (0-1)
}

// Photo with crop information
export interface PhotoWithCrop {
    uri: string;
    originalWidth: number;
    originalHeight: number;
    cropRegion: CropRegion;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_COLUMNS = 4;
const GRID_SPACING = 2;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - (GRID_COLUMNS + 1) * GRID_SPACING) / GRID_COLUMNS;
const MAX_PHOTOS = 5;

// Preview area dimensions
const MAX_PREVIEW_HEIGHT = SCREEN_WIDTH; // Maximum preview height
const MIN_PREVIEW_HEIGHT = 100; // Collapsed preview height
const ALBUM_ROW_HEIGHT = 50; // Height of the album selector row with drag handle

interface InstagramPhotoPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onDone: (photos: PhotoWithCrop[]) => void;
    maxPhotos?: number;
    existingPhotosCount?: number;
}

interface Album {
    id: string;
    title: string;
    assetCount: number;
}

interface PhotoAsset {
    id: string;
    uri: string;
    width: number;
    height: number;
}

const InstagramPhotoPickerModal: React.FC<InstagramPhotoPickerModalProps> = ({
    visible,
    onClose,
    onDone,
    maxPhotos = MAX_PHOTOS,
    existingPhotosCount = 0,
}) => {
    // State
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [photos, setPhotos] = useState<PhotoAsset[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [previewPhoto, setPreviewPhoto] = useState<PhotoAsset | null>(null);
    const [showAlbumPicker, setShowAlbumPicker] = useState(false);
    const [isMultiSelectEnabled, setIsMultiSelectEnabled] = useState(false);
    const [isCurrentPhotoPortrait, setIsCurrentPhotoPortrait] = useState(false);
    const [isCropping, setIsCropping] = useState(false);

    // Store transform state per photo ID for preserving crops
    const photoTransforms = useRef<Map<string, PhotoTransformState>>(new Map());

    // Pagination
    const endCursor = useRef<string | undefined>(undefined);
    const PAGE_SIZE = 50;

    // Gesture values for preview zoom/pan
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Image dimensions (scaled to fill width) for pan bounds calculation
    const imageScaledHeight = useSharedValue(MAX_PREVIEW_HEIGHT);
    const isPortrait = useSharedValue(false); // true if image is taller than container

    // Expandable preview values
    const previewHeight = useSharedValue(MAX_PREVIEW_HEIGHT);
    const isExpanded = useSharedValue(false);
    const dragStartY = useSharedValue(0);

    // Track if expanded for React state (needed for FlatList)
    const [isGridExpanded, setIsGridExpanded] = useState(false);

    // Calculate available slots
    const availableSlots = maxPhotos - existingPhotosCount;

    // Request permissions
    useEffect(() => {
        if (visible) {
            (async () => {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                setHasPermission(status === 'granted');
                if (status === 'granted') {
                    loadAlbums();
                    loadPhotos();
                }
            })();
        }
    }, [visible]);


    useEffect(() => {
        if (visible) {
            setSelectedPhotos([]);
            setPreviewPhoto(null);
            setIsMultiSelectEnabled(false);
            setIsGridExpanded(false);
            setIsCropping(false);
            resetGestures();
            resetExpandState();
            endCursor.current = undefined;
            setHasMore(true);
            photoTransforms.current.clear(); // Clear saved transforms
        }
    }, [visible]);

    const resetGestures = () => {
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    };

    // Save current transform state for a photo
    const saveTransformState = (photoId: string) => {
        photoTransforms.current.set(photoId, {
            scale: scale.value,
            translateX: translateX.value,
            translateY: translateY.value,
            imageScaledHeight: imageScaledHeight.value,
            isPortrait: isPortrait.value,
        });
    };

    // Restore transform state for a photo (or reset if none saved)
    const restoreTransformState = (photoId: string, photo: PhotoAsset) => {
        const saved = photoTransforms.current.get(photoId);
        if (saved) {
            scale.value = saved.scale;
            savedScale.value = saved.scale;
            translateX.value = saved.translateX;
            translateY.value = saved.translateY;
            savedTranslateX.value = saved.translateX;
            savedTranslateY.value = saved.translateY;
            imageScaledHeight.value = saved.imageScaledHeight;
            isPortrait.value = saved.isPortrait;
            setIsCurrentPhotoPortrait(saved.isPortrait);
        } else {
            // No saved state, calculate fresh dimensions and reset gestures
            resetGestures();
            updateImageDimensions(photo);
        }
    };

    // Update image dimensions when photo changes (for proper pan bounds)
    const updateImageDimensions = (photo: PhotoAsset) => {
        if (!photo.width || !photo.height) {
            imageScaledHeight.value = MAX_PREVIEW_HEIGHT;
            isPortrait.value = false;
            setIsCurrentPhotoPortrait(false);
            return;
        }
        // Scale image to fill width
        const aspectRatio = photo.height / photo.width;
        const scaledHeight = SCREEN_WIDTH * aspectRatio;
        imageScaledHeight.value = scaledHeight;
        const photoIsPortrait = scaledHeight > MAX_PREVIEW_HEIGHT;
        isPortrait.value = photoIsPortrait;
        setIsCurrentPhotoPortrait(photoIsPortrait);
    };

    const resetExpandState = () => {
        previewHeight.value = MAX_PREVIEW_HEIGHT;
        isExpanded.value = false;
        setIsGridExpanded(false);
    };

    // Load albums
    const loadAlbums = async () => {
        try {
            const albumList = await MediaLibrary.getAlbumsAsync({
                includeSmartAlbums: true,
            });
            const formattedAlbums: Album[] = albumList
                .filter(album => album.assetCount > 0)
                .map(album => ({
                    id: album.id,
                    title: album.title,
                    assetCount: album.assetCount,
                }));
            setAlbums(formattedAlbums);
        } catch (error) {
            console.error('Error loading albums:', error);
        }
    };

    // Load photos from camera roll
    const loadPhotos = async (albumId?: string, reset = true) => {
        if (reset) {
            setIsLoading(true);
            endCursor.current = undefined;
        } else {
            setIsLoadingMore(true);
        }

        try {
            const options: MediaLibrary.AssetsOptions = {
                first: PAGE_SIZE,
                mediaType: 'photo',
                sortBy: [MediaLibrary.SortBy.creationTime],
            };

            if (albumId) {
                options.album = albumId;
            }

            if (!reset && endCursor.current) {
                options.after = endCursor.current;
            }

            const result = await MediaLibrary.getAssetsAsync(options);

            const formattedPhotos: PhotoAsset[] = result.assets.map(asset => ({
                id: asset.id,
                uri: asset.uri,
                width: asset.width,
                height: asset.height,
            }));

            if (reset) {
                setPhotos(formattedPhotos);
                if (formattedPhotos.length > 0) {
                    setPreviewPhoto(formattedPhotos[0]);
                    updateImageDimensions(formattedPhotos[0]);
                }
            } else {
                setPhotos(prev => [...prev, ...formattedPhotos]);
            }

            endCursor.current = result.endCursor;
            setHasMore(result.hasNextPage);
        } catch (error) {
            console.error('Error loading photos:', error);
            Alert.alert('Error', 'Failed to load photos from your library.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Handle photo selection - store asset IDs for later retrieval of original photos
    const handlePhotoPress = (photo: PhotoAsset) => {
        // Save current photo's transform state before switching
        if (previewPhoto) {
            saveTransformState(previewPhoto.id);
        }

        setPreviewPhoto(photo);

        // Restore saved transform state for this photo, or initialize fresh
        restoreTransformState(photo.id, photo);

        if (isMultiSelectEnabled) {
            // Multi-select mode: toggle selection (using asset ID)
            const isSelected = selectedPhotos.includes(photo.id);
            if (isSelected) {
                setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
            } else {
                if (selectedPhotos.length < availableSlots) {
                    setSelectedPhotos(prev => [...prev, photo.id]);
                } else {
                    Alert.alert('Limit Reached', `You can only select up to ${availableSlots} photo${availableSlots !== 1 ? 's' : ''}.`);
                }
            }
        } else {
            // Single select mode: replace selection (using asset ID)
            setSelectedPhotos([photo.id]);
        }
    };

    // Toggle multi-select mode
    const handleToggleMultiSelect = () => {
        if (isMultiSelectEnabled) {
            // Turning off multi-select: keep only first photo
            if (selectedPhotos.length > 1) {
                setSelectedPhotos([selectedPhotos[0]]);
            }
        }
        setIsMultiSelectEnabled(!isMultiSelectEnabled);
    };

    // Handle album selection
    const handleAlbumSelect = (albumId: string | null) => {
        setSelectedAlbum(albumId);
        setShowAlbumPicker(false);
        loadPhotos(albumId || undefined, true);
    };

    // Calculate normalized crop region (0-1) for a photo based on its transform state
    const calculateCropRegion = (
        photo: PhotoAsset,
        transform: PhotoTransformState
    ): CropRegion => {
        const { scale: photoScale, translateX: tx, translateY: ty, imageScaledHeight: scaledHeight } = transform;

        // Conversion factor from displayed coordinates to original image coordinates
        const conversionFactor = photo.width / (SCREEN_WIDTH * photoScale);

        // Calculate crop origin in displayed image coordinates, then convert to original
        const displayCropX = (SCREEN_WIDTH * photoScale - SCREEN_WIDTH) / 2 - tx;
        const displayCropY = (scaledHeight * photoScale - MAX_PREVIEW_HEIGHT) / 2 - ty;

        let originX = displayCropX * conversionFactor;
        let originY = displayCropY * conversionFactor;
        let cropWidth = SCREEN_WIDTH * conversionFactor;
        let cropHeight = MAX_PREVIEW_HEIGHT * conversionFactor;

        // Clamp to image bounds
        originX = Math.max(0, Math.min(originX, photo.width - cropWidth));
        originY = Math.max(0, Math.min(originY, photo.height - cropHeight));
        cropWidth = Math.min(cropWidth, photo.width - originX);
        cropHeight = Math.min(cropHeight, photo.height - originY);

        // Convert to normalized coordinates (0-1)
        return {
            x: originX / photo.width,
            y: originY / photo.height,
            width: cropWidth / photo.width,
            height: cropHeight / photo.height,
        };
    };

    // Handle done - return full original images with crop information
    const handleDone = async () => {
        if (selectedPhotos.length === 0) {
            Alert.alert('No Photos Selected', 'Please select at least one photo.');
            return;
        }

        // Save current preview photo's transform state
        if (previewPhoto) {
            saveTransformState(previewPhoto.id);
        }

        setIsCropping(true);

        try {
            const photosWithCrop = await Promise.all(
                selectedPhotos.map(async (assetId) => {
                    try {
                        // Get the photo asset and its saved transform state
                        const photo = photos.find(p => p.id === assetId);
                        if (!photo) {
                            throw new Error(`Photo not found: ${assetId}`);
                        }

                        // Fetch the full asset info to get localUri (full original image)
                        const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
                        const sourceUri = assetInfo.localUri || assetInfo.uri;

                        // Get the saved transform state for this photo
                        let transform = photoTransforms.current.get(assetId);

                        // If no saved transform, create a default one (center crop for portrait, full for landscape)
                        if (!transform) {
                            const aspectRatio = photo.height / photo.width;
                            const scaledHeight = SCREEN_WIDTH * aspectRatio;
                            const photoIsPortrait = scaledHeight > MAX_PREVIEW_HEIGHT;
                            transform = {
                                scale: 1,
                                translateX: 0,
                                translateY: 0,
                                imageScaledHeight: scaledHeight,
                                isPortrait: photoIsPortrait,
                            };
                        }

                        // Calculate normalized crop region
                        const cropRegion = calculateCropRegion(photo, transform);

                        return {
                            uri: sourceUri,
                            originalWidth: photo.width,
                            originalHeight: photo.height,
                            cropRegion,
                        } as PhotoWithCrop;
                    } catch (err) {
                        console.error(`Error processing photo ${assetId}:`, err);
                        // Fallback with default crop
                        const photo = photos.find(p => p.id === assetId);
                        return {
                            uri: photo?.uri || '',
                            originalWidth: photo?.width || 0,
                            originalHeight: photo?.height || 0,
                            cropRegion: { x: 0, y: 0, width: 1, height: 1 },
                        } as PhotoWithCrop;
                    }
                })
            );

            // Filter out any with empty URIs
            const validPhotos = photosWithCrop.filter(p => p.uri.length > 0);
            onDone(validPhotos);
        } catch (error) {
            console.error('Error processing photos:', error);
            Alert.alert('Error', 'Failed to process photos. Please try again.');
        } finally {
            setIsCropping(false);
        }
    };

    // Load more photos on scroll
    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            loadPhotos(selectedAlbum || undefined, false);
        }
    };

    // Get selection index for a photo (using asset ID)
    const getSelectionIndex = (id: string): number => {
        return selectedPhotos.indexOf(id) + 1;
    };

    // Gestures for preview
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            'worklet';
            scale.value = Math.min(4, Math.max(1, savedScale.value * event.scale));
        })
        .onEnd(() => {
            'worklet';
            savedScale.value = scale.value;
            // Snap back if below 1
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
            }
        });

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            'worklet';
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
            'worklet';
            const containerHeight = previewHeight.value;
            const scaledImgHeight = imageScaledHeight.value * scale.value;
            const scaledImgWidth = SCREEN_WIDTH * scale.value;

            // Calculate max pan for X (horizontal)
            // Only allow horizontal pan if scaled image is wider than container
            const overflowX = Math.max(0, scaledImgWidth - SCREEN_WIDTH);
            const maxTranslateX = overflowX / 2;

            // Calculate max pan for Y (vertical)
            // For portrait images: allow panning even at scale 1 since image is taller
            // The image overflows the container, so we can pan to see top/bottom
            const overflowY = Math.max(0, scaledImgHeight - containerHeight);
            const maxTranslateY = overflowY / 2;

            const clampedX = Math.min(maxTranslateX, Math.max(-maxTranslateX, translateX.value));
            const clampedY = Math.min(maxTranslateY, Math.max(-maxTranslateY, translateY.value));

            translateX.value = withSpring(clampedX);
            translateY.value = withSpring(clampedY);
            savedTranslateX.value = clampedX;
            savedTranslateY.value = clampedY;
        });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedPreviewStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    // Sync expanded state to React
    const updateExpandedState = useCallback((expanded: boolean) => {
        setIsGridExpanded(expanded);
    }, []);

    // Expand/collapse gesture for the divider - swipe up to collapse, swipe down to expand
    const expandGesture = Gesture.Pan()
        .onStart(() => {
            'worklet';
            dragStartY.value = previewHeight.value;
        })
        .onUpdate((event) => {
            'worklet';
            // Swipe up (negative translationY) = shrink preview, swipe down = expand preview
            const newHeight = dragStartY.value + event.translationY;
            const dampingFactor = 0.4;

            if (newHeight > MAX_PREVIEW_HEIGHT) {
                // Rubber band when trying to expand past max
                const overscroll = newHeight - MAX_PREVIEW_HEIGHT;
                previewHeight.value = MAX_PREVIEW_HEIGHT + overscroll * dampingFactor;
            } else if (newHeight < MIN_PREVIEW_HEIGHT) {
                // Rubber band when trying to collapse past min
                const overscroll = MIN_PREVIEW_HEIGHT - newHeight;
                previewHeight.value = MIN_PREVIEW_HEIGHT - overscroll * dampingFactor;
            } else {
                previewHeight.value = newHeight;
            }
        })
        .onEnd((event) => {
            'worklet';
            const velocity = event.velocityY;
            const threshold = MAX_PREVIEW_HEIGHT / 2;

            // Spring config that responds to velocity
            const springConfig = {
                damping: 20,
                mass: 1,
                stiffness: 200,
                velocity: velocity / 1000,
            };

            // Snap based on position and velocity
            // Swipe up fast (negative velocity) or past threshold = collapse
            if (previewHeight.value < threshold || velocity < -500) {
                // Collapse
                previewHeight.value = withSpring(MIN_PREVIEW_HEIGHT, springConfig);
                isExpanded.value = true;
                runOnJS(updateExpandedState)(true);
            } else {
                // Expand back to max height
                previewHeight.value = withSpring(MAX_PREVIEW_HEIGHT, springConfig);
                isExpanded.value = false;
                runOnJS(updateExpandedState)(false);
            }
        });

    // Animated style for preview container
    const animatedPreviewContainerStyle = useAnimatedStyle(() => ({
        height: previewHeight.value,
    }));

    // Animated style for the preview image
    // For portrait images: fill width, height exceeds container (allows vertical panning)
    // For landscape images: fit within container (centered with letterboxing)
    const animatedPreviewImageStyle = useAnimatedStyle(() => {
        if (isPortrait.value) {
            // Portrait: fill width, use actual scaled height (taller than container)
            return {
                width: SCREEN_WIDTH,
                height: imageScaledHeight.value,
            };
        } else {
            // Landscape/square: use contain behavior - full image visible
            return {
                width: SCREEN_WIDTH,
                height: MAX_PREVIEW_HEIGHT,
            };
        }
    });

    // Render photo grid item
    const renderPhotoItem = ({ item }: { item: PhotoAsset }) => {
        const selectionIndex = getSelectionIndex(item.id);
        const isSelected = selectionIndex > 0;

        return (
            <TouchableOpacity
                style={styles.gridItem}
                onPress={() => handlePhotoPress(item)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: item.uri }} style={styles.gridImage} />
                {isSelected && (
                    <View style={styles.selectionBadge}>
                        <Text style={styles.selectionBadgeText}>{selectionIndex}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Render album picker
    const renderAlbumPicker = () => (
        <Modal
            visible={showAlbumPicker}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowAlbumPicker(false)}
        >
            <View style={styles.albumPickerOverlay}>
                <View style={styles.albumPickerContainer}>
                    <View style={styles.albumPickerHeader}>
                        <Text style={styles.albumPickerTitle}>Select Album</Text>
                        <TouchableOpacity onPress={() => setShowAlbumPicker(false)}>
                            <Ionicons name="close" size={24} color={STATIC.black} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.albumItem,
                            selectedAlbum === null && styles.albumItemSelected,
                        ]}
                        onPress={() => handleAlbumSelect(null)}
                    >
                        <Text style={styles.albumItemText}>Recents</Text>
                        <Text style={styles.albumItemCount}>All Photos</Text>
                    </TouchableOpacity>
                    <FlatList
                        data={albums}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.albumItem,
                                    selectedAlbum === item.id && styles.albumItemSelected,
                                ]}
                                onPress={() => handleAlbumSelect(item.id)}
                            >
                                <Text style={styles.albumItemText}>{item.title}</Text>
                                <Text style={styles.albumItemCount}>{item.assetCount}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    // Permission denied view
    if (hasPermission === false) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={STATIC.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <View style={styles.permissionDenied}>
                        <Ionicons name="images-outline" size={64} color={GRAY[350]} />
                        <Text style={styles.permissionText}>
                            Access to your photo library is required to select photos.
                        </Text>
                        <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={() => MediaLibrary.requestPermissionsAsync()}
                        >
                            <Text style={styles.permissionButtonText}>Grant Access</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={false}
        >
            <GestureHandlerRootView style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar style="dark" />

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={onClose}
                            disabled={isCropping}
                        >
                            <Ionicons name="close" size={28} color={isCropping ? GRAY[350] : STATIC.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleDone}
                            disabled={isCropping}
                        >
                            {isCropping ? (
                                <ActivityIndicator size="small" color={BRAND.accent} />
                            ) : (
                                <Text style={styles.nextText}>Next</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Preview Area */}
                    <Animated.View style={[styles.previewContainer, animatedPreviewContainerStyle]}>
                        {previewPhoto ? (
                            <GestureDetector gesture={composedGesture}>
                                <Animated.View style={[styles.previewImageWrapper, animatedPreviewStyle]}>
                                    <Animated.Image
                                        source={{ uri: previewPhoto.uri }}
                                        style={[styles.previewImage, animatedPreviewImageStyle]}
                                        resizeMode={isCurrentPhotoPortrait ? "cover" : "contain"}
                                    />
                                </Animated.View>
                            </GestureDetector>
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <Ionicons name="image-outline" size={48} color={GRAY[350]} />
                            </View>
                        )}
                    </Animated.View>

                    {/* Drag Handle + Album Selector Row */}
                    <GestureDetector gesture={expandGesture}>
                        <Animated.View style={styles.dragHandleContainer}>
                            {/* Album Selector Row */}
                            <View style={styles.albumSelectorRow}>
                                <TouchableOpacity
                                    style={styles.albumSelector}
                                    onPress={() => setShowAlbumPicker(true)}
                                >
                                    <Text style={styles.albumSelectorText}>
                                        {albums.find(a => a.id === selectedAlbum)?.title || 'Recents'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color={STATIC.black} />
                                </TouchableOpacity>

                                {/* Multi-select toggle */}
                                <TouchableOpacity
                                    style={[
                                        styles.multiSelectButton,
                                        isMultiSelectEnabled && styles.multiSelectButtonActive
                                    ]}
                                    onPress={handleToggleMultiSelect}
                                >
                                    <Ionicons
                                        name="copy-outline"
                                        size={18}
                                        color={isMultiSelectEnabled ? BRAND.accent : GRAY[600]}
                                    />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </GestureDetector>

                    {/* Photo Grid */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={BRAND.accent} />
                        </View>
                    ) : (
                        <FlatList
                            data={photos}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPhotoItem}
                            numColumns={GRID_COLUMNS}
                            contentContainerStyle={styles.gridContainer}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                isLoadingMore ? (
                                    <View style={styles.loadingMore}>
                                        <ActivityIndicator size="small" color={BRAND.accent} />
                                    </View>
                                ) : null
                            }
                        />
                    )}

                    {/* Selection Counter - only show when multi-select is enabled */}
                    {isMultiSelectEnabled && selectedPhotos.length > 0 && (
                        <View style={styles.selectionCounter}>
                            <Text style={styles.selectionCounterText}>
                                {selectedPhotos.length} / {availableSlots} selected
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </GestureHandlerRootView>

            {renderAlbumPicker()}
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: STATIC.white,
    },
    safeArea: {
        flex: 1,
        backgroundColor: STATIC.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: STATIC.white,
        borderBottomWidth: 1,
        borderBottomColor: GRAY[300],
    },
    headerButton: {
        minWidth: 60,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        color: STATIC.black,
    },
    nextText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: BRAND.accent,
        textAlign: 'right',
    },
    previewContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: GRAY[950],
        overflow: 'hidden',
    },
    previewImageWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        // Dimensions controlled by animatedPreviewImageStyle
    },
    previewPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragHandleContainer: {
        backgroundColor: STATIC.white,
        borderTopWidth: 1,
        borderTopColor: GRAY[300],
        borderBottomWidth: 1,
        borderBottomColor: GRAY[300],
    },
    multiSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    multiSelectButtonActive: {
        backgroundColor: 'rgba(255, 160, 92, 0.15)',
    },
    albumSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: STATIC.white,
    },
    albumSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    albumSelectorText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: STATIC.black,
        marginRight: 4,
    },
    gridContainer: {
        backgroundColor: STATIC.white,
    },
    gridItem: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        margin: GRID_SPACING / 2,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    selectionBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: BRAND.accent,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: STATIC.white,
    },
    selectionBadgeText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '700',
        color: STATIC.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: STATIC.white,
    },
    loadingMore: {
        paddingVertical: 20,
    },
    selectionCounter: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    selectionCounterText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '600',
        color: STATIC.white,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    permissionDenied: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        backgroundColor: STATIC.white,
    },
    permissionText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: GRAY[600],
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: BRAND.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: STATIC.white,
    },
    albumPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    albumPickerContainer: {
        backgroundColor: STATIC.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: SCREEN_HEIGHT * 0.6,
    },
    albumPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: GRAY[300],
    },
    albumPickerTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        color: STATIC.black,
    },
    albumItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: GRAY[150],
    },
    albumItemSelected: {
        backgroundColor: 'rgba(255, 160, 92, 0.1)',
    },
    albumItemText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: STATIC.black,
    },
    albumItemCount: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: GRAY[475],
    },
});

export default InstagramPhotoPickerModal;
