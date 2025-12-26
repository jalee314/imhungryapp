import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

export interface CuisineFilterProps {
  filters: string[];
  selectedFilter?: string;
  selectedFilters?: string[]; // For multi-select support
  multiSelect?: boolean;
  onFilterSelect: (filter: string) => void;
  onFiltersSelect?: (filters: string[]) => void; // For multi-select
  style?: any;
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
      onFilterSelect(newFilters[0] || 'All'); // Fallback for single select compatibility
    } else {
      onFilterSelect(filter);
    }
  };

  const renderFilter = ({ item }: { item: string }) => {
    const selected = isSelected(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.filterCell,
          selected && styles.selectedFilterCell
        ]}
        onPress={() => handleFilterPress(item)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.filterCellText,
          selected && styles.selectedFilterCellText
        ]}>
          {item}
        </Text>
        {multiSelect && selected && item !== 'All' && (
          <Text style={styles.selectedIndicator}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={allFilters}
        renderItem={renderFilter}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 4,
  },
  filterList: {
    paddingLeft: 18.5,
  },
  filterCell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  selectedFilterCell: {
    backgroundColor: '#FF8C4C',
    borderColor: '#FF8C4C',
  },
  filterCellText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  selectedFilterCellText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    marginLeft: 4,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
export default CuisineFilter;
