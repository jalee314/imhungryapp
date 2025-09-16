import React, { useState, useRef, useEffect } from 'react';
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
import BottomNavigation from '../../components/BottomNavigation';
import CalendarModal from '../../components/CalendarModal';
import ListSelectionModal from '../../components/ListSelectionModal';
import PhotoActionModal from '../../components/PhotoActionModal';
import Header from '../../components/Header';
import DealPreviewScreen from './DealPreviewScreen';
import { useDataCache } from '../../context/DataCacheContext';
import { fetchUserData, clearUserCache } from '../../services/userService';
import { createDeal, checkDealContentForProfanity } from '../../services/dealService'; // Import the deal service

// --- Interfaces and Data ---
interface Restaurant {
  id: string;
  name: string;
  subtext: string;
}

export default function DealCreationScreen() {
  // Get data from the context
  const { categories, cuisines, restaurants, loading: dataLoading, error } = useDataCache();
  
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
  // Changed from arrays to single values
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const detailsInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await fetchUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Filter restaurants based on search query
  const filteredRestaurants = restaurants
    .filter(r => r && r.name && r.address)
    .map(r => ({
      id: r.id,
      name: r.name,
      subtext: r.address
    }))
    .filter(r => 
      searchQuery.trim() === '' || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subtext.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
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

  // Updated to handle single selection
  const handleDoneCategories = (categoryIds: string[]) => {
    setSelectedCategory(categoryIds.length > 0 ? categoryIds[0] : null);
    setIsCategoriesModalVisible(false);
  };

  // Updated to handle single selection
  const handleDoneCuisines = (cuisineIds: string[]) => {
    setSelectedCuisine(cuisineIds.length > 0 ? cuisineIds[0] : null);
    setIsFoodTagsModalVisible(false);
  };

  const handleDoneSearch = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      const restaurant = filteredRestaurants.find(r => r.id === selectedIds[0]);
      if (restaurant) setSelectedRestaurant(restaurant);
    }
    setIsSearchModalVisible(false);
  };

  const handleClearRestaurant = () => setSelectedRestaurant(null);
  const handleSearchPress = () => {
    setSearchQuery('');
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
        return { success: false, error: profanityCheck.error };
      }

      const result = await createDeal(dealData);
      
      if (result.success) {
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

  // Helper functions to display selected items (updated for single selection)
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
        onClose={() => setIsSearchModalVisible(false)} 
        onDone={handleDoneSearch} 
        data={filteredRestaurants.length > 0 ? filteredRestaurants : [
          { id: 'placeholder', name: 'No restaurants found', subtext: 'Try a different search' }
        ]} 
        title="Search Restaurant"
        onSearchChange={setSearchQuery}
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