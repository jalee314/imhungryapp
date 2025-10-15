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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

    const openImageViewer = () => {
        setModalImageLoading(true);
        setModalImageError(false);
        setImageViewVisible(true);
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
                
                {/* Header with background and content */}
                <View style={styles.headerBackground}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={onClose} disabled={isPosting}>
                            <Ionicons name="arrow-back" size={20} color={isPosting ? "#ccc" : "#000000"} />
                        </TouchableOpacity>
                        <View style={styles.shareButtonWrapper}>
                            <TouchableOpacity 
                                style={[styles.shareButton, isPosting && styles.disabledButton]} 
                                onPress={onPost}
                                disabled={isPosting}
                            >
                                {isPosting ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                ) : (
                                    <Text style={styles.shareButtonText}>Share</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        {/* Restaurant Info */}
                        <View style={styles.restaurantWrapper}>
                            <Text style={styles.restaurantText}>
                                <Text style={styles.restaurantName}>{selectedRestaurant?.name}{"\n"}</Text>
                                <Text style={styles.infoText}>📍 {isCalculatingDistance ? 'Calculating...' : distance} </Text>
                                <Text style={styles.bulletText}>•</Text>
                                <Text style={styles.infoText} numberOfLines={1}> {selectedRestaurant?.subtext}{"\n"}⏳ Valid Until: {formatDate(expirationDate)}{"\n"}🍽 {selectedCuisine || 'Cuisine'} </Text>
                                {selectedCategory && (
                                    <>
                                        <Text style={styles.bulletText}>•</Text>
                                        <Text style={styles.infoText}> {selectedCategory}</Text>
                                    </>
                                )}
                            </Text>
                        </View>

                        {/* Separator */}
                        <View style={styles.separator} />

                        {/* Deal Title */}
                        <Text style={styles.dealTitle}>{dealTitle}</Text>

                        {/* Deal Image */}
                        {imageUri && (
                            <TouchableOpacity onPress={openImageViewer}>
                                <Image source={{ uri: imageUri }} style={styles.dealImage} />
                            </TouchableOpacity>
                        )}

                        {/* Interactions */}
                        <View style={styles.interactionsContainer}>
                            <View style={styles.voteContainer}>
                                <TouchableOpacity style={styles.voteButton} activeOpacity={1}>
                                    <MaterialCommunityIcons name="arrow-up-bold-outline" size={17} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.voteCount}>0</Text>
                                <View style={styles.voteSeparator} />
                                <TouchableOpacity style={styles.voteButton} activeOpacity={1}>
                                    <MaterialCommunityIcons name="arrow-down-bold-outline" size={17} color="#000" />
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
  headerBackground: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 28,
  },
  shareButtonWrapper: {
    width: 90,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: '#FF8C4CCC',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
    height: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 16,
    textAlign: 'center',
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
  restaurantText: {
    width: 329,
    alignSelf: 'stretch',
    color: '#000000',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: -10,
  },
  restaurantName: {
    fontWeight: '700',
  },
  infoText: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  bulletText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '300',
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
    alignSelf: 'stretch',
    aspectRatio: 0.75,
    width: '100%',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
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
    backgroundColor: '#D7D7D7',
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
  fullScreenImage: {
    width: '100%',
    height: '100%',
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
