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
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Inter',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C4C',
    fontFamily: 'Inter',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 0.3,
    marginLeft: 16,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  groupedContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 14,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 52,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    width: 100,
    letterSpacing: -0.31,
    fontFamily: 'Inter',
  },
  fieldInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'right',
    paddingVertical: 4,
    letterSpacing: -0.31,
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: '#D7D7D7',
    marginLeft: 16,
  },
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  cuisineContent: {
    flex: 1,
    gap: 2,
  },
  cuisineText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    letterSpacing: -0.15,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
});

export default ProfileEdit;