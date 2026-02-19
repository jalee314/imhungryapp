import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataCache } from '../../hooks/useDataCache';

import { BRAND, STATIC, GRAY, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../ui/alf';

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

    // Get the navigation state to find the ProfileEdit route key
    const state = navigation.getState();
    const profileEditRoute = state?.routes.find((r: any) => r.name === 'ProfileEdit');

    if (profileEditRoute?.key) {
      // Set params on ProfileEdit screen before going back
      navigation.dispatch({
        ...CommonActions.setParams({
          updatedCuisines: selectedCuisines,
          profile: (route.params as any)?.profile
        }),
        source: profileEditRoute.key,
      });
    }

    // Use goBack for proper back animation (slides from left)
    navigation.goBack();
  };

  const availableCuisines = cachedCuisines.map(c => c.name);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={STATIC.black} />
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
    flex: 1,
    backgroundColor: STATIC.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: STATIC.white,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: STATIC.black,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: GRAY[600],
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cuisineButton: {
    width: '48%',
    height: 48,
    backgroundColor: GRAY[100],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cuisineButtonSelected: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  cuisineButtonText: {
    color: STATIC.black,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  cuisineButtonTextSelected: {
    color: STATIC.white,
  },
  skeletonButton: {
    width: '48%',
    height: 48,
    backgroundColor: GRAY[300],
    borderRadius: 12,
    marginBottom: 12,
  },
});
