/**
 * @file DealDetailContainer — Composed container that wires useDealDetail
 * to all feature-scoped section components.
 *
 * This component is the single composition root for the deal-detail feature.
 * The legacy DealDetailScreen re-exports it for navigation compatibility.
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import ThreeDotPopup from '../../components/ThreeDotPopup';
import MapSelectionModal from '../../components/MapSelectionModal';
import { Box, Text } from '../../ui/primitives';
import { STATIC, GRAY, BORDER_WIDTH, SPACING } from '../../ui/alf';

import { useDealDetail } from './useDealDetail';
import {
  DealDetailHeader,
  RestaurantInfoSection,
  DealMediaCarousel,
  DealActionsBar,
  DealDetailsSection,
  SharedBySection,
  FullScreenImageModal,
  SectionDivider,
} from './sections';

const DealDetailContainer: React.FC = () => {
  const ctx = useDealDetail();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: STATIC.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />

      {/* Fixed Header */}
      <DealDetailHeader
        onGoBack={ctx.goBack}
        onDirections={ctx.interactions.handleDirections}
        onMore={ctx.popup.handleMoreButtonPress}
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Restaurant Header */}
        <RestaurantInfoSection
          dealData={ctx.dealData}
          viewData={ctx.viewData}
          formatDate={ctx.formatDate}
          removeZipCode={ctx.removeZipCode}
        />

        {/* Separator after restaurant section */}
        <SectionDivider />

        {/* Deal Title */}
        <Text
          size="lg"
          weight="bold"
          color={STATIC.black}
          mt="sm"
          mb="lg"
          style={{ fontFamily: 'Inter', lineHeight: 20, paddingHorizontal: SPACING['2xl'] }}
        >
          {ctx.dealData.title}
        </Text>

        {/* Deal Images Carousel */}
        <DealMediaCarousel
          dealData={ctx.dealData}
          carousel={ctx.carousel}
          imagesForCarousel={ctx.imagesForCarousel}
          onOpenImageViewer={ctx.imageViewer.open}
        />

        {/* Action Buttons */}
        <DealActionsBar
          dealData={ctx.dealData}
          interactions={ctx.interactions}
        />

        {/* Details Section (renders nothing when empty) */}
        <DealDetailsSection details={ctx.dealData.details} />

        {/* Shared By Section */}
        <SharedBySection
          dealData={ctx.dealData}
          displayName={ctx.displayName}
          profilePicture={ctx.profilePicture}
          onUserPress={ctx.handleUserPress}
        />
      </ScrollView>

      {/* 3-Dot Popup Modal */}
      <ThreeDotPopup
        visible={ctx.popup.isPopupVisible}
        onClose={ctx.popup.handleClosePopup}
        onReportContent={ctx.popup.handleReportContent}
        onBlockUser={ctx.popup.handleBlockUser}
        dealId={ctx.dealData.id}
        uploaderUserId={ctx.dealData.userId || '00000000-0000-0000-0000-000000000000'}
        currentUserId={ctx.currentUserId || undefined}
      />

      {/* Fullscreen Image Viewer */}
      <FullScreenImageModal imageViewer={ctx.imageViewer} />

      {/* Map Selection Modal */}
      <MapSelectionModal
        visible={ctx.mapModal.isVisible}
        onClose={ctx.mapModal.onClose}
        onSelectAppleMaps={ctx.mapModal.onSelectAppleMaps}
        onSelectGoogleMaps={ctx.mapModal.onSelectGoogleMaps}
      />
    </SafeAreaView>
  );
};

export default DealDetailContainer;
