/**
 * @file ProfileSkeleton — Full-page loading skeleton shown while profile data
 * is being fetched for the first time.
 *
 * Purely presentational – no props required.
 */

import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SkeletonLoader from '../../../components/SkeletonLoader';
import DealCardSkeleton from '../../../components/DealCardSkeleton';
import { Box } from '../../../ui/primitives';
import {
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  DIMENSION,
} from '../../../ui/alf';

export function ProfileSkeleton() {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="dark" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header skeleton */}
        <Box
          py="lg"
          px={17}
          bg={STATIC.white}
          style={{ borderBottomWidth: BORDER_WIDTH.hairline, borderBottomColor: GRAY[250] }}
        >
          <Box
            row
            justify="space-between"
            align="center"
            style={{ height: DIMENSION.profileHeaderHeight, paddingTop: SPACING.lg }}
          >
            <Box flex={1} direction="column" gap="xs">
              {/* Username skeleton */}
              <SkeletonLoader width={150} height={24} borderRadius={RADIUS.sm} style={{ marginBottom: 6 }} />
              {/* Join date skeleton */}
              <SkeletonLoader width={120} height={14} borderRadius={RADIUS.sm} style={{ marginBottom: 4 }} />
              {/* Location skeleton */}
              <SkeletonLoader width={100} height={14} borderRadius={RADIUS.sm} />
            </Box>

            {/* Profile photo skeleton */}
            <SkeletonLoader
              width={DIMENSION.profilePhotoSkeleton}
              height={DIMENSION.profilePhotoSkeleton}
              borderRadius={DIMENSION.profilePhotoSkeleton / 2}
            />
          </Box>
        </Box>

        {/* Tabs Section Skeleton */}
        <Box
          row
          justify="space-between"
          align="center"
          px="lg"
          py="sm"
          bg={GRAY[100]}
        >
          <Box row gap="xs">
            <SkeletonLoader width={80} height={35} borderRadius={RADIUS.circle} />
            <SkeletonLoader width={80} height={35} borderRadius={RADIUS.circle} />
          </Box>
          <SkeletonLoader width={40} height={32} borderRadius={RADIUS.lg} />
        </Box>

        {/* Grid skeleton */}
        <Box bg={GRAY[100]} flex={1}>
          <Box
            row
            wrap="wrap"
            justify="flex-start"
            pt="sm"
            pb={100}
            px={10}
            w="100%"
          >
            {[1, 2, 3, 4, 5, 6].map((item, index) => (
              <Box
                key={item}
                mb="xs"
                style={index % 2 === 0 ? { marginRight: 2 } : { marginLeft: 2 }}
              >
                <DealCardSkeleton variant="vertical" />
              </Box>
            ))}
          </Box>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: STATIC.white },
  scroll: { flex: 1 },
});
