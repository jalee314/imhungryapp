import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const MOCK_CATEGORIES = [
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

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selected: string[]) => void;
  initialSelected: string[];
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ visible, onClose, onDone, initialSelected }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelected);

  useEffect(() => {
    setSelectedCategories(initialSelected);
  }, [initialSelected]);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = MOCK_CATEGORIES.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectCategory(item.id)}>
      <Text style={styles.itemText}>{item.name}</Text>
      {selectedCategories.includes(item.id) ? (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      ) : (
        <View style={styles.checkmarkPlaceholder} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Deal Category</Text>
          <TouchableOpacity onPress={() => onDone(selectedCategories)}>
            <Text style={[styles.headerButtonText, styles.doneButton]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <FlatList
          data={filteredCategories}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButtonText: {
    fontSize: 17,
    color: '#000000',
  },
  doneButton: {
    fontWeight: '700',
    color: '#FFA05C',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 250, 0.93)',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
    color: '#000000',
  },
  listContentContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  itemText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#C1C1C1',
    marginHorizontal: 16,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFA05C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkPlaceholder: {
    width: 24,
    height: 24,
  },
});

export default CategoriesModal;