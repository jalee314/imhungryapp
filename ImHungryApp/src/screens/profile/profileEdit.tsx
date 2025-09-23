import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  KeyboardAvoidingView, Platform, Alert, ScrollView, useWindowDimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { ProfileCacheService } from '../../services/profileCacheService';
import { useFocusEffect } from '@react-navigation/native';

interface ProfileEditProps {
  route?: {
    params?: {
      profile?: any;
    };
  };
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ route }) => {
  const navigation = useNavigation();
  const profile = route?.params?.profile;
  const { height } = useWindowDimensions();
  
  // Add this debugging line
  console.log('Profile data received:', JSON.stringify(profile, null, 2));
  
  const [formData, setFormData] = useState({
    fullName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    username: profile?.display_name || '',
    email: profile?.email || '',
    city: profile?.location_city || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', email: '' });
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Dynamic spacing calculations
  const GAP = Math.max(8, Math.min(16, Math.round(height * 0.012)));  // between inputs

  const commonCities = [
    'Anaheim, CA', 'Santa Ana, CA', 'Irvine, CA', 'Huntington Beach, CA',
    'Garden Grove, CA', 'Orange, CA', 'Fullerton, CA', 'Costa Mesa, CA',
    'Mission Viejo, CA', 'Westminster, CA', 'Newport Beach, CA', 'Buena Park, CA',
    'Lake Forest, CA', 'Tustin, CA', 'Yorba Linda, CA', 'Cypress, CA',
    'Stanton, CA', 'La Habra, CA', 'Placentia, CA', 'Brea, CA',
    'Laguna Niguel, CA', 'Fountain Valley, CA', 'Aliso Viejo, CA', 'La Palma, CA',
    'Seal Beach, CA', 'Laguna Hills, CA', 'Dana Point, CA', 'San Clemente, CA',
    'Laguna Beach, CA', 'Villa Park, CA', 'Los Alamitos, CA', 'Rancho Santa Margarita, CA'
  ];

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'username') {
      if (value.length > 15) {
        setErrors(prev => ({ ...prev, username: 'Username must be less than 15 characters.' }));
        return;
      }
      if (value.length > 0 && value.length < 3) {
        setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters.' }));
        return;
      }
    }

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.length > 0 && !emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
        return;
      }
    }

    if (field === 'city') {
      if (value.length > 0) {
        const filtered = commonCities.filter(city => 
          city.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
        setCitySuggestions(filtered);
        setShowCitySuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }
  };

  const handleCitySelect = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    setShowCitySuggestions(false);
    setCitySuggestions([]);
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
          setErrors(prev => ({ ...prev, email: 'Email is already taken' }));
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
          setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
          return;
        }
        if (userError.message.includes('email') || userError.message.includes('unique constraint')) {
          setErrors(prev => ({ ...prev, email: 'Email is already taken' }));
          return;
        }
        throw userError;
      }
      
      // Clear the profile cache so ProfilePage will fetch fresh data
      await ProfileCacheService.clearCache();
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => (navigation as any).goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldConfig = [
    { label: 'Change Name', field: 'fullName' as const, editable: true },
    { label: 'Change UserName', field: 'username' as const, editable: true },
    { label: 'Email', field: 'email' as const, editable: true },
    { label: 'City', field: 'city' as const, editable: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
        
      {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()}>
          <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
          </View>
          
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {fieldConfig.map((config) => (
              <View key={config.field} style={[styles.inputContainer, { marginBottom: GAP * 2 }]}>
                <TextInput
                  label={config.label}
                  mode="outlined"
                  value={formData[config.field]}
                  onChangeText={(text) => handleInputChange(config.field, text)}
                  placeholder=""
                  outlineColor="#FFA05C"
                  activeOutlineColor="#FFA05C"
                  dense
                  style={[styles.textInput, { backgroundColor: '#FFFFFF' }]}
                  theme={{
                    roundness: 12,
                    colors: {
                      background: '#FFFFFF',   // Paper uses this to paint the notch
                    },
                  }}
                />
                {errors[config.field as keyof typeof errors] && (
                  <Text style={styles.errorText}>
                    {errors[config.field as keyof typeof errors]}
                  </Text>
                )}
                
                {/* City suggestions dropdown */}
                {config.field === 'city' && showCitySuggestions && citySuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {citySuggestions.map((city, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleCitySelect(city)}
                      >
                        <Text style={styles.suggestionText}>{city}</Text>
                      </TouchableOpacity>
                    ))}
              </View>
            )}
          </View>
            ))}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'SAVING...' : 'SAVE CHANGES'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSpacer: {
    width: 24,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  inputContainer: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    height: 45,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  saveButton: {
    backgroundColor: '#FFA05C',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ProfileEdit;