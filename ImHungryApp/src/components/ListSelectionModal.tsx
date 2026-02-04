/**
 * ListSelectionModal - Searchable List Selection Modal
 * 
 * A full-screen modal for selecting items from a searchable list.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable, Divider } from './atoms';
import { colors, spacing, borderRadius } from '../lib/theme';

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

  const cleanTitle = title.replace('Select ', '').replace('Search ', '');
  const placeholderText = `Search for ${cleanTitle}`;

  const isSingleInfoItem = filteredData.length === 1 && 
    ['prompt', 'loading', 'error', 'empty'].includes(filteredData[0].id);

  const renderItem = ({ item }: { item: ListItem }) => {
    const isInfoItem = ['prompt', 'loading', 'error', 'empty'].includes(item.id);
    const isSelected = selectedItems.includes(item.id);

    return (
      <Pressable
        onPress={() => handleSelectItem(item.id)}
        disabled={isInfoItem}
        row
        justifyBetween
        alignCenter
        py="s"
        px="l"
        bg="background"
      >
        {isSearchModal && !isInfoItem && (
          <Ionicons 
            name="location-sharp" 
            size={28} 
            color={colors.primary} 
            style={{ marginRight: spacing.xs }} 
          />
        )}
        <Box flex={1}>
          {isSearchModal ? (
            <>
              <Text 
                size="xs" 
                color="text" 
                weight={isInfoItem && item.id !== 'prompt' ? 'normal' : 'bold'}
                style={{ paddingLeft: 2, paddingTop: isInfoItem ? 0 : 5 }}
              >
                {item.name}
              </Text>
              {item.subtext && (
                <Text 
                  size="xs" 
                  color="text" 
                  style={{ paddingLeft: 2, paddingBottom: 5 }}
                >
                  {item.subtext}
                </Text>
              )}
            </>
          ) : (
            <Text size="xs" color="text" style={{ paddingLeft: 2 }}>
              {item.name}
            </Text>
          )}
        </Box>
        {isSelected && !isInfoItem ? (
          <Box
            width={24}
            height={24}
            rounded="xs"
            bg="primary"
            center
          >
            <Ionicons name="checkmark" size={16} color={colors.textInverse} />
          </Box>
        ) : (
          <Box width={24} height={24} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <Box row justifyBetween alignCenter px="l" py="m" mb="s">
          <Pressable onPress={onClose}>
            <Text size="md" color="text">Cancel</Text>
          </Pressable>
          <Text size="md" weight="bold" color="text">{title}</Text>
          <Pressable onPress={() => onDone(selectedItems)}>
            <Text size="md" weight="bold" color="primaryDark">Done</Text>
          </Pressable>
        </Box>

        {/* Search */}
        <Box
          row
          alignCenter
          bg="background"
          rounded="pill"
          mx="s"
          mb="s"
          px="s"
          height={36}
          border={1}
          borderColor="borderLight"
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: spacing.s,
              fontSize: 14,
              color: colors.text,
            }}
            placeholder={placeholderText}
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </Box>

        {/* List */}
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => (
            <Box mx="s">
              <Divider />
            </Box>
          )}
          ListFooterComponent={isSingleInfoItem ? null : () => (
            <Box mx="s">
              <Divider />
            </Box>
          )}
          contentContainerStyle={{ paddingBottom: spacing.m }}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default ListSelectionModal;
