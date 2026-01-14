import React, { useState, useRef } from 'react';
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
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ImageCropperModal from './ImageCropperModal';

const { width: screenWidth } = Dimensions.get('window');
const THUMBNAIL_SIZE = 64;
const MAX_PHOTOS = 5;

interface PhotoReviewModalProps {
    visible: boolean;
    photos: string[];
    originalPhotos?: string[]; // Original uncropped photos for re-cropping
    thumbnailIndex: number;
    onClose: () => void;
    onDone: (photos: string[], thumbnailIndex: number, originalPhotos: string[]) => void;
    onAddMore: () => void;
}

const PhotoReviewModal: React.FC<PhotoReviewModalProps> = ({
    visible,
    photos,
    originalPhotos: propOriginalPhotos,
    thumbnailIndex,
    onClose,
    onDone,
    onAddMore,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localPhotos, setLocalPhotos] = useState<string[]>(photos);
    const [localOriginalPhotos, setLocalOriginalPhotos] = useState<string[]>(propOriginalPhotos || photos);
    const [localThumbnailIndex, setLocalThumbnailIndex] = useState(thumbnailIndex);
    const flatListRef = useRef<FlatList>(null);
    
    // Cropping state
    const [isCropperVisible, setIsCropperVisible] = useState(false);
    const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);

    // Sync with props when modal opens
    React.useEffect(() => {
        if (visible) {
            setLocalPhotos(photos);
            // Use provided original photos or fall back to current photos
            setLocalOriginalPhotos(propOriginalPhotos || photos);
            setLocalThumbnailIndex(thumbnailIndex);
            setCurrentIndex(0);
        }
    }, [visible, photos, propOriginalPhotos, thumbnailIndex]);

    const handleDeletePhoto = (index: number) => {
        if (localPhotos.length <= 1) {
            Alert.alert('Cannot Delete', 'You must have at least one photo.');
            return;
        }

        Alert.alert(
            'Delete Photo',
            'Are you sure you want to remove this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const newPhotos = localPhotos.filter((_, i) => i !== index);
                        const newOriginals = localOriginalPhotos.filter((_, i) => i !== index);
                        setLocalPhotos(newPhotos);
                        setLocalOriginalPhotos(newOriginals);

                        // Adjust thumbnail index if needed
                        if (localThumbnailIndex === index) {
                            setLocalThumbnailIndex(0);
                        } else if (localThumbnailIndex > index) {
                            setLocalThumbnailIndex(localThumbnailIndex - 1);
                        }

                        // Adjust current index if needed
                        if (currentIndex >= newPhotos.length) {
                            setCurrentIndex(Math.max(0, newPhotos.length - 1));
                        }
                    },
                },
            ]
        );
    };

    const handleSetThumbnail = (index: number) => {
        setLocalThumbnailIndex(index);
    };

    const handleThumbnailPress = (index: number) => {
        setCurrentIndex(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const handleEditPhoto = (index: number) => {
        setCropImageIndex(index);
        setIsCropperVisible(true);
    };

    const handleCropComplete = (croppedUri: string) => {
        if (cropImageIndex !== null) {
            const newPhotos = [...localPhotos];
            newPhotos[cropImageIndex] = croppedUri;
            setLocalPhotos(newPhotos);
        }
        setIsCropperVisible(false);
        setCropImageIndex(null);
    };

    const handleCropCancel = () => {
        setIsCropperVisible(false);
        setCropImageIndex(null);
    };

    const handleDone = () => {
        onDone(localPhotos, localThumbnailIndex, localOriginalPhotos);
    };

    const handleAddMorePhotos = () => {
        if (localPhotos.length >= MAX_PHOTOS) {
            Alert.alert('Limit Reached', `You can only add up to ${MAX_PHOTOS} photos.`);
            return;
        }
        onAddMore();
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderCarouselItem = ({ item, index }: { item: string; index: number }) => (
        <View style={styles.carouselItem}>
            <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="contain" />
            {/* Delete button */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(index)}
            >
                <Ionicons name="close-circle" size={32} color="#FF3B30" />
            </TouchableOpacity>
            {/* Edit/Crop button */}
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditPhoto(index)}
            >
                <Ionicons name="crop" size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            {/* Set as thumbnail button */}
            <TouchableOpacity
                style={[
                    styles.thumbnailBadgeButton,
                    localThumbnailIndex === index && styles.thumbnailBadgeActive,
                ]}
                onPress={() => handleSetThumbnail(index)}
            >
                <Ionicons
                    name={localThumbnailIndex === index ? 'star' : 'star-outline'}
                    size={16}
                    color={localThumbnailIndex === index ? '#FFD700' : '#FFFFFF'}
                />
                <Text style={styles.thumbnailBadgeText}>
                    {localThumbnailIndex === index ? 'Cover' : 'Set Cover'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderThumbnail = ({ item, index }: { item: string; index: number }) => (
        <TouchableOpacity
            style={[
                styles.thumbnailContainer,
                currentIndex === index && styles.thumbnailSelected,
                localThumbnailIndex === index && styles.thumbnailIsCover,
            ]}
            onPress={() => handleThumbnailPress(index)}
        >
            <Image source={{ uri: item }} style={styles.thumbnailImage} />
            {localThumbnailIndex === index && (
                <View style={styles.thumbnailCoverBadge}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {localPhotos.length} Photo{localPhotos.length !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity style={styles.headerButton} onPress={handleDone}>
                        <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Main carousel */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={localPhotos}
                        renderItem={renderCarouselItem}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        getItemLayout={(_, index) => ({
                            length: screenWidth,
                            offset: screenWidth * index,
                            index,
                        })}
                    />

                    {/* Pagination dots */}
                    <View style={styles.paginationContainer}>
                        {localPhotos.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    currentIndex === index && styles.paginationDotActive,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Thumbnail strip */}
                <View style={styles.thumbnailStrip}>
                    <FlatList
                        data={localPhotos}
                        renderItem={renderThumbnail}
                        keyExtractor={(item, index) => `thumb-${item}-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailListContent}
                    />

                    {/* Add more button */}
                    {localPhotos.length < MAX_PHOTOS && (
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={handleAddMorePhotos}
                        >
                            <Ionicons name="add" size={28} color="#FFA05C" />
                        </TouchableOpacity>
                    )}
                </View>

        
            </SafeAreaView>

            {/* Image Cropper Modal - always use original image for cropping */}
            <ImageCropperModal
                visible={isCropperVisible}
                imageUri={cropImageIndex !== null ? localOriginalPhotos[cropImageIndex] : ''}
                aspectRatio={4 / 3}
                onCancel={handleCropCancel}
                onComplete={handleCropComplete}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E0E0E0',
    },
    headerButton: {
        minWidth: 60,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    cancelText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
    },
    doneText: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#FFA05C',
        textAlign: 'right',
    },
    carouselContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    carouselItem: {
        width: screenWidth,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselImage: {
        width: screenWidth,
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    editButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    editButtonText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    thumbnailBadgeButton: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    thumbnailBadgeActive: {
        backgroundColor: 'rgba(255, 160, 92, 0.9)',
    },
    thumbnailBadgeText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#FFFFFF',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    thumbnailStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderTopWidth: 0.5,
        borderTopColor: '#E0E0E0',
    },
    thumbnailListContent: {
        paddingHorizontal: 8,
        gap: 8,
    },
    thumbnailContainer: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbnailSelected: {
        borderColor: '#FFA05C',
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
        borderRadius: 8,
        padding: 2,
    },
    addMoreButton: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FFA05C',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 160, 92, 0.1)',
    },
    instructionText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '400',
        color: '#888888',
        textAlign: 'center',
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
    },
});

export default PhotoReviewModal;
