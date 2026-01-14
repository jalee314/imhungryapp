import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react-native';
import { getCurrentUserLocation, calculateDistance } from '../../services/locationService';

const { width: screenWidth } = Dimensions.get('window');

// Base design width (iPhone 15 = 393pt) - matches VoteButtons component
const BASE_WIDTH = 393;
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

// Dynamic sizes for vote buttons - matches VoteButtons component exactly
const PILL_WIDTH = scale(85);
const PILL_HEIGHT = scale(28);
const ARROW_SIZE = Math.round(scale(18));

interface Restaurant {
  id: string;
  name: string;
  subtext: string;
  lat?: number;
  lng?: number;
}

interface User {
  username: string;
  profilePicture: string | null;
  city: string;
  state: string;
}

interface DealPreviewScreenProps {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
  dealTitle: string;
  dealDetails: string;
  imageUris: string[];
  expirationDate: string | null;
  selectedRestaurant: Restaurant | null;
  selectedCategory: string;
  selectedCuisine: string;
  userData: User;
  isPosting?: boolean;
}

const DealPreviewScreen: React.FC<DealPreviewScreenProps> = ({
  visible,
  onClose,
  onPost,
  dealTitle,
  dealDetails,
  imageUris,
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
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
  const [imageViewerKey, setImageViewerKey] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(400)).current; // Start off-screen to the right

  useEffect(() => {
    if (visible) {
      // Slide in from right
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate out to the right when closing
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const removeZipCode = (address: string) => {
    // Remove zip code (5 digits or 5+4 digits) from the end of the address
    return address.replace(/,?\s*\d{5}(-\d{4})?$/, '').trim();
  };

  useEffect(() => {
    const calculateRestaurantDistance = async () => {
      if (!selectedRestaurant?.lat || !selectedRestaurant?.lng) {
        setDistance('?mi away');
        return;
      }

      setIsCalculatingDistance(true);

      try {
        const userLocation = await getCurrentUserLocation();

        if (userLocation) {
          const distanceMiles = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            selectedRestaurant.lat,
            selectedRestaurant.lng
          );

          // Format distance with no decimals
          const formattedDistance = distanceMiles < 1
            ? '<1mi away'
            : `${Math.round(distanceMiles)}mi away`;

          setDistance(formattedDistance);
        } else {
          setDistance('?mi away');
        }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'Unknown') return 'Not Known';
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const openImageViewer = () => {
    setModalImageLoading(true);
    setModalImageError(false);
    setImageViewVisible(true);
    // Force ScrollView to re-render with fresh state
    setImageViewerKey(prev => prev + 1);
  };

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
  };


  return (
    <Modal visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />

          {/* Back Button and Next Button Row */}
          <View style={styles.topButtonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              disabled={isPosting}
            >
              <Ionicons name="arrow-back" size={20} color={isPosting ? "#ccc" : "#000000"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextButton, isPosting ? styles.disabledButton : null]}
              onPress={onPost}
              disabled={isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.nextButtonText}>Share</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              {/* Restaurant Info */}
              <View style={styles.restaurantWrapper}>
                <Text style={styles.restaurantName}>{selectedRestaurant?.name}</Text>

                {/* Location row */}
                <View style={styles.locationRow}>
                  <Text style={styles.infoText}>📍 {isCalculatingDistance ? 'Calculating...' : distance} </Text>
                  <Text style={styles.bulletText}>•</Text>
                  <Text style={styles.infoText} numberOfLines={1}> {removeZipCode(selectedRestaurant?.subtext || '')}</Text>
                </View>

                {/* Valid until row */}
                <View style={styles.validUntilRow}>
                  <Text style={styles.infoText}>⏳ Valid Until • {formatDate(expirationDate)}</Text>
                </View>

                {/* Only show category row if cuisine or deal type exists and has meaningful content */}
                {((selectedCuisine && selectedCuisine.trim() !== '' && selectedCuisine !== 'Cuisine') ||
                  (selectedCategory && selectedCategory.trim() !== '')) && (
                    <View style={styles.categoryRow}>
                      <Text style={styles.infoText}>
                        {selectedCuisine && selectedCuisine.trim() !== '' && selectedCuisine !== 'Cuisine' && (
                          <Text style={styles.infoRegular}>🍽 {selectedCuisine}</Text>
                        )}
                        {selectedCuisine && selectedCuisine.trim() !== '' && selectedCuisine !== 'Cuisine' &&
                          selectedCategory && selectedCategory.trim() !== '' && (
                            <Text style={styles.bulletText}> • </Text>
                          )}
                        {selectedCategory && selectedCategory.trim() !== '' && (
                          <Text style={styles.infoRegular}> {selectedCategory}</Text>
                        )}
                      </Text>
                    </View>
                  )}
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Deal Title */}
              <Text style={styles.dealTitle}>{dealTitle}</Text>

              {/* Deal Images Carousel */}
              {imageUris.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <FlatList
                    ref={carouselRef}
                    data={imageUris}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    scrollEnabled={true}
                    style={{ height: 250 }}
                    onMomentumScrollEnd={(event) => {
                      const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
                      setCurrentImageIndex(index);
                    }}
                    keyExtractor={(item, index) => `preview-image-${index}`}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentImageIndex(index);
                          openImageViewer();
                        }}
                        style={{ width: screenWidth - 32 }}
                      >
                        <Image
                          source={{ uri: item }}
                          style={[
                            styles.dealImage,
                            { width: screenWidth - 32 }
                          ]}
                          resizeMode="cover"
                          onLoad={handleImageLoad}
                        />
                      </TouchableOpacity>
                    )}
                  />
                  {/* Pagination Dots */}
                  {imageUris.length > 1 && (
                    <View style={styles.paginationContainer}>
                      {imageUris.map((_, index) => (
                        <View
                          key={`dot-${index}`}
                          style={[
                            styles.paginationDot,
                            currentImageIndex === index && styles.paginationDotActive
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Interactions (Preview State - Non-interactive, matches DealDetailScreen) */}
              <View style={styles.actionButtonsContainer}>
                <View style={styles.voteContainer}>
                  <View style={styles.upvoteArea}>
                    <ArrowBigUp size={ARROW_SIZE} color="#000000" fill="transparent" />
                    <Text style={styles.voteCount}>0</Text>
                  </View>
                  <View style={styles.voteSeparator} />
                  <View style={styles.downvoteArea}>
                    <ArrowBigDown size={ARROW_SIZE} color="#000000" fill="transparent" />
                  </View>
                </View>

                <View style={styles.rightActions}>
                  <View style={styles.actionButton}>
                    <Monicon name="mdi:heart-outline" size={19} color="#000" />
                  </View>
                  <View style={styles.actionButton}>
                    <Monicon name="mdi-light:share" size={24} color="#000000" />
                  </View>
                </View>
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Deal Details */}
              {dealDetails ? (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsHeader}>Details</Text>
                  <Text style={styles.detailsContent}>{dealDetails}</Text>
                </View>
              ) : null}

              {/* Shared By Section */}
              <View style={styles.sharedByComponent}>
                {userData.profilePicture ? (
                  <Image source={{ uri: userData.profilePicture }} style={styles.pfp} />
                ) : (
                  <Image source={require('../../../img/Default_pfp.svg.png')} style={styles.pfp} />
                )}
                <Text style={styles.sharedByText}>
                  <Text style={styles.sharedByLabel}>Shared By{"\n"}</Text>
                  <Text style={styles.userName}>{userData.username}{"\n"}</Text>
                  <Text style={styles.userLocation}>{userData.city}, {userData.state}</Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {imageUris.length > 0 && imageUris[currentImageIndex] && (
        <Modal
          visible={isImageViewVisible}
          transparent={true}
          onRequestClose={() => setImageViewVisible(false)}
        >
          <View style={styles.imageViewerContainer}>
            <TouchableOpacity
              style={styles.imageViewerCloseButton}
              onPress={() => setImageViewVisible(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            {modalImageLoading && (
              <ActivityIndicator size="large" color="#FFFFFF" style={styles.modalImageLoader} />
            )}
            <ScrollView
              key={imageViewerKey}
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              bouncesZoom={true}
              centerContent={true}
            >
              <Image
                source={{ uri: imageUris[currentImageIndex] }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onLoad={() => setModalImageLoading(false)}
                onError={() => {
                  setModalImageLoading(false);
                  setModalImageError(true);
                }}
              />
            </ScrollView>
            {modalImageError && (
              <View style={styles.modalErrorContainer}>
                <Text style={styles.modalErrorText}>Could not load image</Text>
              </View>
            )}
            {/* Image counter */}
            {imageUris.length > 1 && (
              <View style={styles.imageCounterContainer}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {imageUris.length}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topButtonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  nextButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 140, 76, 0.8)',
    borderRadius: 10,
    minWidth: 90,
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#000000',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 16,
  },
  restaurantWrapper: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validUntilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 20,
  },
  infoRegular: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
  },
  bulletText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '300',
    color: '#000000',
  },
  separator: {
    alignSelf: 'stretch',
    height: 0.5,
    backgroundColor: '#DEDEDE',
    width: '100%',
    marginVertical: 8,
  },
  dealTitle: {
    alignSelf: 'stretch',
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  dealImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    alignSelf: 'center',
  },
  // Matches DealDetailScreen.actionButtonsContainer exactly
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Matches VoteButtons.voteContainer exactly
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    height: PILL_HEIGHT,
    width: PILL_WIDTH,
    overflow: 'hidden',
  },
  // Matches VoteButtons.upvoteArea exactly
  upvoteArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingLeft: scale(8),
    paddingRight: scale(2),
  },
  // Matches VoteButtons.downvoteArea exactly
  downvoteArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: scale(10),
  },
  // Matches VoteButtons.voteCount exactly
  voteCount: {
    fontFamily: 'Inter',
    fontSize: scale(10),
    fontWeight: '400',
    color: '#000000',
    marginLeft: scale(4),
  },
  // Matches VoteButtons.voteSeparator exactly
  voteSeparator: {
    width: 1,
    height: scale(12),
    backgroundColor: '#DEDEDE',
  },
  // Matches DealDetailScreen.rightActions exactly
  rightActions: {
    flexDirection: 'row',
    gap: 4,
  },
  // Matches DealDetailScreen.actionButton exactly
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    alignSelf: 'stretch',
  },
  detailsHeader: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 10,
  },
  detailsContent: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#000000',
    fontWeight: '400',
  },
  sharedByComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  pfp: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  sharedByText: {
    color: '#000000',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  sharedByLabel: {
    letterSpacing: 0.2,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  userLocation: {
    letterSpacing: 0.2,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
  },
  modalImageLoader: {
    position: 'absolute',
  },
  modalErrorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalErrorText: {
    color: 'white',
    fontSize: 16,
  },
  // Pagination styles for image carousel
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFA05C',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Image counter in fullscreen viewer
  imageCounterContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DealPreviewScreen;
