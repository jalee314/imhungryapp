/**
 * CuisineFilter - Horizontal Filter Pill List
 * 
 * A scrollable list of filter pills for cuisine selection.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React from 'react';
import { FlatList, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Box, Text } from './atoms';
import { colors, spacing, borderRadius } from '../lib/theme';

export interface CuisineFilterProps {
  filters: string[];
  selectedFilter?: string;
  selectedFilters?: string[];
  multiSelect?: boolean;
  onFilterSelect: (filter: string) => void;
  onFiltersSelect?: (filters: string[]) => void;
  style?: StyleProp<ViewStyle>;
  showAllOption?: boolean;
}

const CuisineFilter: React.FC<CuisineFilterProps> = ({
  filters,
  selectedFilter,
  selectedFilters = [],
  multiSelect = false,
  onFilterSelect,
  onFiltersSelect,
  style,
  showAllOption = true,
}) => {
  const allFilters = showAllOption ? ['All', ...filters] : filters;

  const isSelected = (filter: string): boolean => {
    if (multiSelect) {
      return selectedFilters.includes(filter);
    }
    return selectedFilter === filter;
  };

  const handleFilterPress = (filter: string) => {
    if (multiSelect) {
      let newFilters: string[];
      
      if (filter === 'All') {
        newFilters = ['All'];
      } else {
        const currentFilters = selectedFilters.filter(f => f !== 'All');
        if (currentFilters.includes(filter)) {
          newFilters = currentFilters.filter(f => f !== filter);
          if (newFilters.length === 0) {
            newFilters = ['All'];
          }
        } else {
          newFilters = [...currentFilters, filter];
        }
      }
      
      onFiltersSelect?.(newFilters);
      onFilterSelect(newFilters[0] || 'All');
    } else {
      onFilterSelect(filter);
    }
  };

  const renderFilter = ({ item }: { item: string }) => {
    const selected = isSelected(item);
    
    return (
      <TouchableOpacity
        onPress={() => handleFilterPress(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: selected ? colors.primaryDark : colors.background,
          borderWidth: 1,
          borderColor: selected ? colors.primaryDark : colors.borderLight,
          borderRadius: borderRadius.pill,
          paddingHorizontal: spacing.m,
          paddingVertical: spacing.s,
          marginRight: spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <Text
          size="xs"
          weight="normal"
          color={selected ? 'textInverse' : 'text'}
          align="center"
        >
          {item}
        </Text>
        {multiSelect && selected && item !== 'All' && (
          <Text size={10} color="textInverse" weight="bold">
            ✓
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Box my={4} style={style}>
      <FlatList
        data={allFilters}
        renderItem={renderFilter}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 18.5 }}
      />
    </Box>
  );
};

export default CuisineFilter;
