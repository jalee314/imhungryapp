import { Ionicons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';

import {
  GRAY,
  STATIC,
  RADIUS,
} from '../../ui/alf';
import { Box, Text } from '../../ui/primitives';

import {
  ARROW_SIZE,
  CAROUSEL_ITEM_WIDTH,
  PILL_HEIGHT,
  PILL_WIDTH,
  styles,
} from './DealPreviewScreen.styles';

export interface RestaurantPreviewData {
  id: string;
  name: string;
  subtext: string;
  lat?: number;
  lng?: number;
}

export interface PreviewUserData {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

interface DealPreviewContentProps {
  handleAnimatedClose: () => void;
  isBackButtonDisabled: boolean;
  onPost: () => void;
  isPosting: boolean;
  shareButtonStateStyle: StyleProp<ViewStyle>;
  selectedRestaurant: RestaurantPreviewData | null;
  isCalculatingDistance: boolean;
  distance: string;
  removeZipCode: (address: string) => string;
  expirationDate: string | null;
  formatDate: (dateString: string | null) => string;
  selectedCuisine: string;
  selectedCategory: string;
  dealTitle: string;
  imageUris: string[];
  carouselRef: React.RefObject<FlatList>;
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  openImageViewer: () => void;
  handleImageLoad: (event: { nativeEvent: { source: { width: number; height: number } } }) => void;
  dealDetails: string;
  userData: PreviewUserData;
}

const CategoryRow: React.FC<{
  selectedCuisine: string;
  selectedCategory: string;
}> = ({ selectedCuisine, selectedCategory }) => {
  const hasCuisine = selectedCuisine.trim() !== '' && selectedCuisine !== 'Cuisine';
  const hasCategory = selectedCategory.trim() !== '';

  if (!hasCuisine && !hasCategory) {
    return null;
  }

  return (
    <Box row align="center">
      <Text size="xs" style={styles.metaText}>
        {hasCuisine ? <Text style={styles.categoryItemText}>🍽 {selectedCuisine}</Text> : null}
        {hasCuisine && hasCategory ? (
          <Text style={styles.categorySeparatorText}> {' '}•{' '}</Text>
        ) : null}
        {hasCategory ? <Text style={styles.categoryItemText}> {selectedCategory}</Text> : null}
      </Text>
    </Box>
  );
};

const DealImagesCarousel: React.FC<{
  imageUris: string[];
  carouselRef: React.RefObject<FlatList>;
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  openImageViewer: () => void;
  handleImageLoad: (event: { nativeEvent: { source: { width: number; height: number } } }) => void;
}> = ({
  imageUris,
  carouselRef,
  currentImageIndex,
  setCurrentImageIndex,
  openImageViewer,
  handleImageLoad,
}) => {
  if (imageUris.length === 0) {
    return null;
  }

  return (
    <Box mb="lg">
      <FlatList
        ref={carouselRef}
        data={imageUris}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        scrollEnabled={imageUris.length > 1}
        decelerationRate="fast"
        style={styles.carouselList}
        onScroll={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_ITEM_WIDTH);
          if (index !== currentImageIndex && index >= 0 && index < imageUris.length) {
            setCurrentImageIndex(index);
          }
        }}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => `preview-image-${index}`}
        getItemLayout={(_, index) => ({
          length: CAROUSEL_ITEM_WIDTH,
          offset: CAROUSEL_ITEM_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              setCurrentImageIndex(index);
              openImageViewer();
            }}
            style={styles.carouselItemTouchable}
          >
            <Image
              source={{ uri: item }}
              style={styles.carouselImage}
              resizeMode="cover"
              onLoad={handleImageLoad}
            />
          </TouchableOpacity>
        )}
      />

      {imageUris.length > 1 ? (
        <Box row justify="center" align="center" mt={10} mb={5}>
          {imageUris.map((_, index) => (
            <Box
              key={`dot-${index}`}
              mx="xs"
              rounded="full"
              style={currentImageIndex === index ? styles.paginationDotActive : styles.paginationDotInactive}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

export const DealPreviewContent: React.FC<DealPreviewContentProps> = ({
  handleAnimatedClose,
  isBackButtonDisabled,
  onPost,
  isPosting,
  shareButtonStateStyle,
  selectedRestaurant,
  isCalculatingDistance,
  distance,
  removeZipCode,
  expirationDate,
  formatDate,
  selectedCuisine,
  selectedCategory,
  dealTitle,
  imageUris,
  carouselRef,
  currentImageIndex,
  setCurrentImageIndex,
  openImageViewer,
  handleImageLoad,
  dealDetails,
  userData,
}) => (
  <>
    <Box row justify="space-between" align="center" mb="sm" px="md">
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleAnimatedClose}
        disabled={isBackButtonDisabled}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={isBackButtonDisabled ? GRAY[350] : STATIC.black}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.shareButton, shareButtonStateStyle]}
        onPress={onPost}
        disabled={isPosting}
      >
        {isPosting ? (
          <ActivityIndicator size="small" color={STATIC.black} />
        ) : (
          <Text size="xs" color={STATIC.black} style={styles.shareButtonText}>
            Share
          </Text>
        )}
      </TouchableOpacity>
    </Box>

    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Box bg={STATIC.white} rounded={RADIUS.card} py="lg">
        <Box style={styles.restaurantInfoBlock}>
          <Text size="lg" weight="bold" color={STATIC.black} style={styles.restaurantName}>
            {selectedRestaurant?.name}
          </Text>

          <Box row align="center" mb="xs">
            <Text size="xs" style={styles.metaText}>
              📍 {isCalculatingDistance ? 'Calculating...' : distance}{' '}
            </Text>
            <Text size="xs" style={styles.metaSeparator}>•</Text>
            <Text size="xs" numberOfLines={1} style={styles.metaText}>
              {' '}{removeZipCode(selectedRestaurant?.subtext || '')}
            </Text>
          </Box>

          <Box row align="center" mb="xs">
            <Text size="xs" style={styles.metaText}>
              ⏳ Valid Until • {formatDate(expirationDate)}
            </Text>
          </Box>

          <CategoryRow selectedCuisine={selectedCuisine} selectedCategory={selectedCategory} />
        </Box>

        <Box my="sm" style={styles.sectionDivider} />

        <Text size="lg" weight="bold" color={STATIC.black} style={styles.dealTitle}>
          {dealTitle}
        </Text>

        <DealImagesCarousel
          imageUris={imageUris}
          carouselRef={carouselRef}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
          openImageViewer={openImageViewer}
          handleImageLoad={handleImageLoad}
        />

        <Box row justify="space-between" align="center" mb="sm">
          <Box
            row
            align="center"
            bg={STATIC.white}
            borderWidth={1}
            borderColor={GRAY[325]}
            rounded={RADIUS.pill}
            h={PILL_HEIGHT}
            w={PILL_WIDTH}
            overflow="hidden"
          >
            <Box flex={1} row align="center" justify="center" h="100%" pl={8} pr={2}>
              <ArrowBigUp size={ARROW_SIZE} color={STATIC.black} fill="transparent" />
              <Text style={styles.voteCountText}>0</Text>
            </Box>
            <Box w={1} h={12} bg={GRAY[250]} />
            <Box center h="100%" px={10}>
              <ArrowBigDown size={ARROW_SIZE} color={STATIC.black} fill="transparent" />
            </Box>
          </Box>

          <Box row gap="xs">
            <Box center bg={STATIC.white} borderWidth={1} borderColor={GRAY[325]} rounded={RADIUS.pill} w={40} h={28}>
              <Monicon name="mdi:heart-outline" size={19} color={STATIC.black} />
            </Box>
            <Box center bg={STATIC.white} borderWidth={1} borderColor={GRAY[325]} rounded={RADIUS.pill} w={40} h={28}>
              <Monicon name="mdi-light:share" size={24} color={STATIC.black} />
            </Box>
          </Box>
        </Box>

        <Box my="sm" style={styles.sectionDivider} />

        {dealDetails ? (
          <Box style={styles.stretchContainer}>
            <Text size="lg" weight="bold" color={STATIC.black} style={styles.detailsHeading}>
              Details
            </Text>
            <Text size="xs" color={STATIC.black} style={styles.detailsText}>
              {dealDetails}
            </Text>
          </Box>
        ) : null}

        <Box row align="center" gap="sm" py="lg">
          {userData.profilePicture ? (
            <Image source={{ uri: userData.profilePicture }} style={styles.profileImage} />
          ) : (
            <Image source={require('../../../img/Default_pfp.svg.png')} style={styles.profileImage} />
          )}
          <Text size="2xs" color={STATIC.black} style={styles.sharedByText}>
            <Text style={styles.sharedBySubline}>Shared By{'\n'}</Text>
            <Text style={styles.sharedByUsername}>
              {userData.username}
              {'\n'}
            </Text>
            <Text style={styles.sharedBySubline}>
              {userData.city}, {userData.state}
            </Text>
          </Text>
        </Box>
      </Box>
    </ScrollView>
  </>
);
