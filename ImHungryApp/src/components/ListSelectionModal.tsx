import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // CHANGED: Back to original

interface ListItem {
  id: string;
  name: string;
  subtext?: string;
}

interface ListSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onDone: (selected: string[]) => void;
  initialSelected?: string[];
  data: ListItem[];
  title: string;
  singleSelect?: boolean;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

const ListSelectionModal: React.FC<ListSelectionModalProps> = ({
  visible,
  onClose,
  onDone,
  initialSelected = [],
  data,
  title,
  singleSelect = false,
  onSearchChange,
  searchQuery,
}) => {
  const [searchText, setSearchText] = useState(searchQuery || '');
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelected);

  const isSearchModal = title === "Search Restaurant";

  useEffect(() => {
    if (visible) {
      setSelectedItems(initialSelected);
    }
  }, [visible, initialSelected.join(',')]);

  useEffect(() => {
    if (visible) {
      setSearchText(searchQuery || '');
    }
  }, [visible, searchQuery]);

  const handleSelectItem = (itemId: string) => {
    if (singleSelect || isSearchModal) {
      setSelectedItems(prev => (prev.includes(itemId) ? [] : [itemId]));
    } else {
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (onSearchChange) {
      onSearchChange(text);
    }
  };

  const filteredData = onSearchChange ? data : data.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) || 
    (item.subtext && item.subtext.toLowerCase().includes(searchText.toLowerCase()))
  );

  const renderItem = ({ item }: { item: ListItem }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectItem(item.id)}>
      <View style={styles.textContainer}>
        {isSearchModal ? (
          <>
            <Text style={styles.itemTextBold}>{item.name}</Text>
            {item.subtext && <Text style={styles.itemSubtext}>{item.subtext}</Text>}
          </>
        ) : (
          <Text style={styles.itemText}>{item.name}</Text>
        )}
      </View>
      {selectedItems.includes(item.id) ? (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" /> {/* CHANGED: Back to original */}
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
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={() => onDone(selectedItems)}>
            <Text style={[styles.headerButtonText, styles.doneButton]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" /> {/* CHANGED: Back to original */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </View>

        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </Modal>
  );
};

// ... styles remain the same
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 10,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  doneButton: {
    fontWeight: '700',
    color: '#FF8C4C',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 250, 0.93)',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 10,
    height: 36,
    marginTop: 24,
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
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  itemTextBold: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },
  itemSubtext: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
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

export default ListSelectionModal;