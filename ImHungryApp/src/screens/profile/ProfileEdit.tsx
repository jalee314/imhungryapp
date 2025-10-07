import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  ScrollView, TextInput as RNTextInput, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { ProfileCacheService } from '../../services/profileCacheService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataCache } from '../../context/DataCacheContext';

interface ProfileEditProps {
  route?: {
    params?: {
      profile?: any;
      updatedCuisines?: string[];
    };
  };
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ route }) => {
  const navigation = useNavigation();
  const profile = route?.params?.profile;
  
  const [formData, setFormData] = useState({
    fullName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    username: profile?.display_name || '',
    email: profile?.email || '',
    city: profile?.location_city || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [userCuisines, setUserCuisines] = useState<string[]>([]);
  const [savedCuisines, setSavedCuisines] = useState<string[]>([]);
  const [errors, setErrors] = useState({ username: '', email: '' });

  // Fetch cuisines when screen first loads
  useEffect(() => {
    fetchUserCuisines();
  }, []);

  const fetchUserCuisines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_cuisine_preference')
        .select(`
          cuisine_id,
          cuisine:cuisine_id (
            cuisine_name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const cuisineNames = data
        ?.map((item: any) => item.cuisine?.cuisine_name)
        .filter(Boolean) || [];
      
      setUserCuisines(cuisineNames);
      setSavedCuisines(cuisineNames);
    } catch (error) {
      console.error('Error fetching cuisines:', error);
    }
  };

  const saveCuisines = async (userId: string, cuisines: string[]) => {
    try {
      // Delete existing preferences
      const { error: deleteError } = await supabase
        .from('user_cuisine_preference')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new preferences
      if (cuisines.length > 0) {
        const { data: cuisineData, error: cuisineError } = await supabase
          .from('cuisine')
          .select('cuisine_id, cuisine_name')
          .in('cuisine_name', cuisines);

        if (cuisineError) throw cuisineError;

        const preferences = cuisineData.map(cuisine => ({
          user_id: userId,
          cuisine_id: cuisine.cuisine_id
        }));

        const { error: insertError } = await supabase
          .from('user_cuisine_preference')
          .insert(preferences);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving cuisines:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.username || !formData.email || !formData.city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (formData.username.length < 3 || formData.username.length > 15) {
      Alert.alert('Error', 'Username must be 3-15 characters long');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Save profile data
      const { error: authError } = await supabase.auth.updateUser({
        email: formData.email,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: formData.fullName,
          username: formData.username,
          location_city: formData.city
        }
      });

      if (authError) {
        if (authError.message.includes('email') || authError.message.includes('unique constraint')) {
          Alert.alert('Error', 'Email is already taken');
          return;
        }
        throw authError;
      }

      const { error: userError } = await supabase
        .from('user')
        .update({
          first_name: firstName,
          last_name: lastName,
          display_name: formData.username,
          email: formData.email,
          location_city: formData.city
        })
        .eq('user_id', user.id);

      if (userError) {
        if (userError.message.includes('username') || userError.message.includes('unique constraint')) {
          Alert.alert('Error', 'Username is already taken');
          return;
        }
        if (userError.message.includes('email') || userError.message.includes('unique constraint')) {
          Alert.alert('Error', 'Email is already taken');
          return;
        }
        throw userError;
      }

      // Save cuisines if they changed
      const cuisinesChanged = JSON.stringify(userCuisines.sort()) !== JSON.stringify(savedCuisines.sort());
      if (cuisinesChanged) {
        await saveCuisines(user.id, userCuisines);
      }
      
      await ProfileCacheService.clearCache();
      
      // Navigate back to ProfilePage
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCuisinePress = () => {
    navigation.navigate('CuisineEdit' as never, { 
      selectedCuisines: userCuisines,
      profile: profile,
      onUpdate: (updatedCuisines: string[]) => {
        setUserCuisines(updatedCuisines);
      }
    } as never);
  };

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
                  onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
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
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
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
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
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
                    onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                    placeholder="Fullerton, CA"
                    placeholderTextColor="#757575"
                  />
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#C7C7CC" />
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
                  <Text style={styles.fieldLabel}>Favorite Cuisines</Text>
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