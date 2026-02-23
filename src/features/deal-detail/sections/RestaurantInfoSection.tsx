/**
 * @file RestaurantInfoSection — Restaurant name, distance, expiry, tags + view count.
 *
 * Purely presentational. Matches the original "restaurantSection" block.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image } from 'react-native';

import SkeletonLoader from '../../../components/SkeletonLoader';
import type { Deal } from '../../../types/deal';
import { BRAND, GRAY, STATIC, SPACING, RADIUS, BORDER_WIDTH } from '../../../ui/alf';
import { Box, Text } from '../../../ui/primitives';
import type { ViewData } from '../types';

export interface RestaurantInfoSectionProps {
  dealData: Deal;
  viewData: ViewData;
  formatDate: (d: string | null) => string;
  removeZipCode: (a: string) => string;
}

export function RestaurantInfoSection({
  dealData,
  viewData,
  formatDate,
  removeZipCode,
}: RestaurantInfoSectionProps) {
  return (
    <Box px="2xl" pt="lg" pb="sm">
      {/* Restaurant name + view count */}
      <Box style={{ position: 'relative', marginBottom: 2, minHeight: 20 }}>
        <Text
          size="lg"
          weight="bold"
          color={STATIC.black}
          style={{ fontFamily: 'Inter', lineHeight: 20, paddingRight: 80, marginBottom: 0 }}
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
          {viewData.isLoading ? (
            <Box row align="center">
              <SkeletonLoader width={60} height={12} borderRadius={4} />
              <Box row align="center">
                <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginLeft: 6 }} />
                <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginLeft: -8 }} />
              </Box>
            </Box>
          ) : (
            <>
              <Text
                size="xs"
                color={STATIC.black}
                style={{ fontFamily: 'Inter', marginRight: 6 }}
              >
                {viewData.viewCount ?? 0} viewed
              </Text>
              {viewData.viewerPhotos && viewData.viewerPhotos.length > 0 && (
                <Box row align="center">
                  {viewData.viewerPhotos.map((photoUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: photoUrl }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: STATIC.white,
                        zIndex: viewData.viewerPhotos!.length - index,
                        marginLeft: index > 0 ? -8 : 0,
                      }}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Info rows */}
      <Box w="100%" mt={0}>
        {/* Location */}
        <Box row align="center" mb="xs">
          <MaterialCommunityIcons name="map-marker" size={12} color={BRAND.primary} style={{ marginRight: SPACING.xs }} />
          <Text size="xs" style={{ lineHeight: 20, flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
            <Text size="xs" weight="regular" color={STATIC.black} style={{ fontFamily: 'Inter-Regular' }}>
              {dealData.milesAway} away{' '}
            </Text>
            <Text size="xs" weight="regular" color={STATIC.black} style={{ fontFamily: 'Inter-Light', fontWeight: '300' }}>
              •{' '}
            </Text>
            <Text size="xs" weight="regular" color={STATIC.black} style={{ fontFamily: 'Inter-Regular' }}>
              {removeZipCode(dealData.restaurantAddress || '14748 Beach Blvd, La Mirada, CA')}
            </Text>
          </Text>
        </Box>

        {/* Valid Until */}
        <Box row align="center" mb="xs">
          <MaterialCommunityIcons name="clock-outline" size={12} color="#555555" style={{ marginRight: SPACING.xs }} />
          <Text
            size="xs"
            weight="regular"
            color={STATIC.black}
            style={{ fontFamily: 'Inter-Regular', lineHeight: 20 }}
          >
            Valid Until • {formatDate(dealData.expirationDate || null)}
          </Text>
        </Box>

        {/* Category row (only if meaningful) */}
        {((dealData.cuisine && dealData.cuisine.trim() !== '' && dealData.cuisine !== 'Cuisine') ||
          (dealData.dealType && dealData.dealType.trim() !== '')) && (
          <Box row align="center">
            <MaterialCommunityIcons name="tag-outline" size={12} color="#555555" style={{ marginRight: SPACING.xs }} />
            <Text size="xs" style={{ lineHeight: 20 }}>
              {dealData.cuisine && dealData.cuisine.trim() !== '' && dealData.cuisine !== 'Cuisine' && (
                <Text size="xs" weight="regular" color={STATIC.black} style={{ fontFamily: 'Inter-Regular' }}>
                  {dealData.cuisine}
                </Text>
              )}
              {dealData.cuisine && dealData.cuisine.trim() !== '' && dealData.cuisine !== 'Cuisine' &&
                dealData.dealType && dealData.dealType.trim() !== '' && (
                  <Text size="xs" weight="regular" color={STATIC.black} style={{ fontFamily: 'Inter-Light', fontWeight: '300' }}>
                    {' '}•{' '}
                  </Text>
                )}
              {dealData.dealType && dealData.dealType.trim() !== '' && (
                <Text size="xs" weight="regular" color={STATIC.black} style={{ fontFamily: 'Inter-Regular' }}>
                  {dealData.dealType}
                </Text>
              )}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
