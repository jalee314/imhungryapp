import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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

import { submitBlock } from '../../services/blockService';
import { getDealUploaderId } from '../../services/dealService';
import { BRAND, STATIC, GRAY } from '../../ui/alf';

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
      let finalUploaderUserId = uploaderUserId;

      if (!uploaderUserId || uploaderUserId === "00000000-0000-0000-0000-000000000000") {
        const fetchedUserId = await getDealUploaderId(dealId);

        if (!fetchedUserId) {
          Alert.alert('Error', 'Unable to identify the user. Please try again later.');
          return;
        }

        finalUploaderUserId = fetchedUserId;
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

      const result = await submitBlock(finalUploaderUserId, reasonCodeId, reasonText);

      if (result.success) {
        Alert.alert(
          'User Blocked',
          'This user has been blocked. You will no longer see their content.',
          [{ text: 'Done', onPress: () => navigation.goBack() }]
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
      <StatusBar barStyle="dark-content" backgroundColor={STATIC.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Block User</Text>

        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Block</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Block Options */}
        <View style={styles.optionsContainer}>
          {blockOptions.map((option, index) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <React.Fragment key={option}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => toggleOption(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {isSelected ? (
                    <View style={styles.checkmark}>
                      <MaterialCommunityIcons name="check" size={16} color={STATIC.white} />
                    </View>
                  ) : (
                    <View style={styles.checkmarkPlaceholder} />
                  )}
                </TouchableOpacity>
                {index < blockOptions.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Additional Details - Only show when "Other" is selected */}
        {selectedOptions.includes('Other') && (
          <View style={styles.detailsContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Please provide details about why you're blocking this user."
              placeholderTextColor={GRAY[475]}
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{additionalDetails.length}/200</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerButtonText: {
    fontSize: 16,
    color: STATIC.black,
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 16,
    color: STATIC.black,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  submitButtonText: {
    fontSize: 16,
    color: BRAND.primary,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
  },
  optionsContainer: {
    backgroundColor: STATIC.white,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: STATIC.white,
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: STATIC.black,
    flex: 1,
    paddingLeft: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: GRAY[350],
    marginHorizontal: 10,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: BRAND.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkPlaceholder: {
    width: 24,
    height: 24,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  textInput: {
    borderWidth: 1,
    borderColor: GRAY[350],
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: STATIC.black,
    minHeight: 128,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  characterCount: {
    fontSize: 12,
    color: GRAY[475],
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'Inter',
  },
});

export default BlockUserScreen;
