import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUserLocation, calculateDistance } from '../../services/locationService';

interface Restaurant {
  id: string;
  name: string;
  subtext: string; // This will be used for the address
  lat?: number; // Add lat/lng to restaurant interface
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
    selectedCategory: string; // Changed from array to single string
    selectedCuisine: string; // Add this new prop
    userData: User;
    isPosting?: boolean; // Added loading state prop
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
    selectedCuisine, // Add this parameter
    userData,
    isPosting = false,
}) => {
    const [distance, setDistance] = useState<string>('?mi away');
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

    // Calculate distance when component mounts or restaurant changes
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
                    
                    // Format distance to 1 decimal place
                    const formattedDistance = distanceMiles < 0.1 
                        ? '<0.1mi away' 
                        : `${distanceMiles.toFixed(1)}mi away`;
                    
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

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} disabled={isPosting}>
                        <Ionicons name="arrow-back" size={24} color={isPosting ? "#ccc" : "#404040"} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.postButton, isPosting && styles.disabledButton]} 
                        onPress={onPost}
                        disabled={isPosting}
                    >
                        {isPosting ? (
                            <ActivityIndicator size="small" color="#000000" />
                        ) : (
                            <Text style={styles.postButtonText}>POST</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        <View style={styles.restaurantHeader}>
                            <View style={styles.restaurantInfo}>
                                <Text style={styles.restaurantName}>{selectedRestaurant?.name}</Text>
                                <Text style={styles.restaurantSubtext}>
                                    {isCalculatingDistance ? 'Calculating...' : distance} • {selectedRestaurant?.subtext}
                                </Text>
                                <Text style={styles.restaurantSubtext}>
                                    Valid until: {formatDate(expirationDate)}
                                </Text>
                                <Text style={styles.restaurantSubtext}>
                                    {selectedCuisine && selectedCategory ? `${selectedCuisine} • ${selectedCategory}` : 
                                     selectedCuisine ? selectedCuisine : 
                                     selectedCategory ? selectedCategory : ''}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.dealTitle}>{dealTitle}</Text>
                        {imageUri && <Image source={{ uri: imageUri }} style={styles.dealImage} />}
                        {dealDetails ? <Text style={styles.dealDetails}>{dealDetails}</Text> : null}

                        <View style={styles.sharedByContainer}>
                            {userData.profilePicture ? (
                                <Image source={{ uri: userData.profilePicture }} style={styles.pfp} />
                            ) : (
                                <Image source={require('../../../img/Default_pfp.svg.png')} style={styles.pfp} />
                            )}
                            <View>
                                <Text style={styles.sharedByLabel}>Shared By</Text>
                                <Text style={styles.userName}>{userData.username}</Text>
                                <Text style={styles.userLocation}>{`${userData.city}, ${userData.state}`}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  postButton: {
    backgroundColor: '#FF8C4C',
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 8,
  },
  restaurantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#000000',
    lineHeight: 15,
  },
  restaurantSubtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#555555',
    lineHeight: 15,
  },
  dealTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    color: '#000000',
  },
  dealImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
  },
  dealDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: '#757575',
  },
  sharedByContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 16,
    width: 244.25,
  },
  pfp: {
    width: 50.25,
    height: 50.25,
    borderRadius: 25,
  },
  sharedByLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.02,
    color: '#000000',
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.02,
    color: '#000000',
    fontWeight: 'bold',
  },
  userLocation: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.02,
    color: '#000000',
  },
});

export default DealPreviewScreen;