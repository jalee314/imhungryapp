import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataCache } from '#/hooks/useDataCache';
import { tokens, atoms as a } from '#/ui';

export default function CuisineEdit() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cuisines: cachedCuisines, loading: cuisinesLoading } = useDataCache();
  const initialCuisines = (route.params as any)?.selectedCuisines || [];
  
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(initialCuisines);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      } else if (prev.length < 3) {
        return [...prev, cuisine];
      } else {
        // Replace the first selected item if 3 already selected
        return [prev[1], prev[2], cuisine];
      }
    });
  };

  const handleBack = () => {
    // Pass the updated cuisines back to the previous screen (ProfileEdit)
    console.log('CuisineEdit: Navigating back with cuisines:', selectedCuisines);
    console.log('CuisineEdit: Profile param:', (route.params as any)?.profile);
    
    navigation.navigate('ProfileEdit' as never, { 
      updatedCuisines: selectedCuisines,
      profile: (route.params as any)?.profile
    } as never);
  };

  const availableCuisines = cachedCuisines.map(c => c.name);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Cuisines</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Choose up to 3 cuisine types you love
        </Text>

        <View style={styles.cuisineGrid}>
          {cuisinesLoading ? (
            // Skeleton loading state
            Array.from({ length: 16 }).map((_, index) => (
              <View key={index} style={styles.skeletonButton} />
            ))
          ) : (
            availableCuisines.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineButton,
                    isSelected && styles.cuisineButtonSelected
                  ]}
                  onPress={() => toggleCuisine(cuisine)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.cuisineButtonText,
                    isSelected && styles.cuisineButtonTextSelected
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...a.flex_1,
    ...a.bg_white,
  },
  header: {
    ...a.flex_row,
    ...a.items_center,
    ...a.justify_between,
    paddingHorizontal: tokens.space.xl,
    paddingVertical: tokens.space.md,
    ...a.bg_white,
  },
  headerTitle: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_black,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    ...a.flex_1,
    paddingHorizontal: tokens.space._2xl,
    paddingTop: tokens.space.xl,
  },
  subtitle: {
    fontSize: tokens.fontSize.sm,
    ...a.text_gray_600,
    marginBottom: tokens.space._2xl,
    ...a.text_center,
    fontFamily: 'Inter',
  },
  cuisineGrid: {
    ...a.flex_row,
    ...a.flex_wrap,
    ...a.justify_between,
  },
  cuisineButton: {
    width: '48%',
    height: 48,
    ...a.bg_gray_100,
    ...a.rounded_md,
    ...a.items_center,
    ...a.justify_center,
    marginBottom: tokens.space.md,
  },
  cuisineButtonSelected: {
    ...a.bg_primary_600,
    ...a.border_primary_600,
  },
  cuisineButtonText: {
    ...a.text_black,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.medium,
    fontFamily: 'Inter',
  },
  cuisineButtonTextSelected: {
    ...a.text_white,
  },
  skeletonButton: {
    width: '48%',
    height: 48,
    ...a.bg_gray_200,
    ...a.rounded_md,
    marginBottom: tokens.space.md,
  },
});
