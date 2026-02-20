/**
 * @file DealPreviewScreen — Read-only deal preview before posting
 *
 * Purely presentational; receives form data via props and renders a
 * preview that mirrors DealDetailScreen.
 */

import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  FlatList,
} from 'react-native';

import { getCurrentUserLocation, calculateDistance } from '../../services/locationService';

import { DealPreviewImageViewerModal } from './DealPreviewScreen.imageViewer';
import {
  DealPreviewContent,
  type PreviewUserData,
  type RestaurantPreviewData,
} from './DealPreviewScreen.sections';
import { screenWidth, styles } from './DealPreviewScreen.styles';

interface DealPreviewScreenProps {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
  dealTitle: string;
  dealDetails: string;
  imageUris: string[];
  /** Optional originals (uncropped) so fullscreen preview can show the full photo. */
  originalImageUris?: string[];
  expirationDate: string | null;
  selectedRestaurant: RestaurantPreviewData | null;
  selectedCategory: string;
  selectedCuisine: string;
  userData: PreviewUserData;
  isPosting?: boolean;
}

const removeZipCode = (address: string) =>
  address.replace(/,?\s*\d{5}(-\d{4})?$/, '').trim();

const formatDate = (dateString: string | null) => {
  if (!dateString || dateString === 'Unknown') {
    return 'Not Known';
  }
  const date = new Date(dateString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
};

const formatDistanceLabel = (distanceMiles: number): string => (
  distanceMiles < 1 ? '<1mi away' : `${Math.round(distanceMiles)}mi away`
);

const DealPreviewScreen: React.FC<DealPreviewScreenProps> = ({
  visible,
  onClose,
  onPost,
  dealTitle,
  dealDetails,
  imageUris,
  originalImageUris,
  expirationDate,
  selectedRestaurant,
  selectedCategory,
  selectedCuisine,
  userData,
  isPosting = false,
}) => {
  const [distance, setDistance] = useState<string>('?mi away');
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);
  const [imageViewerKey, setImageViewerKey] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const carouselRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !isAnimatingOut) {
      slideAnim.setValue(screenWidth);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleAnimatedClose = useCallback(() => {
    if (isPosting || isAnimatingOut) {
      return;
    }

    setIsAnimatingOut(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimatingOut(false);
      onClose();
    });
  }, [fadeAnim, isAnimatingOut, isPosting, onClose, slideAnim]);

  useEffect(() => {
    const calculateRestaurantDistance = async () => {
      if (!selectedRestaurant?.lat || !selectedRestaurant?.lng) {
        setDistance('?mi away');
        return;
      }

      setIsCalculatingDistance(true);

      try {
        const userLocation = await getCurrentUserLocation();
        if (!userLocation) {
          setDistance('?mi away');
          return;
        }

        const distanceMiles = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          selectedRestaurant.lat,
          selectedRestaurant.lng,
        );

        setDistance(formatDistanceLabel(distanceMiles));
      } catch (error) {
        console.error('Error calculating distance:', error);
        setDistance('?mi away');
      } finally {
        setIsCalculatingDistance(false);
      }
    };

    if (visible && selectedRestaurant) {
      calculateRestaurantDistance();
    }
  }, [visible, selectedRestaurant]);

  const openImageViewer = useCallback(() => {
    setModalImageLoading(true);
    setModalImageError(false);
    setImageViewVisible(true);
    setImageViewerKey((previous) => previous + 1);
  }, []);

  const handleImageLoad = useCallback(() => {
    // Keep signature for image callbacks used in content sections.
  }, []);

  const isBackButtonDisabled = isPosting || isAnimatingOut;
  const shareButtonStateStyle = isPosting
    ? styles.shareButtonDisabled
    : styles.shareButtonEnabled;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleAnimatedClose}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.fadeOverlay,
          { opacity: fadeAnim },
        ]}
      />

      <Animated.View style={[styles.modalPanel, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <DealPreviewContent
            handleAnimatedClose={handleAnimatedClose}
            isBackButtonDisabled={isBackButtonDisabled}
            onPost={onPost}
            isPosting={isPosting}
            shareButtonStateStyle={shareButtonStateStyle}
            selectedRestaurant={selectedRestaurant}
            isCalculatingDistance={isCalculatingDistance}
            distance={distance}
            removeZipCode={removeZipCode}
            expirationDate={expirationDate}
            formatDate={formatDate}
            selectedCuisine={selectedCuisine}
            selectedCategory={selectedCategory}
            dealTitle={dealTitle}
            imageUris={imageUris}
            carouselRef={carouselRef}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            openImageViewer={openImageViewer}
            handleImageLoad={handleImageLoad}
            dealDetails={dealDetails}
            userData={userData}
          />
        </SafeAreaView>
      </Animated.View>

      <DealPreviewImageViewerModal
        visible={isImageViewVisible}
        imageUris={imageUris}
        originalImageUris={originalImageUris}
        currentImageIndex={currentImageIndex}
        setImageViewVisible={setImageViewVisible}
        modalImageLoading={modalImageLoading}
        setModalImageLoading={setModalImageLoading}
        modalImageError={modalImageError}
        setModalImageError={setModalImageError}
        imageViewerKey={imageViewerKey}
        scrollViewRef={scrollViewRef}
      />
    </Modal>
  );
};

export default DealPreviewScreen;
