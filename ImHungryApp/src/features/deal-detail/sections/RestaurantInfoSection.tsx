/**
 * @file RestaurantInfoSection — Restaurant name, distance, expiry, tags + view count.
 *
 * Purely presentational. Matches the original "restaurantSection" block.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet } from 'react-native';

import SkeletonLoader from '../../../components/SkeletonLoader';
import type { Deal } from '../../../types/deal';
import { BRAND, STATIC, SPACING } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { ViewData } from '../types';

export interface RestaurantInfoSectionProps {
  dealData: Deal;
  viewData: ViewData;
  formatDate: (d: string | null) => string;
  removeZipCode: (a: string) => string;
}

const ViewerMetaRow = ({
  viewData,
  viewerPhotos,
}: {
  viewData: ViewData;
  viewerPhotos: string[];
}) => {
  if (viewData.isLoading) {
    return (
      <Box row align="center">
        <SkeletonLoader width={60} height={12} borderRadius={4} />
        <Box row align="center">
          <SkeletonLoader width={20} height={20} borderRadius={10} style={styles.viewerSkeletonLead} />
          <SkeletonLoader width={20} height={20} borderRadius={10} style={styles.viewerSkeletonOverlap} />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Text
        size="xs"
        color={STATIC.black}
        style={styles.viewCountText}
      >
        {viewData.viewCount ?? 0} viewed
      </Text>
      {viewerPhotos.length > 0 && (
        <Box row align="center">
          {viewerPhotos.map((photoUrl, index) => (
            <Image
              key={index}
              source={{ uri: photoUrl }}
              style={getViewerPhotoStyle(index, viewerPhotos.length)}
            />
          ))}
        </Box>
      )}
    </>
  );
};

export function RestaurantInfoSection({
  dealData,
  viewData,
  formatDate,
  removeZipCode,
}: RestaurantInfoSectionProps) {
  const viewerPhotos = viewData.viewerPhotos ?? [];
  const cuisineLabel = dealData.cuisine?.trim() || '';
  const dealTypeLabel = dealData.dealType?.trim() || '';
  const hasCuisine = cuisineLabel !== '' && cuisineLabel !== 'Cuisine';
  const hasDealType = dealTypeLabel !== '';
  const showTags = hasCuisine || hasDealType;

  return (
    <Box px="2xl" pt="lg" pb="sm">
      {/* Restaurant name + view count */}
      <Box style={styles.titleRow}>
        <Text
          size="lg"
          weight="bold"
          color={STATIC.black}
          style={styles.restaurantTitle}
        >
          {dealData.restaurant}
        </Text>

        <Box
          position="absolute"
          top={0}
          right={0}
          row
          align="center"
        >
          <ViewerMetaRow viewData={viewData} viewerPhotos={viewerPhotos} />
        </Box>
      </Box>

      {/* Info rows */}
      <Box w="100%" mt={0}>
        {/* Location */}
        <Box row align="center" mb="xs">
          <MaterialCommunityIcons name="map-marker" size={12} color={BRAND.primary} style={styles.infoIcon} />
          <Text size="xs" style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
            <Text size="xs" weight="regular" color={STATIC.black} style={styles.interRegular}>
              {dealData.milesAway} away{' '}
            </Text>
            <Text size="xs" weight="regular" color={STATIC.black} style={styles.interLight}>
              •{' '}
            </Text>
            <Text size="xs" weight="regular" color={STATIC.black} style={styles.interRegular}>
              {removeZipCode(dealData.restaurantAddress || '14748 Beach Blvd, La Mirada, CA')}
            </Text>
          </Text>
        </Box>

        {/* Valid Until */}
        <Box row align="center" mb="xs">
          <MaterialCommunityIcons name="clock-outline" size={12} color="#555555" style={styles.infoIcon} />
          <Text
            size="xs"
            weight="regular"
            color={STATIC.black}
            style={styles.infoText}
          >
            Valid Until • {formatDate(dealData.expirationDate || null)}
          </Text>
        </Box>

        {/* Category row (only if meaningful) */}
        {showTags && (
          <Box row align="center">
            <MaterialCommunityIcons name="tag-outline" size={12} color="#555555" style={styles.infoIcon} />
            <Text size="xs" style={styles.rowText}>
              {hasCuisine && (
                <Text size="xs" weight="regular" color={STATIC.black} style={styles.interRegular}>
                  {cuisineLabel}
                </Text>
              )}
              {hasCuisine && hasDealType && (
                <Text size="xs" weight="regular" color={STATIC.black} style={styles.interLight}>
                  {' '}•{' '}
                </Text>
              )}
              {hasDealType && (
                <Text size="xs" weight="regular" color={STATIC.black} style={styles.interRegular}>
                  {dealTypeLabel}
                </Text>
              )}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const getViewerPhotoStyle = (index: number, total: number) => [
  styles.viewerPhoto,
  index > 0 ? styles.viewerPhotoOverlap : undefined,
  { zIndex: total - index },
];

const styles = StyleSheet.create({
  titleRow: {
    position: 'relative',
    marginBottom: 2,
    minHeight: 20,
  },
  restaurantTitle: {
    fontFamily: 'Inter',
    lineHeight: 20,
    paddingRight: 80,
    marginBottom: 0,
  },
  viewerSkeletonLead: {
    marginLeft: 6,
  },
  viewerSkeletonOverlap: {
    marginLeft: -8,
  },
  viewCountText: {
    fontFamily: 'Inter',
    marginRight: 6,
  },
  viewerPhoto: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STATIC.white,
  },
  viewerPhotoOverlap: {
    marginLeft: -8,
  },
  infoIcon: {
    marginRight: SPACING.xs,
  },
  locationText: {
    lineHeight: 20,
    flex: 1,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  rowText: {
    lineHeight: 20,
  },
  interRegular: {
    fontFamily: 'Inter-Regular',
  },
  interLight: {
    fontFamily: 'Inter-Light',
    fontWeight: '300',
  },
});
