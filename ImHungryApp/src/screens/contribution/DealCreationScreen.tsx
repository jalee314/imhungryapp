import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import BottomNavigation from '../../components/BottomNavigation';
import CalendarModal from '../../components/CalendarModal';
import ListSelectionModal from '../../components/ListSelectionModal';
import PhotoActionModal from '../../components/PhotoActionModal';
import Header from '../../components/Header';
import DealPreviewScreen from './DealPreviewScreen';
import { useDataCache } from '../../context/DataCacheContext';
import { fetchUserData, clearUserCache } from '../../services/userService';
import { createDeal, checkDealContentForProfanity } from '../../services/dealService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ProfileCacheService } from '../../services/profileCacheService';
import { searchRestaurants, getOrCreateRestaurant, GooglePlaceResult } from '../../services/restaurantService';
import { getCurrentUserLocation, calculateDistance } from '../../services/locationService';

// --- Debounce Helper Function ---
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// --- Interfaces and Data ---
interface Restaurant {
  id: string;
  name: string;
  subtext: string;
  google_place_id?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export default function DealCreationScreen() {
  // Get data from the context (removed 'restaurants')
  const { categories, cuisines, loading: dataLoading, error } = useDataCache();
  
  const [userData, setUserData] = useState({
    username: '',
    profilePicture: null,
    city: '',
    state: ''
  });
  const [dealTitle, setDealTitle] = useState('');
  const [dealDetails, setDealDetails] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] = useState(false);
  const [isFoodTagsModalVisible, setIsFoodTagsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Google Places search state
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const detailsInputRef = useRef(null);
  const titleInputRef = useRef(null);

  const loadUserData = async () => {
    try {
      const data = await fetchUserData();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  // NEW: Get device's current location (not from database)
  const getDeviceLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting device location:', error);
      return null;
    }
  };

  // Debounced Google Places search (when user types)
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        // Get device location for search
        const deviceLocation = await getDeviceLocation();
        
        if (!deviceLocation) {
          setSearchError('Location not available. Please enable location services.');
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        // Search via Google Places API
        const result = await searchRestaurants(
          query,
          deviceLocation.lat,
          deviceLocation.lng
        );

        if (!result.success) {
          setSearchError(result.error || 'Failed to search restaurants');
          setSearchResults([]);
        } else if (result.count === 0) {
          setSearchError('No restaurants found');
          setSearchResults([]);
        } else {
          // Transform results to match Restaurant interface
          const transformed = result.restaurants.map((place: GooglePlaceResult) => ({
            id: place.google_place_id,
            name: place.name,
            subtext: `${place.address} • ${place.distance_miles} mi away`,
            google_place_id: place.google_place_id,
            lat: place.lat,
            lng: place.lng,
            address: place.address,
          }));
          
          setSearchResults(transformed);
          setSearchError(null);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle search query change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };
  
  // All existing handler functions remain the same
  const handleAddPhoto = () => setIsCameraModalVisible(true);
  const handleCloseCameraModal = () => setIsCameraModalVisible(false);

  const handleTakePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    handleCloseCameraModal();
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleChooseFromAlbum = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    handleCloseCameraModal();
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleConfirmDate = (date: string | null) => {
    setExpirationDate(date);
    setIsCalendarModalVisible(false);
  };

  const handleDoneCategories = (categoryIds: string[]) => {
    setSelectedCategory(categoryIds.length > 0 ? categoryIds[0] : null);
    setIsCategoriesModalVisible(false);
  };

  const handleDoneCuisines = (cuisineIds: string[]) => {
    setSelectedCuisine(cuisineIds.length > 0 ? cuisineIds[0] : null);
    setIsFoodTagsModalVisible(false);
  };

  // Handle restaurant selection with Google Places persistence
  const handleDoneSearch = async (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      // Get selected restaurant from search results
      const selectedPlace = searchResults.find(r => r.id === selectedIds[0]);
      
      if (selectedPlace && selectedPlace.google_place_id) {
        setIsSearchModalVisible(false);
        
        try {
          // Persist to database and get restaurant_id
          const result = await getOrCreateRestaurant({
            google_place_id: selectedPlace.google_place_id,
            name: selectedPlace.name,
            address: selectedPlace.address || selectedPlace.subtext.split(' • ')[0],
            lat: selectedPlace.lat!,
            lng: selectedPlace.lng!,
            distance_miles: 0,
          });

          if (result.success && result.restaurant_id) {
            setSelectedRestaurant({
              id: result.restaurant_id,
              name: selectedPlace.name,
              subtext: selectedPlace.subtext,
              lat: selectedPlace.lat!, // Add lat
              lng: selectedPlace.lng!, // Add lng
            });
          } else {
            Alert.alert('Error', 'Failed to save restaurant. Please try again.');
          }
        } catch (error) {
          console.error('Error saving restaurant:', error);
          Alert.alert('Error', 'An unexpected error occurred.');
        }
      }
    }
    
    // Clear search state
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  const handleClearRestaurant = () => setSelectedRestaurant(null);
  
  const handleSearchPress = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearchModalVisible(true);
  };

  const handlePreview = async () => {
    if (!selectedRestaurant || !dealTitle) {
      Alert.alert("Missing Information", "Please select a restaurant and add a deal title to continue.");
      return;
    }

    // Check for profanity before showing preview
    try {
      const profanityCheck = await checkDealContentForProfanity(dealTitle, dealDetails);
      if (!profanityCheck.success) {
        Alert.alert("Content Review", profanityCheck.error);
        return;
      }
    } catch (error) {
      console.error('Error checking profanity:', error);
      // If profanity check fails, show preview anyway
    }

    setIsPreviewVisible(true);
  };

  const handlePost = async () => {
    if (!selectedRestaurant || !dealTitle) {
      Alert.alert("Missing Information", "Please select a restaurant and add a deal title to continue.");
      return;
    }

    setIsPosting(true);
    
    try {
      const dealData = {
        title: dealTitle,
        description: dealDetails,
        imageUri: imageUri,
        expirationDate: expirationDate,
        restaurantId: selectedRestaurant.id,
        categoryId: selectedCategory,
        cuisineId: selectedCuisine,
        isAnonymous: isAnonymous,
      };

      // Check for profanity before proceeding
      const profanityCheck = await checkDealContentForProfanity(dealData.title, dealData.description);
      if (!profanityCheck.success) {
        Alert.alert("Content Review", profanityCheck.error || "Content contains inappropriate language.");
        setIsPosting(false);
        return;
      }

      const result = await createDeal(dealData);
      
      if (result.success) {
        await ProfileCacheService.forceRefresh();
        
        Alert.alert(
          "Success!", 
          "Your deal has been posted successfully!", 
          [
            {
              text: "OK",
              onPress: () => {
                // Clear the form
                setDealTitle('');
                setDealDetails('');
                setImageUri(null);
                setExpirationDate(null);
                setSelectedCategory(null);
                setSelectedCuisine(null);
                setSelectedRestaurant(null);
                setIsAnonymous(false);
                setIsPreviewVisible(false);
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to post deal. Please try again.");
      }
    } catch (error) {
      console.error('Error posting deal:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'Unknown') return null;
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDetailsFocus = () => {
    setTimeout(() => {
      if (scrollViewRef.current && detailsInputRef.current) {
        scrollViewRef.current.scrollToPosition(0, 300, true);
      }
    }, 100);
  };

  const handleTitleFocus = () => {
    setTimeout(() => {
      if (scrollViewRef.current && titleInputRef.current) {
        scrollViewRef.current.scrollToPosition(0, 100, true);
      }
    }, 100);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '';
    return categories.find(c => c.id === selectedCategory)?.name || '';
  };

  const getSelectedCuisineName = () => {
    if (!selectedCuisine) return '';
    return cuisines.find(c => c.id === selectedCuisine)?.name || '';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Header onLocationPress={() => console.log('Location pressed')} />

      {/* Show a loading indicator when data is being loaded */}
      {dataLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFA05C" />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          style={styles.mainFrame}
          contentContainerStyle={styles.mainFrameContentContainer}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={120}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardOpeningTime={0}
          scrollToOverflowEnabled={true}
        >
          <View style={styles.reviewButtonRow}>
            <TouchableOpacity 
              style={[styles.reviewButton, dataLoading ? styles.disabledButton : null]} 
              onPress={handlePreview}
              disabled={dataLoading}
            >
              <Text style={styles.reviewButtonText}>PREVIEW</Text>
            </TouchableOpacity>
          </View>

          {selectedRestaurant ? (
            <View style={styles.selectedRestaurantContainer}>
              <View style={styles.restaurantTextContainer}>
                <Text style={styles.selectedRestaurantName}>{selectedRestaurant.name}</Text>
                <Text style={styles.selectedRestaurantAddress}>{selectedRestaurant.subtext}</Text>
              </View>
              <TouchableOpacity onPress={handleClearRestaurant}>
                <Ionicons name="close-circle" size={24} color="#C1C1C1" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
              <Ionicons name="search" size={20} color="rgba(60, 60, 67, 0.6)" />
              <Text style={styles.searchPlaceholder}>Search Restaurant</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dealTitleBox}>
            <TextInput
              ref={titleInputRef}
              style={styles.dealTitleText}
              value={dealTitle}
              onChangeText={setDealTitle}
              placeholder='Deal Title - "$10 Sushi before 5pm on M-W"'
              placeholderTextColor="#888889"
              multiline
              maxLength={100}
              onFocus={handleTitleFocus}
            />
            <Text style={styles.characterCount}>{dealTitle.length}/100</Text>
          </View>

          <View style={styles.extraDetailsContainer}>
            <TouchableOpacity style={styles.optionRow} onPress={handleAddPhoto}>
              <Ionicons name="camera-outline" size={24} color="#404040" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Add Photo</Text>
                {imageUri && <Text style={styles.optionSubText}>Photo Added</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.optionRow} onPress={() => setIsCalendarModalVisible(true)}>
              <Ionicons name="time-outline" size={24} color="#4E4E4E" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Expiration Date</Text>
                {expirationDate && (
                  <Text style={styles.optionSubText}>
                    {expirationDate === 'Unknown' ? 'Not Known' : formatDate(expirationDate)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.optionRow} onPress={() => setIsCategoriesModalVisible(true)}>
              <Ionicons name="grid-outline" size={24} color="#606060" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Deal Category</Text>
                {selectedCategory && <Text style={styles.optionSubText} numberOfLines={1}>{getSelectedCategoryName()}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.optionRow} onPress={() => setIsFoodTagsModalVisible(true)}>
              <Ionicons name="pricetag-outline" size={24} color="#606060" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Cuisine Tag</Text>
                {selectedCuisine && <Text style={styles.optionSubText} numberOfLines={1}>{getSelectedCuisineName()}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <View style={styles.optionRow}>
              <MaterialCommunityIcons name="incognito" size={24} color="#606060" />
              <Text style={[styles.optionText, { flex: 1 }]}>Anonymous</Text>
              <Switch trackColor={{ false: "#D2D5DA", true: "#FFA05C" }} thumbColor={"#FFFFFF"} onValueChange={setIsAnonymous} value={isAnonymous} />
            </View>
            <View style={styles.separator} />
            <View style={styles.optionRow}>
              <Ionicons name="menu-outline" size={24} color="#606060" />
              <Text style={[styles.optionText, { flex: 1 }]}>Extra Details</Text>
            </View>
            <TextInput
              ref={detailsInputRef}
              style={styles.extraDetailsInput}
              value={dealDetails}
              onChangeText={setDealDetails}
              placeholder="• Is it valid for takeout, delivery, or dine-in?&#10;• Does it apply to a specific menu section?&#10;• Are there any limitations or exclusions?"
              placeholderTextColor="#888889"
              multiline
              onFocus={handleDetailsFocus}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* Modals and BottomNavigation outside the SafeAreaView */}
      <PhotoActionModal
        visible={isCameraModalVisible}
        onClose={handleCloseCameraModal}
        onTakePhoto={handleTakePhoto}
        onChooseFromAlbum={handleChooseFromAlbum}
      />
      <CalendarModal visible={isCalendarModalVisible} onClose={() => setIsCalendarModalVisible(false)} onConfirm={handleConfirmDate} initialDate={expirationDate} />
      <ListSelectionModal 
        visible={isCategoriesModalVisible} 
        onClose={() => setIsCategoriesModalVisible(false)} 
        onDone={handleDoneCategories} 
        initialSelected={selectedCategory ? [selectedCategory] : []} 
        data={categories}
        title="Select Deal Category" 
        singleSelect={true}
      />
      <ListSelectionModal 
        visible={isFoodTagsModalVisible} 
        onClose={() => setIsFoodTagsModalVisible(false)} 
        onDone={handleDoneCuisines} 
        initialSelected={selectedCuisine ? [selectedCuisine] : []} 
        data={cuisines}
        title="Select Cuisine Tag" 
        singleSelect={true}
      />
      <ListSelectionModal 
        visible={isSearchModalVisible} 
        onClose={() => {
          setIsSearchModalVisible(false);
          setSearchQuery('');
          setSearchResults([]);
          setSearchError(null);
        }} 
        onDone={handleDoneSearch} 
        data={
          isSearching 
            ? [{ id: 'loading', name: 'Searching restaurants...', subtext: '' }]
            : searchError
            ? [{ id: 'error', name: searchError, subtext: 'Try a different search' }]
            : searchQuery.trim().length > 0
            ? (searchResults.length > 0 
                ? searchResults 
                : [{ id: 'empty', name: 'No results found', subtext: 'Try a different search term' }])
            : [{ id: 'prompt', name: 'Search for a restaurant', subtext: 'Start typing to see results...' }]
        } 
        title="Search Restaurant"
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
      />

      <DealPreviewScreen
        visible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
        onPost={handlePost}
        dealTitle={dealTitle}
        dealDetails={dealDetails}
        imageUri={imageUri}
        expirationDate={expirationDate}
        selectedRestaurant={selectedRestaurant}
        selectedCategory={getSelectedCategoryName()}
        userData={userData}
        isPosting={isPosting}
      />

      <BottomNavigation
          photoUrl={userData.profilePicture ? { uri: userData.profilePicture } : require('../../../img/Default_pfp.svg.png')}
          activeTab="contribute"
          onTabPress={(tab) => console.log('Tab pressed:', tab)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  mainFrame: {
    flex: 1,
    width: '100%',
  },
  mainFrameContentContainer: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 20,
    gap: 14,
  },
  reviewButtonRow: {
    width: '100%',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    width: 90,
    height: 30,
    backgroundColor: '#FFA05C',
    borderRadius: 30,
  },
  reviewButtonText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 369,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    gap: 8,
    paddingHorizontal: 16,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    color: 'rgba(60, 60, 67, 0.6)',
    marginLeft: 8,
  },
  selectedRestaurantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: 369,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  restaurantTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  selectedRestaurantName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
    marginBottom: 2,
  },
  selectedRestaurantAddress: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
  },
  dealTitleBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: 369,
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  dealTitleTextInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    flex: 1,
  },
  dealTitleTextPlaceholder: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
    flex: 1,
  },
  characterCount: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#888889',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  extraDetailsContainer: {
    width: 369,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
    gap: 16,
  },
  optionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  optionSubText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#888889',
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C1C1C1',
    marginHorizontal: 16,
  },
  extraDetailsInput: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000000',
    minHeight: 130,
    textAlignVertical: 'top',
  },
  safeAreaContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 20,
    gap: 14,
  },
  dealTitleText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  disabledButton: {
    opacity: 0.5,
  },
});