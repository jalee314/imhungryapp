import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    Image,
    Dimensions,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { styles } from './ImageCropperModal.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageCropperModalProps {
    visible: boolean;
    imageUri: string;
    aspectRatio?: number;
    onCancel: () => void;
    onComplete: (croppedImageUri: string) => void;
}

interface ImageDimensions {
    width: number;
    height: number;
}

const overlayTopStaticStyle = { top: 0, left: 0, right: 0 };
const overlayBottomStaticStyle = { bottom: 0, left: 0, right: 0 };
const overlayLeftStaticStyle = { left: 0 };
const overlayRightStaticStyle = { right: 0 };

const getOverlayTopStyle = (height: number) => ({
    ...overlayTopStaticStyle,
    height,
});

const getOverlayBottomStyle = (height: number) => ({
    ...overlayBottomStaticStyle,
    height,
});

const getOverlayLeftStyle = (top: number, width: number, height: number) => ({
    ...overlayLeftStaticStyle,
    top,
    width,
    height,
});

const getOverlayRightStyle = (top: number, width: number, height: number) => ({
    ...overlayRightStaticStyle,
    top,
    width,
    height,
});

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    visible,
    imageUri,
    aspectRatio = 4 / 3,
    onCancel,
    onComplete,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);

    // Crop frame size (centered in screen)
    const CROP_WIDTH = SCREEN_WIDTH - 40;
    const CROP_HEIGHT = CROP_WIDTH / aspectRatio;

    // Area for the full image display
    const IMAGE_AREA_HEIGHT = SCREEN_HEIGHT - 200; // Leave room for header and footer

    // Shared values for gestures
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Calculate initial display size to fit the image in the available area
    const [displaySize, setDisplaySize] = useState({ width: CROP_WIDTH, height: CROP_HEIGHT });
    // Minimum scale to ensure crop frame is covered (needed for valid crop)
    const [_minScale, setMinScale] = useState(1);

    // Reset on open
    useEffect(() => {
        if (visible) {
            scale.value = 1;
            savedScale.value = 1;
            translateX.value = 0;
            translateY.value = 0;
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Get image dimensions and calculate display size
    useEffect(() => {
        if (visible && imageUri) {
            Image.getSize(
                imageUri,
                (width, height) => {
                    setImageDimensions({ width, height });

                    const imageAspect = width / height;
                    const availableWidth = SCREEN_WIDTH - 40;
                    const availableHeight = IMAGE_AREA_HEIGHT - 40;

                    // Calculate display size to CONTAIN the entire image (fit mode)
                    // This shows the full image at scale 1
                    let displayWidth: number;
                    let displayHeight: number;

                    if (imageAspect > (availableWidth / availableHeight)) {
                        // Image is wider - constrain by width
                        displayWidth = availableWidth;
                        displayHeight = displayWidth / imageAspect;
                    } else {
                        // Image is taller - constrain by height
                        displayHeight = availableHeight;
                        displayWidth = displayHeight * imageAspect;
                    }

                    // Calculate minimum scale needed to cover the crop frame
                    const minScaleX = CROP_WIDTH / displayWidth;
                    const minScaleY = CROP_HEIGHT / displayHeight;
                    const calculatedMinScale = Math.max(minScaleX, minScaleY, 1);
                    setMinScale(calculatedMinScale);

                    setDisplaySize({ width: displayWidth, height: displayHeight });
                },
                (error) => {
                    console.error('Error getting image size:', error);
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, imageUri]);

    // Pinch gesture for zoom - allow zooming from 1 (full image) to 4x
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            'worklet';
            scale.value = Math.min(4, Math.max(1, savedScale.value * event.scale));
        })
        .onEnd(() => {
            'worklet';
            savedScale.value = scale.value;
        });

    // Pan gesture for moving
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            'worklet';
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
            'worklet';
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    // Combine gestures
    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    // Animated style for the image
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    const handleCrop = async () => {
        if (!imageDimensions) return;

        setIsProcessing(true);

        try {
            const currentScale = scale.value;
            const currentTranslateX = translateX.value;
            const currentTranslateY = translateY.value;

            // Scale factors from display to original image
            const scaleToOriginalX = imageDimensions.width / displaySize.width;
            const scaleToOriginalY = imageDimensions.height / displaySize.height;

            // The crop frame is centered, so we need to calculate what part of the image is visible in it
            // After transforms, the image center is offset by translate values
            // The visible area in display coordinates (relative to image center)
            const visibleCenterX = -currentTranslateX / currentScale;
            const visibleCenterY = -currentTranslateY / currentScale;

            // Size of crop frame in display coordinates (accounting for zoom)
            const cropFrameWidthInDisplay = CROP_WIDTH / currentScale;
            const cropFrameHeightInDisplay = CROP_HEIGHT / currentScale;

            // Convert to original image coordinates
            const cropWidth = cropFrameWidthInDisplay * scaleToOriginalX;
            const cropHeight = cropFrameHeightInDisplay * scaleToOriginalY;

            // Calculate origin (top-left of crop area in original image)
            const centerX = imageDimensions.width / 2;
            const centerY = imageDimensions.height / 2;

            let originX = centerX + (visibleCenterX * scaleToOriginalX) - (cropWidth / 2);
            let originY = centerY + (visibleCenterY * scaleToOriginalY) - (cropHeight / 2);

            // Clamp to image bounds
            originX = Math.max(0, Math.min(originX, imageDimensions.width - cropWidth));
            originY = Math.max(0, Math.min(originY, imageDimensions.height - cropHeight));

            // Ensure positive dimensions
            const finalWidth = Math.max(100, Math.min(cropWidth, imageDimensions.width - originX));
            const finalHeight = Math.max(100, Math.min(cropHeight, imageDimensions.height - originY));

            const result = await manipulateAsync(
                imageUri,
                [
                    {
                        crop: {
                            originX: Math.round(Math.max(0, originX)),
                            originY: Math.round(Math.max(0, originY)),
                            width: Math.round(finalWidth),
                            height: Math.round(finalHeight),
                        },
                    },
                ],
                { compress: 0.8, format: SaveFormat.JPEG }
            );

            onComplete(result.uri);
        } catch (error) {
            console.error('Error cropping image:', error);
            onComplete(imageUri);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!visible) {
        return null;
    }

    // Calculate overlay dimensions
    const overlayTopHeight = (IMAGE_AREA_HEIGHT - CROP_HEIGHT) / 2;
    const overlayBottomHeight = overlayTopHeight;
    const overlaySideWidth = (SCREEN_WIDTH - CROP_WIDTH) / 2;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onCancel}
        >
            <GestureHandlerRootView style={styles.container}>
                <SafeAreaView style={styles.container}>
                    <StatusBar style="light" />

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Move and Scale</Text>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleCrop}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#FFA05C" />
                            ) : (
                                <Text style={styles.doneText}>Done</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Image Area with Overlay */}
                    <View style={[styles.imageArea, { height: IMAGE_AREA_HEIGHT }]}>
                        {/* The movable/zoomable image */}
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                                {imageUri && (
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={{
                                            width: displaySize.width,
                                            height: displaySize.height,
                                        }}
                                        resizeMode="cover"
                                    />
                                )}
                            </Animated.View>
                        </GestureDetector>

                        {/* Dark overlays for areas outside crop frame */}
                        {/* Top overlay */}
                        <View
                            style={[
                                styles.overlay,
                                getOverlayTopStyle(overlayTopHeight),
                            ]}
                            pointerEvents="none"
                        />
                        {/* Bottom overlay */}
                        <View
                            style={[
                                styles.overlay,
                                getOverlayBottomStyle(overlayBottomHeight),
                            ]}
                            pointerEvents="none"
                        />
                        {/* Left overlay */}
                        <View
                            style={[
                                styles.overlay,
                                getOverlayLeftStyle(overlayTopHeight, overlaySideWidth, CROP_HEIGHT),
                            ]}
                            pointerEvents="none"
                        />
                        {/* Right overlay */}
                        <View
                            style={[
                                styles.overlay,
                                getOverlayRightStyle(overlayTopHeight, overlaySideWidth, CROP_HEIGHT),
                            ]}
                            pointerEvents="none"
                        />

                        {/* Crop frame border */}
                        <View
                            style={[
                                styles.cropFrame,
                                {
                                    width: CROP_WIDTH,
                                    height: CROP_HEIGHT,
                                    top: overlayTopHeight,
                                    left: overlaySideWidth,
                                }
                            ]}
                            pointerEvents="none"
                        >
                            {/* Corner indicators */}
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.instructionText}>
                            Pinch to zoom in and position your crop
                        </Text>
                    </View>
                </SafeAreaView>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default ImageCropperModal;
