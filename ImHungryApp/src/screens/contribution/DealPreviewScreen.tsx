import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import BottomNavigation from '../../components/BottomNavigation';
import CalendarModal from '../../components/CalendarModal';
import ListSelectionModal from '../../components/ListSelectionModal';
import PhotoActionModal from '../../components/PhotoActionModal';

// --- Interfaces and Data ---
interface Restaurant {
  id: string;
  name: string;
  subtext: string;
}

const DEAL_CATEGORIES = [
  { id: '1', name: 'Happy Hour 🍹' },
  { id: '2', name: 'BOGO / 2-for-1' },
  { id: '3', name: 'Discount % / Dollar Off' },
  { id: '4', name: 'Meal Specials (e.g., "$10 lunch combo")' },
  { id: '5', name: 'Student Discount 🎓' },
  { id: '6', name: 'Daily Specials (e.g., "Taco Tuesday", "Wing Wednesday")' },
  { id: '7', name: 'Buffet / All-You-Can-Eat' },
  { id: '8', name: 'Drinks & Bar Deals 🍺' },
  { id: '9', name: 'Family / Group Deals 👨‍👩‍👧‍👦' },
  { id: '10', name: 'Seasonal / Limited-Time Offers ⏳' },
  { id: '11', name: 'Loyalty / Rewards Program' },
];

const FOOD_TAGS = [
    { id: '1', name: 'Pizza 🍕' },
    { id: '2', name: 'Burgers 🍔' },
    { id: '3', name: 'Tacos / Mexican 🌮' },
    { id: '4', name: 'Sushi / Japanese 🍣' },
    { id: '5', name: 'Chinese / Asian 🥡' },
    { id: '6', name: 'Italian / Pasta 🍝' },
    { id: '7', name: 'BBQ 🍖' },
    { id: '8', name: 'Seafood 🦞' },
    { id: '9', name: 'Vegan / Vegetarian 🌱' },
    { id: '10', name: 'Desserts / Sweets 🍩' },
    { id: '11', name: 'Beverages ☕️' },
    { id: '12', name: 'Bread & Pastries' },
];

const SEARCH_RESULTS: Restaurant[] = [
  { id: '1', name: 'Taco Bell - Los Angeles', subtext: '123 Taco St, Los Angeles, CA 90001' },
  { id: '2', name: 'Sushi One - Los Angeles', subtext: '456 Sushi Ave, Los Angeles, CA 90002' },
  { id: '3', name: 'Burger Palace - Los Angeles', subtext: '789 Burger Blvd, Los Angeles, CA 90003' },
  { id: '4', name: 'Tous les Jours - La Habra', subtext: '1130 S Beach Blvd, La Habra, CA 90631' },
];

// --- Preview Screen Component ---
interface DealPreviewScreenProps {
    visible: boolean;
    onClose: () => void;
    onPost: () => void;
    dealTitle: string;
    dealDetails: string;
    imageUri: string | null;
    expirationDate: string | null;
    selectedRestaurant: Restaurant | null;
    selectedCategories: string[];
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
    selectedCategories,
}) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString || dateString === 'Unknown') return 'Not Known';
        const date = new Date(dateString);
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const categoryText = selectedCategories.join(' & ');

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={previewStyles.container}>
                <StatusBar style="dark" />
                <View style={previewStyles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="#404040" />
                    </TouchableOpacity>
                    <TouchableOpacity style={previewStyles.postButton} onPress={onPost}>
                        <Text style={previewStyles.postButtonText}>POST</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={previewStyles.scrollContainer}>
                    <View style={previewStyles.card}>
                        <View style={previewStyles.restaurantHeader}>
                            <View style={previewStyles.restaurantInfo}>
                                <Text style={previewStyles.restaurantName}>{selectedRestaurant?.name}</Text>
                                <Text style={previewStyles.restaurantSubtext}>{categoryText}</Text>
                                <Text style={previewStyles.restaurantSubtext}>{selectedRestaurant?.subtext}</Text>
                                <Text style={previewStyles.restaurantSubtext}>Expires - {formatDate(expirationDate)}</Text>
                            </View>
                            <Ionicons name="navigate-circle-outline" size={24} color="black" />
                        </View>

                        {imageUri && <Image source={{ uri: imageUri }} style={previewStyles.dealImage} />}
                        <Text style={previewStyles.dealTitle}>{dealTitle}</Text>
                        {dealDetails ? <Text style={previewStyles.dealDetails}>{dealDetails}</Text> : null}

                        <View style={previewStyles.sharedByContainer}>
                            <Image source={require('../../../img/Default_pfp.svg.png')} style={previewStyles.pfp} />
                            <View>
                                <Text style={previewStyles.sharedByText}><Text style={{ fontWeight: 'bold' }}>Shared By:</Text> The Hungry Monster</Text>
                                <Text style={previewStyles.sharedByText}>Fullerton, California</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// --- Main Creation Screen Component ---
export default function DealCreationScreen() {
  const [dealTitle, setDealTitle] = useState('');
  const [dealDetails, setDealDetails] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] = useState(false);
  const [isFoodTagsModalVisible, setIsFoodTagsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const detailsInputRef = useRef(null);
  const titleInputRef = useRef(null);

  const handleAddPhoto = () => setIsCameraModalVisible(true);
  const handleCloseCameraModal = () => setIsCameraModalVisible(false);

  const handleTakePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
    handleCloseCameraModal();
  };

  const handleChooseFromAlbum = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
    handleCloseCameraModal();
  };

  const handleConfirmDate = (date: string | null) => {
    setExpirationDate(date);
    setIsCalendarModalVisible(false);
  };

  const handleDoneCategories = (categories: string[]) => {
    setSelectedCategories(categories);
    setIsCategoriesModalVisible(false);
  };

  const handleDoneFoodTags = (tags: string[]) => {
    setSelectedFoodTags(tags);
    setIsFoodTagsModalVisible(false);
  };

  const handleDoneSearch = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      const restaurant = SEARCH_RESULTS.find(r => r.id === selectedIds[0]);
      if (restaurant) setSelectedRestaurant(restaurant);
    }
    setIsSearchModalVisible(false);
  };

  const handleClearRestaurant = () => setSelectedRestaurant(null);
  const handleSearchPress = () => setIsSearchModalVisible(true);

  const handlePreview = () => {
    if (!selectedRestaurant || !dealTitle) {
      Alert.alert("Missing Information", "Please select a restaurant and add a deal title to continue.");
      return;
    }
    setIsPreviewVisible(true);
  };

  const handlePost = () => {
    console.log("Posting Deal...");
    // Future: Add logic to submit data to your backend
    setIsPreviewVisible(false);
    // Optional: Navigate away or clear the form upon successful post
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerBottomFrame}>
          <Text style={styles.appName}>ImHungri</Text>
          <View style={styles.locationFrame}>
            <Ionicons name="location-sharp" size={26} color="#1D1B20" />
            <View>
              <Text style={styles.locationCity}>Los Angeles</Text>
              <Text style={styles.locationState}>CALIFORNIA</Text>
            </View>
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          style={styles.mainFrame}
          contentContainerStyle={styles.mainFrameContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.reviewButtonRow}>
            <TouchableOpacity style={styles.reviewButton} onPress={handlePreview}>
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
              style={styles.dealTitleText}
              value={dealTitle}
              onChangeText={setDealTitle}
              placeholder='Deal Title - "$10 Sushi before 5pm on M-W"'
              placeholderTextColor="#888889"
              multiline
              maxLength={100}
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
                {expirationDate && <Text style={styles.optionSubText}>{formatDate(expirationDate)}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.optionRow} onPress={() => setIsCategoriesModalVisible(true)}>
              <Ionicons name="grid-outline" size={24} color="#606060" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Deal Categories</Text>
                {selectedCategories.length > 0 && <Text style={styles.optionSubText} numberOfLines={1}>{selectedCategories.map(id => DEAL_CATEGORIES.find(c => c.id === id)?.name).join(', ')}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.optionRow} onPress={() => setIsFoodTagsModalVisible(true)}>
              <Ionicons name="pricetag-outline" size={24} color="#606060" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Food Tags</Text>
                {selectedFoodTags.length > 0 && <Text style={styles.optionSubText} numberOfLines={1}>{selectedFoodTags.map(id => FOOD_TAGS.find(t => t.id === id)?.name).join(', ')}</Text>}
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
              style={styles.extraDetailsInput}
              value={dealDetails}
              onChangeText={setDealDetails}
              placeholder="• Is it valid for takeout, delivery, or dine-in?&#10;• Does it apply to a specific menu section?&#10;• Are there any limitations or exclusions?"
              placeholderTextColor="#888889"
              multiline
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      <PhotoActionModal visible={isCameraModalVisible} onClose={handleCloseCameraModal} onTakePhoto={handleTakePhoto} onChooseFromAlbum={handleChooseFromAlbum} />
      <CalendarModal visible={isCalendarModalVisible} onClose={() => setIsCalendarModalVisible(false)} onConfirm={handleConfirmDate} initialDate={expirationDate} />
      <ListSelectionModal visible={isCategoriesModalVisible} onClose={() => setIsCategoriesModalVisible(false)} onDone={handleDoneCategories} initialSelected={selectedCategories} data={DEAL_CATEGORIES} title="Add Deal Category" />
      <ListSelectionModal visible={isFoodTagsModalVisible} onClose={() => setIsFoodTagsModalVisible(false)} onDone={handleDoneFoodTags} initialSelected={selectedFoodTags} data={FOOD_TAGS} title="Food Tags" />
      <ListSelectionModal visible={isSearchModalVisible} onClose={() => setIsSearchModalVisible(false)} onDone={handleDoneSearch} data={SEARCH_RESULTS} title="Search Restaurant" />

      <DealPreviewScreen
        visible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
        onPost={handlePost}
        dealTitle={dealTitle}
        dealDetails={dealDetails}
        imageUri={imageUri}
        expirationDate={expirationDate}
        selectedRestaurant={selectedRestaurant}
        selectedCategories={selectedCategories.map(id => DEAL_CATEGORIES.find(cat => cat.id === id)?.name).filter((name): name is string => !!name)}
      />

      <BottomNavigation 
        photoUrl={require('../../../img/Default_pfp.svg.png')}
        activeTab="contribute"
        onTabPress={(tab) => console.log('Tab pressed:', tab)}
      />
    </View>
  );
}

// --- Styles for DealCreationScreen ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: 110,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  headerBottomFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  appName: {
    fontFamily: 'Mitr',
    fontWeight: '700',
    fontSize: 24,
    color: '#FFA05C',
  },
  locationFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCity: {
    fontFamily: 'Mitr',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 20,
    color: '#000000',
  },
  locationState: {
    fontFamily: 'Mitr',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    letterSpacing: 0.5,
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
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  dealTitleText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000000',
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

// --- Styles for DealPreviewScreen ---
const previewStyles = StyleSheet.create({
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
  },
  postButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContainer: {
    alignItems: 'center',
    padding: 12,
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
    gap: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 4,
  },
  restaurantSubtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#555555',
    lineHeight: 18,
  },
  dealImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
  },
  dealTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
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
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#EAEAEA',
    marginTop: 8,
  },
  pfp: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sharedByText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.02,
    color: '#000000',
  },
});