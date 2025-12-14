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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Monicon } from '@monicon/native';
import { getCurrentUserLocation, calculateDistance } from '../../services/locationService';

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
    imageUri: string | null;
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
    imageUri,
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
    const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
    const [imageViewerKey, setImageViewerKey] = useState(0);
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
                                <Text style={styles.infoText}>⏳ Valid Until: {formatDate(expirationDate)}</Text>
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

                        {/* Deal Image */}
                        {imageUri && (
                            <TouchableOpacity onPress={openImageViewer}>
                                <Image 
                                    source={{ uri: imageUri }} 
                                    style={[
                                        styles.dealImage,
                                        imageDimensions && {
                                            height: (imageDimensions.height / imageDimensions.width) * 350
                                        }
                                    ]}
                                    resizeMode="cover"
                                    onLoad={handleImageLoad}
                                />
                            </TouchableOpacity>
                        )}

                        {/* Interactions */}
                        <View style={styles.interactionsContainer}>
                            <View style={styles.voteContainer}>
                                <TouchableOpacity style={styles.voteButton} activeOpacity={1}>
                                    <Monicon name="ph:arrow-fat-up-fill" size={17} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.voteCount}>0</Text>
                                <View style={styles.voteSeparator} />
                                <TouchableOpacity style={styles.voteButton} activeOpacity={1}>
                                    <Monicon name="ph:arrow-fat-down-fill" size={17} color="#000" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.favContainer}>
                                <TouchableOpacity style={styles.favoriteButton} activeOpacity={1}>
                                    <MaterialCommunityIcons name="heart-outline" size={19} color="#000" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.shareIconButton} activeOpacity={1}>
                                    <MaterialCommunityIcons name="share-outline" size={16} color="#000" />
                                </TouchableOpacity>
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

            {imageUri && (
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
                                source={{ uri: imageUri }} 
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
    gap: 12,
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
    height: 1,
    backgroundColor: '#D7D7D7',
    width: '100%',
  },
  dealTitle: {
    alignSelf: 'stretch',
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 1,
  },
  dealImage: {
    width: '100%',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    alignSelf: 'center',
  },
  interactionsContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
    height: 28,
  },
  voteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 24,
  },
  voteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginHorizontal: 6,
  },
  voteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 6,
  },
  favContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
  },
  favoriteButton: {
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 12,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIconButton: {
    backgroundColor: '#F8F4F4',
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
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 16,
  },
  pfp: {
    width: 50.25,
    height: 50.25,
    borderRadius: 25.125,
  },
  sharedByText: {
    color: '#000000',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    height: 46.5,
    letterSpacing: 0.2,
    lineHeight: 15,
    marginTop: -1,
    width: 186,
  },
  sharedByLabel: {
    letterSpacing: 0.02,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.03,
  },
  userLocation: {
    letterSpacing: 0.02,
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
});

export default DealPreviewScreen;
