/**
 * @file ProfileSkeleton — Full-page loading skeleton shown while profile data
 * is being fetched for the first time.
 *
 * Purely presentational – no props required.
 */

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import DealCardSkeleton from '../../../components/DealCardSkeleton';
import SkeletonLoader from '../../../components/SkeletonLoader';
import {
  STATIC,
  GRAY,
  SPACING,
  RADIUS,
  BORDER_WIDTH,
  DIMENSION,
} from '../../../ui/alf';
import { Box } from '../../../ui/primitives';

const profileUsernameSkeletonStyle = { marginBottom: 6 };
const profileJoinDateSkeletonStyle = { marginBottom: 4 };
const profileGridEvenStyle = { marginRight: 2 };
const profileGridOddStyle = { marginLeft: 2 };

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
              <SkeletonLoader width={150} height={24} borderRadius={RADIUS.sm} style={profileUsernameSkeletonStyle} />
              {/* Join date skeleton */}
              <SkeletonLoader width={120} height={14} borderRadius={RADIUS.sm} style={profileJoinDateSkeletonStyle} />
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
                style={index % 2 === 0 ? profileGridEvenStyle : profileGridOddStyle}
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
