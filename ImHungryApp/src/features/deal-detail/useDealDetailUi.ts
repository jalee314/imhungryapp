import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';

import { logClickThrough, logShare } from '../../services/interactionService';
import type { Deal } from '../../types/deal';
import { logger } from '../../utils/logger';

import { openAppleMaps, openGoogleMaps, toOriginalVariantUri } from './useDealDetail.helpers';

export interface DealDetailNavigation {
  navigate: (screen: string, params?: unknown) => void;
}

interface UseDealDetailUiArgs {
  navigation: DealDetailNavigation;
  dealData: Deal;
  imagesForCarousel: string[] | null;
  originalImageUris: string[] | null;
  currentImageIndex: number;
}

export function useDealDetailUi({
  navigation,
  dealData,
  imagesForCarousel,
  originalImageUris,
  currentImageIndex,
}: UseDealDetailUiArgs) {
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);
  const [imageViewerKey, setImageViewerKey] = useState(0);

  const handleShare = useCallback(async () => {
    try {
      logShare(dealData.id, 'feed').catch((error) => {
        logger.error('Failed to log share interaction:', error);
      });

      const result = await Share.share({
        message: `Check out this deal at ${dealData.restaurant}: ${dealData.title}`,
        title: dealData.title,
      });

      if (result.action === Share.sharedAction) {
        logger.info('Deal shared successfully');
      }
    } catch (error) {
      logger.error('Error sharing deal:', error);
      Alert.alert('Error', 'Unable to share this deal');
    }
  }, [dealData.id, dealData.restaurant, dealData.title]);

  const handleDirections = useCallback(() => {
    logClickThrough(dealData.id, 'feed').catch((error) => {
      logger.error('Failed to log click-through interaction:', error);
    });
    setIsMapModalVisible(true);
  }, [dealData.id]);

  const handleSelectAppleMaps = useCallback(async () => {
    setIsMapModalVisible(false);
    try {
      await openAppleMaps(dealData);
    } catch {
      Alert.alert('Error', 'Unable to open Apple Maps');
    }
  }, [dealData]);

  const handleSelectGoogleMaps = useCallback(async () => {
    setIsMapModalVisible(false);
    try {
      await openGoogleMaps(dealData);
    } catch {
      Alert.alert('Error', 'Unable to open Google Maps');
    }
  }, [dealData]);

  const handleMoreButtonPress = useCallback(() => {
    setIsPopupVisible(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setIsPopupVisible(false);
  }, []);

  const handleReportContent = useCallback(() => {
    setIsPopupVisible(false);
  }, []);

  const handleBlockUser = useCallback(() => {
    setIsPopupVisible(false);
    navigation.navigate('BlockUser', {
      dealId: dealData.id,
      uploaderUserId: dealData.userId || '00000000-0000-0000-0000-000000000000',
    });
  }, [dealData.id, dealData.userId, navigation]);

  const handleUserPress = useCallback(() => {
    if (dealData.isAnonymous || !dealData.userId || !dealData.userDisplayName) {
      return;
    }
    navigation.navigate('UserProfile', {
      viewUser: true,
      username: dealData.userDisplayName,
      userId: dealData.userId,
    });
  }, [dealData.isAnonymous, dealData.userDisplayName, dealData.userId, navigation]);

  const openImageViewer = useCallback(() => {
    setModalImageLoading(true);
    setModalImageError(false);
    setImageViewVisible(true);
    setImageViewerKey((previous) => previous + 1);
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewVisible(false);
  }, []);

  const fullScreenImageSource = useMemo(() => (
    (originalImageUris && originalImageUris[currentImageIndex])
    || (imagesForCarousel && imagesForCarousel[currentImageIndex]
      ? toOriginalVariantUri(imagesForCarousel[currentImageIndex])
      : null)
    || dealData.imageVariants?.original
    || dealData.imageVariants?.large
    || (typeof dealData.image === 'string' ? toOriginalVariantUri(dealData.image) : dealData.image)
  ), [
    currentImageIndex,
    dealData.image,
    dealData.imageVariants,
    imagesForCarousel,
    originalImageUris,
  ]);

  const profilePicture = useMemo(() => (
    dealData.isAnonymous || !dealData.userProfilePhoto
      ? require('../../../img/Default_pfp.svg.png')
      : { uri: dealData.userProfilePhoto }
  ), [dealData.isAnonymous, dealData.userProfilePhoto]);

  const displayName = useMemo(() => (
    dealData.isAnonymous
      ? 'Anonymous'
      : (dealData.userDisplayName || 'Unknown User')
  ), [dealData.isAnonymous, dealData.userDisplayName]);

  return {
    handleShare,
    handleDirections,
    handleUserPress,
    profilePicture,
    displayName,
    popup: {
      isPopupVisible,
      handleMoreButtonPress,
      handleClosePopup,
      handleReportContent,
      handleBlockUser,
    },
    imageViewer: {
      isVisible: isImageViewVisible,
      open: openImageViewer,
      close: closeImageViewer,
      modalImageLoading,
      modalImageError,
      setModalImageLoading,
      setModalImageError,
      fullScreenImageSource,
      imageViewerKey,
    },
    mapModal: {
      isVisible: isMapModalVisible,
      onClose: () => setIsMapModalVisible(false),
      onSelectAppleMaps: handleSelectAppleMaps,
      onSelectGoogleMaps: handleSelectGoogleMaps,
    },
  };
}
