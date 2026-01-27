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
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as MediaLibrary from 'expo-media-library';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_COLUMNS = 4;
const GRID_SPACING = 2;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - (GRID_COLUMNS + 1) * GRID_SPACING) / GRID_COLUMNS;
const MAX_PHOTOS = 5;

// Preview area dimensions
const PREVIEW_HEIGHT = SCREEN_WIDTH; // Square preview like Instagram

interface InstagramPhotoPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onDone: (photos: string[]) => void;
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

    // Pagination
    const endCursor = useRef<string | undefined>(undefined);
    const PAGE_SIZE = 50;

    // Gesture values for preview
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

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
            resetGestures();
            endCursor.current = undefined;
            setHasMore(true);
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

    // Handle photo selection
    const handlePhotoPress = (photo: PhotoAsset) => {
        setPreviewPhoto(photo);
        resetGestures();

        if (isMultiSelectEnabled) {
            // Multi-select mode: toggle selection
            const isSelected = selectedPhotos.includes(photo.uri);
            if (isSelected) {
                setSelectedPhotos(prev => prev.filter(uri => uri !== photo.uri));
            } else {
                if (selectedPhotos.length < availableSlots) {
                    setSelectedPhotos(prev => [...prev, photo.uri]);
                } else {
                    Alert.alert('Limit Reached', `You can only select up to ${availableSlots} photo${availableSlots !== 1 ? 's' : ''}.`);
                }
            }
        } else {
            // Single select mode: replace selection
            setSelectedPhotos([photo.uri]);
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

    // Handle done
    const handleDone = () => {
        if (selectedPhotos.length === 0) {
            Alert.alert('No Photos Selected', 'Please select at least one photo.');
            return;
        }
        onDone(selectedPhotos);
    };

    // Load more photos on scroll
    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            loadPhotos(selectedAlbum || undefined, false);
        }
    };

    // Get selection index for a photo
    const getSelectionIndex = (uri: string): number => {
        return selectedPhotos.indexOf(uri) + 1;
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
            // Simple bounds clamping
            const maxTranslate = (scale.value - 1) * PREVIEW_HEIGHT / 2;
            const clampedX = Math.min(maxTranslate, Math.max(-maxTranslate, translateX.value));
            const clampedY = Math.min(maxTranslate, Math.max(-maxTranslate, translateY.value));

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

    // Render photo grid item
    const renderPhotoItem = ({ item }: { item: PhotoAsset }) => {
        const selectionIndex = getSelectionIndex(item.uri);
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
                            <Ionicons name="close" size={24} color="#000" />
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
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <View style={styles.permissionDenied}>
                        <Ionicons name="images-outline" size={64} color="#CCC" />
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
                        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>New Post</Text>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleDone}
                        >
                            <Text style={styles.nextText}>Next</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Preview Area */}
                    <View style={styles.previewContainer}>
                        {previewPhoto ? (
                            <GestureDetector gesture={composedGesture}>
                                <Animated.View style={[styles.previewImageWrapper, animatedPreviewStyle]}>
                                    <Image
                                        source={{ uri: previewPhoto.uri }}
                                        style={styles.previewImage}
                                        resizeMode="cover"
                                    />
                                </Animated.View>
                            </GestureDetector>
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <Ionicons name="image-outline" size={48} color="#CCC" />
                            </View>
                        )}
                    </View>

                    {/* Album Selector Row */}
                    <View style={styles.albumSelectorRow}>
                        <TouchableOpacity
                            style={styles.albumSelector}
                            onPress={() => setShowAlbumPicker(true)}
                        >
                            <Text style={styles.albumSelectorText}>
                                {albums.find(a => a.id === selectedAlbum)?.title || 'Recents'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#000" />
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
                                color={isMultiSelectEnabled ? '#FFA05C' : '#666'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Photo Grid */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFA05C" />
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
                                        <ActivityIndicator size="small" color="#FFA05C" />
                                    </View>
                                ) : null
                            }
                        />
                    )}

                    {/* Selection Counter */}
                    {selectedPhotos.length > 0 && (
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
        backgroundColor: '#FFF',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
    },
    headerButton: {
        minWidth: 60,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    nextText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#FFA05C',
        textAlign: 'right',
    },
    previewContainer: {
        width: SCREEN_WIDTH,
        height: PREVIEW_HEIGHT,
        backgroundColor: '#1A1A1A',
        overflow: 'hidden',
    },
    previewImageWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: SCREEN_WIDTH,
        height: PREVIEW_HEIGHT,
    },
    previewPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    multiSelectText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        letterSpacing: 0.5,
    },
    albumSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
    },
    albumSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    albumSelectorText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginRight: 4,
    },
    gridContainer: {
        backgroundColor: '#FFF',
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
        backgroundColor: '#FFA05C',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    selectionBadgeText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },
    previewIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
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
        color: '#FFF',
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
        backgroundColor: '#FFF',
    },
    permissionText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#FFA05C',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    albumPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    albumPickerContainer: {
        backgroundColor: '#FFF',
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
        borderBottomColor: '#E0E0E0',
    },
    albumPickerTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    albumItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    albumItemSelected: {
        backgroundColor: 'rgba(255, 160, 92, 0.1)',
    },
    albumItemText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000',
    },
    albumItemCount: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#888',
    },
});

export default InstagramPhotoPickerModal;
