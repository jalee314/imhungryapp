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
import { tokens, atoms as a } from '#/ui';
import { Ionicons } from '@expo/vector-icons';

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

// Create a proper separator component
const ItemSeparator = () => <View style={styles.separator} />;

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

  const renderItem = ({ item }: { item: ListItem }) => {
    const isInfoItem = ['prompt', 'loading', 'error', 'empty'].includes(item.id);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleSelectItem(item.id)}
        disabled={isInfoItem}
      >
        {isSearchModal && !isInfoItem && (
          <Ionicons name="location-sharp" size={28} color="#FF8C4C" style={styles.locationIcon} />
        )}
        <View style={styles.textContainer}>
          {isSearchModal ? (
            <>
              <Text style={(isInfoItem && item.id !== 'prompt') ? styles.itemText : styles.itemTextBold}>{item.name}</Text>
              {item.subtext && <Text style={styles.itemSubtext}>{item.subtext}</Text>}
            </>
          ) : (
            <Text style={styles.itemText}>{item.name}</Text>
          )}
        </View>
        {selectedItems.includes(item.id) && !isInfoItem ? (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.checkmarkPlaceholder} />
        )}
      </TouchableOpacity>
    );
  };

  const cleanTitle = title.replace('Select ', '').replace('Search ', '');
  const placeholderText = `Search for ${cleanTitle}`;

  const isSingleInfoItem = filteredData.length === 1 && ['prompt', 'loading', 'error', 'empty'].includes(filteredData[0].id);

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
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholderText}
            placeholderTextColor="#3c3c4399"
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </View>

        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={ItemSeparator}
          ListFooterComponent={isSingleInfoItem ? null : ItemSeparator}
          contentContainerStyle={styles.listContentContainer}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    ...a.flex_1,
    ...a.bg_white,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.py_md,
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  headerButtonText: {
    ...a.text_md,
    ...a.text_black,
  },
  doneButton: {
    ...a.font_bold,
    ...a.text_primary_600,
  },
  headerTitle: {
    ...a.text_md,
    ...a.font_bold,
    ...a.text_black,
  },
  searchContainer: {
    ...a.flex_row,
    ...a.align_center,
    ...a.bg_white,
    ...a.border,
    ...a.mb_sm,
    ...a.border_gray_300,
    borderRadius: 30,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    ...a.flex_1,
    ...a.ml_sm,
    ...a.text_sm,
    ...a.font_normal,
    ...a.text_black,
    fontFamily: 'Inter-Regular',
  },
  listContentContainer: {
    ...a.pb_lg,
  },
  itemContainer: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.px_xl,
    ...a.bg_white,
    paddingVertical: 10,
  },
  locationIcon: {
    marginRight: 5,
  },
  textContainer: {
    ...a.flex_1,
  },
  itemText: {
    ...a.text_xs,
    ...a.text_black,
    fontFamily: 'Inter',
    paddingLeft: 2,
  },
  itemTextBold: {
    ...a.text_xs,
    ...a.text_black,
    ...a.font_bold,
    fontFamily: 'Inter',
    paddingTop: 5,
    paddingLeft: 2,
  },
  itemSubtext: {
    ...a.text_xs,
    ...a.text_black,
    fontFamily: 'Inter',
    paddingLeft: 2,
    paddingBottom: 5,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.color.gray_400,
    marginHorizontal: 10,
  },
  checkmark: {
    ...a.justify_center,
    ...a.align_center,
    ...a.bg_primary_500,
    width: 24,
    height: 24,
    borderRadius: tokens.radius.xs,
  },
  checkmarkPlaceholder: {
    width: 24,
    height: 24,
  },
});

export default ListSelectionModal;