import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import CalendarModal from '../../components/CalendarModal';
import ListSelectionModal from '../../components/ListSelectionModal';

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
];

export default function DealCreationScreen() {
  const [dealTitle, setDealTitle] = useState('Deal Title - "$10 Sushi before 5pm on M-W"');
  const [dealDetails, setDealDetails] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] = useState(false);
  const [isFoodTagsModalVisible, setIsFoodTagsModalVisible] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);


  const handleAddPhoto = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    if (dateString === 'Unknown') return 'Not Known';
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent date from being off by one
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        {/* Main Header Content */}
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
        {/* Main Content Frame */}
        <ScrollView style={styles.mainFrame} contentContainerStyle={styles.mainFrameContentContainer}>
          {/* Review Button Row */}
          <View style={styles.reviewButtonRow}>
            <TouchableOpacity style={styles.reviewButton}>
              <Text style={styles.reviewButtonText}>PREVIEW</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.magnifyingGlass}>
              <Ionicons name="search" size={20} color="rgba(60, 60, 67, 0.6)" />
            </View>
            <Text style={styles.searchPlaceholder}>Search</Text>
          </View>

          {/* Deal Title Box */}
          <View style={styles.dealTitleBox}>
            <TextInput
              style={styles.dealTitleText}
              value={dealTitle}
              onChangeText={setDealTitle}
              placeholder="Deal Title"
              placeholderTextColor="#888889"
              multiline
            />
          </View>

          {/* Extra Details Container */}
          <View style={styles.extraDetailsContainer}>
            <View style={styles.optionsFrame}>
              {/* Add Photo */}
              <TouchableOpacity style={styles.addPhotoFrame} onPress={handleAddPhoto}>
                <Ionicons name="camera-outline" size={24} color="#404040" style={styles.iconStyle} />
                <Text style={[styles.optionText, {flex: 1}]}>Add Photo</Text>
                <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              {/* Expiration Date */}
              <TouchableOpacity style={styles.expirationFrame} onPress={() => setIsCalendarModalVisible(true)}>
                <Ionicons name="time-outline" size={24} color="#4E4E4E" style={styles.iconStyle} />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Expiration Date</Text>
                  {expirationDate && (
                    <Text style={styles.expirationDateValue}>{formatDate(expirationDate)}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              {/* Deal Categories */}
              <TouchableOpacity style={styles.categoriesFrame} onPress={() => setIsCategoriesModalVisible(true)}>
                <Ionicons name="grid-outline" size={24} color="#606060" style={styles.iconStyle} />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Deal Categories</Text>
                  {selectedCategories.length > 0 && (
                    <Text style={styles.selectedValueText} numberOfLines={1}>
                      {selectedCategories
                        .map(id => DEAL_CATEGORIES.find(cat => cat.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              {/* Food Tags */}
              <TouchableOpacity style={styles.tagBox} onPress={() => setIsFoodTagsModalVisible(true)}>
                <Ionicons name="pricetag-outline" size={24} color="#606060" style={styles.iconStyle} />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Food Tags</Text>
                  {selectedFoodTags.length > 0 && (
                    <Text style={styles.selectedValueText} numberOfLines={1}>
                      {selectedFoodTags
                        .map(id => FOOD_TAGS.find(tag => tag.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              {/* Anonymous */}
              <View style={styles.anonymousRow}>
                <MaterialCommunityIcons name="incognito" size={24} color="#606060" style={styles.iconStyle} />
                <Text style={styles.anonymousText}>Anonymous</Text>
                <Switch
                  trackColor={{ false: "#D2D5DA", true: "#FFA05C" }}
                  thumbColor={"#FFFFFF"}
                  onValueChange={setIsAnonymous}
                  value={isAnonymous}
                />
              </View>
              
              <View style={styles.separator} />
              
              {/* Extra Details */}
              <View style={styles.extraDetailsTitle}>
                <Ionicons name="menu-outline" size={24} color="#606060" style={styles.iconStyle} />
                <Text style={styles.extraDetailsTextLabel}>Extra Details</Text>
              </View>

              {/* Extra Details Text Area */}
              <View style={styles.extraDetailsTextArea}>
                <TextInput
                  style={styles.extraDetailsInput}
                  value={dealDetails}
                  onChangeText={setDealDetails}
                  placeholder="Add any extra details here..."
                  placeholderTextColor="#888889"
                  multiline
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseModal}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalButton} onPress={() => { console.log("Take Photo pressed"); handleCloseModal(); }}>
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <View style={styles.modalSeparator} />
              <TouchableOpacity style={styles.modalButton} onPress={() => { console.log("Choose from Photo Album pressed"); handleCloseModal(); }}>
                <Text style={styles.modalButtonText}>Choose from Photo Album</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.modalContent, styles.cancelButton]} onPress={handleCloseModal}>
              <Text style={[styles.modalButtonText, { fontWeight: 'bold' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Calendar Modal */}
      <CalendarModal
        visible={isCalendarModalVisible}
        onClose={() => setIsCalendarModalVisible(false)}
        onConfirm={handleConfirmDate}
        initialDate={expirationDate}
      />

      {/* Categories Modal */}
      <ListSelectionModal
        visible={isCategoriesModalVisible}
        onClose={() => setIsCategoriesModalVisible(false)}
        onDone={handleDoneCategories}
        initialSelected={selectedCategories}
        data={DEAL_CATEGORIES}
        title="Add Deal Category"
      />

      {/* Food Tags Modal */}
      <ListSelectionModal
        visible={isFoodTagsModalVisible}
        onClose={() => setIsFoodTagsModalVisible(false)}
        onDone={handleDoneFoodTags}
        initialSelected={selectedFoodTags}
        data={FOOD_TAGS}
        title="Food Tags"
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        photoUrl={require('../../../img/Default_pfp.svg.png')}
        activeTab="contribute"
        onTabPress={(tab) => {
          console.log('Tab pressed:', tab);
        }}
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

  // Header Styles
  header: {
    width: '100%',
    height: 110, // Increased height
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DEDEDE',
    justifyContent: 'flex-end', // Align content to the bottom
    paddingBottom: 8, // Padding at the bottom of the header
  },
  headerBackground: {
    // This is now redundant as styles are on the header itself
  },
  headerFrame: {
    // This container is no longer needed
  },
  statusBarFrame: {
    // This is for spacing and can be removed or simplified
    // as SafeAreaView handles status bar space.
  },
  statusBarSpacer: {
    // Redundant
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

  // Main Content
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
  contentFrame: {
    gap: 14,
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 369,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    gap: 8,
  },
  magnifyingGlass: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    color: 'rgba(60, 60, 67, 0.6)',
  },

  // Deal Title Box
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
    color: '#888889',
    flex: 1,
  },

  // Extra Details Container
  extraDetailsContainer: {
    width: 369,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
  },
  optionsFrame: {
    gap: 8,
  },

  // Option Items
  addPhotoFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 30,
    gap: 16,
  },
  expirationFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 30, // Adjusted for two lines
    gap: 16,
    paddingVertical: 5,
  },
  categoriesFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 30, // Adjusted for two lines
    gap: 16,
  },
  tagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 30, // Adjusted for two lines
    gap: 16,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 30,
    gap: 16,
  },
  extraDetailsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 30,
    gap: 16,
  },

  // Icons
  iconStyle: {
    width: 24,
  },

  // Option Text
  optionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  expirationDateValue: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#888889',
    marginTop: 2,
  },
  selectedValueText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#888889',
    marginTop: 2,
  },
  foodTagsText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  anonymousText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  extraDetailsTextLabel: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },

  // Redundant Icon Styles (can be removed)
  addPhotoIcon: {},
  expirationIcon: {},
  categoriesIcon: {},
  tagIcon: {},
  anonymousIcon: {},
  detailsIcon: {},
  arrowIcon: {},

  // Redundant Toggle Switch Styles (can be removed)
  toggleSwitchContainer: {},
  toggleSwitch: {},
  toggleSwitchActive: {},
  switchThumb: {},
  switchThumbActive: {},

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C1C1C1',
    marginHorizontal: 16,
  },

  // Extra Details Text Area
  extraDetailsTextArea: {
    paddingHorizontal: 15,
    paddingBottom: 8,
    width: '100%',
    minHeight: 128,
  },
  extraDetailsInput: {
    flex: 1,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000000',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    marginHorizontal: 8,
    marginBottom: 30, // Adjust to position above bottom navigation if needed
  },
  modalContent: {
    backgroundColor: 'rgba(249, 249, 249, 0.94)',
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  modalSeparator: {
    height: 0.5,
    backgroundColor: '#C1C1C1',
    width: '100%',
  },
  cancelButton: {
    marginTop: 8,
  },
  // Calendar Modal Styles are now in CalendarModal.tsx
});