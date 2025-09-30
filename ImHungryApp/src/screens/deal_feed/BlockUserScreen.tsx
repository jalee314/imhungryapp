import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { submitBlock } from '../../services/blockService';

type BlockUserRouteProp = RouteProp<{ BlockUser: { dealId: string; uploaderUserId: string } }, 'BlockUser'>;

const BlockUserScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BlockUserRouteProp>();
  const { dealId, uploaderUserId } = route.params;
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');

  const blockOptions = [
    'Inappropriate / offensive behavior',
    'Spam or harassment',
    'Offensive content',
    'Other'
  ];

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      Alert.alert('Please select a reason', 'You must select at least one reason for blocking this user.');
      return;
    }

    try {
      // Check if uploaderUserId is valid (not the fallback UUID)
      if (!uploaderUserId || uploaderUserId === "00000000-0000-0000-0000-000000000000") {
        Alert.alert('Error', 'Unable to identify the user. Please try again later.');
        return;
      }

      // Map selected reason to reason code ID (using actual UUIDs from database)
      const reasonCodeMap: { [key: string]: string } = {
        'Inappropriate / offensive behavior': 'f7095d6b-3efd-462f-be0f-239bfd636886', // Code 6
        'Spam or harassment': 'e6e34593-de9a-4464-8bc0-f32d127ca5dc', // Code 7
        'Offensive content': 'd0d49ef3-14ec-4c7f-bada-39bd63499756', // Code 8
        'Other': '2deae166-7539-46d7-a279-ae235b419791' // Code 5
      };

      const selectedReason = selectedOptions[0];
      const reasonCodeId = reasonCodeMap[selectedReason] || '2deae166-7539-46d7-a279-ae235b419791'; // Default to "Other" UUID
      const reasonText = selectedOptions.includes('Other') ? additionalDetails : undefined;

      const result = await submitBlock(uploaderUserId, reasonCodeId, reasonText);

      if (result.success) {
        Alert.alert(
          'User Blocked',
          'This user has been blocked. You will no longer see their content.',
          [{ text: 'OK', onPress: () => navigation.navigate('Feed' as never) }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to block user. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Block User</Text>
        
        <TouchableOpacity onPress={handleSubmit} style={styles.headerButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Block Options */}
        <View style={styles.optionsContainer}>
          {blockOptions.map((option, index) => (
            <View key={option}>
              <TouchableOpacity 
                style={styles.optionRow}
                onPress={() => toggleOption(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
                <View style={styles.checkbox}>
                  {selectedOptions.includes(option) && (
                    <MaterialCommunityIcons name="check" size={16} color="#000000" />
                  )}
                </View>
              </TouchableOpacity>
              {index < blockOptions.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Additional Details - Only show when "Other" is selected */}
        {selectedOptions.includes('Other') && (
          <View style={styles.detailsContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Please provide details about why you're blocking this user."
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    paddingVertical: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 0,
    height: 19,
  },
  headerButton: {
    padding: 0,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
    lineHeight: 16,
  },
  headerTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
    lineHeight: 16,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FF8C4C',
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  optionsContainer: {
    marginTop: 0,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 0,
  },
  detailsContainer: {
    flex: 1,
    marginTop: 4,
    marginBottom: 32,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    color: '#000000',
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});

export default BlockUserScreen;
