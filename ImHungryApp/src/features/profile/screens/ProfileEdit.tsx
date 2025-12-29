import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  ScrollView, TextInput as RNTextInput, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataCache } from '#/hooks/useDataCache';
import { useProfileEdit } from '../hooks/useProfileEdit';
import { tokens, atoms as a } from '#/ui';

interface ProfileEditProps {
  route?: {
    params?: {
      profile?: any;
      updatedCuisines?: string[];
    };
  };
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ route }) => {
  const navigation = useNavigation<any>();
  const profile = route?.params?.profile;
  
  console.log('ProfileEdit: Component rendered with params:', {
    hasProfile: !!profile,
    updatedCuisines: route?.params?.updatedCuisines,
    city: profile?.location_city
  });
  
  const { formData, setField, loading, userCuisines, handleSave, handleCuisinePress } = useProfileEdit({ route });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
        
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
          
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>
            
            <View style={styles.groupedContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <RNTextInput
                  style={styles.fieldInput}
                  value={formData.fullName}
                  onChangeText={(text) => setField('fullName', text)}
                  placeholder="Joe"
                  placeholderTextColor="#757575"
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Username</Text>
                <RNTextInput
                  style={styles.fieldInput}
                  value={formData.username}
                  onChangeText={(text) => setField('username', text)}
                  placeholder="JoeDeals"
                  placeholderTextColor="#757575"
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <RNTextInput
                  style={styles.fieldInput}
                  value={formData.email}
                  onChangeText={(text) => setField('email', text)}
                  placeholder="johndeals@gmail.com"
                  placeholderTextColor="#757575"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>City</Text>
                <View style={styles.fieldInputContainer}>
                  <RNTextInput
                    style={styles.fieldInput}
                    value={formData.city}
                    onChangeText={(text) => setField('city', text)}
                    placeholder="Fullerton, CA"
                    placeholderTextColor="#757575"
                  />
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#000000" />
                </View>
              </View>
            </View>
          </View>

          {/* Favorite Cuisines Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PREFERENCES</Text>
            
            <TouchableOpacity 
              style={styles.groupedContainer}
              onPress={handleCuisinePress}
            >
              <View style={styles.cuisineRow}>
                <View style={styles.cuisineContent}>
                  <Text style={[styles.fieldLabel, { width: 'auto' }]}>Favorite Cuisines</Text>
                  <Text style={styles.cuisineText}>
                    {userCuisines.length > 0 
                      ? userCuisines.join(', ') 
                      : 'Not set'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  saveText: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    ...a.text_primary_600,
    fontFamily: 'Inter',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    ...a.flex_1,
  },
  content: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.xl,
    paddingBottom: tokens.space._4xl,
  },
  section: {
    marginBottom: tokens.space._3xl,
  },
  sectionHeader: {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_black,
    letterSpacing: 0.3,
    marginLeft: tokens.space.lg,
    marginBottom: tokens.space.md,
    fontFamily: 'Inter',
  },
  groupedContainer: {
    ...a.bg_white,
    borderWidth: 1,
    ...a.border_gray_200,
    ...a.rounded_lg,
    ...a.overflow_hidden,
  },
  fieldRow: {
    ...a.flex_row,
    ...a.items_center,
    paddingHorizontal: tokens.space.lg,
    minHeight: 52,
    paddingVertical: tokens.space.sm,
  },
  fieldLabel: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_black,
    width: 100,
    letterSpacing: -0.31,
    fontFamily: 'Inter',
  },
  fieldInputContainer: {
    ...a.flex_1,
    ...a.flex_row,
    ...a.items_center,
    ...a.justify_end,
  },
  fieldInput: {
    ...a.flex_1,
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_gray_600,
    ...a.text_right,
    paddingVertical: tokens.space.xs,
    letterSpacing: -0.31,
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    ...a.bg_gray_200,
    marginLeft: tokens.space.lg,
  },
  cuisineRow: {
    ...a.flex_row,
    ...a.items_center,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: 15,
  },
  cuisineContent: {
    ...a.flex_1,
    gap: 2,
  },
  cuisineText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.normal,
    ...a.text_gray_600,
    letterSpacing: -0.15,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
});

export default ProfileEdit;