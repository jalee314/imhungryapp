/**
 * SearchBar - Reusable search input component
 */

import React from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box, Pressable } from '../../../components/atoms';
import { colors, typography } from '../../../lib/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
}) => {
  return (
    <Box px="xl" py="m">
      <Box
        row
        alignCenter
        rounded="full"
        px="xl"
        height={35}
        gap="xl"
        style={{
          backgroundColor: '#ffffffed',
          borderWidth: 0.5,
          borderColor: '#d7d7d7',
          elevation: value.length > 0 ? 4 : 2,
        }}
      >
        <Ionicons name="search" size={16} color="#666" />
        <TextInput
          style={{
            flex: 1,
            fontSize: 17,
            color: 'rgba(60, 60, 67, 0.6)',
            fontFamily: typography.fontFamily.regular,
            fontWeight: '400',
            letterSpacing: -0.41,
            lineHeight: 22,
            padding: 0,
          }}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="rgba(60, 60, 67, 0.6)"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} p="xs">
            <Ionicons name="close-circle" size={16} color="#666" />
          </Pressable>
        )}
      </Box>
    </Box>
  );
};
