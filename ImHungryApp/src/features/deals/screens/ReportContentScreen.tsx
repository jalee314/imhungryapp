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
import { reportService } from '#/services/reportService';
import { getFullUserProfile } from '#/services/userService';
import { getDealUploaderId } from '#/services/dealService';
import { tokens, atoms as a } from '#/ui';

type ReportContentRouteProp = RouteProp<{ ReportContent: { dealId: string; uploaderUserId: string } }, 'ReportContent'>;

const ReportContentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ReportContentRouteProp>();
  const { dealId, uploaderUserId } = route.params;
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');


  const reportOptions = [
    'I\'ve seen this deal already / it\'s a repeat',
    'Inappropriate / offensive content',
    'This deal is no longer valid / has expired',
    'Wrong Price',
    'Wrong Deal',
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
      Alert.alert('Please select a reason', 'You must select at least one reason for reporting this content.');
      return;
    }

    try {
      // Get current user profile
      const currentUser = await getFullUserProfile();
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to submit a report.');
        return;
      }

      // Check if uploaderUserId is valid (not the fallback UUID)
      let finalUploaderUserId = uploaderUserId;
      
      if (!uploaderUserId || uploaderUserId === "00000000-0000-0000-0000-000000000000") {
        const fetchedUserId = await getDealUploaderId(dealId);
        
        if (!fetchedUserId) {
          Alert.alert('Error', 'Unable to identify the content uploader. Please try again later.');
          return;
        }
        
        finalUploaderUserId = fetchedUserId;
      }

      // Check if user is trying to report their own post
      if (currentUser.user_id === finalUploaderUserId) {
        Alert.alert(
          'Cannot Report Own Post',
          'You cannot report your own post. If you want to remove it, please delete it from your profile instead.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Map selected options to reason code UUIDs from your Supabase database
      const reasonCodeMap: { [key: string]: string } = {
        'I\'ve seen this deal already / it\'s a repeat': '80c755ea-1e1b-4f11-8ed5-1ca3b6779b5b', 
        'Inappropriate / offensive content': 'f4ad8941-54e7-4b86-8750-313360cefbda', 
        'This deal is no longer valid / has expired': 'b6fc9047-30f2-44f9-8787-69e415041581',
        'Wrong Price': 'bee4479d-4368-4fe8-9e31-7e7e4af8698e',
        'Wrong Deal': 'b8654ee1-9a0e-471f-b205-b05b0c5cc113',
        'Other': '2deae166-7539-46d7-a279-ae235b419791' 
      };

      // Get the first selected reason (you might want to handle multiple selections differently)
      const selectedReason = selectedOptions[0];
      const reasonCodeId = reasonCodeMap[selectedReason] || '2deae166-7539-46d7-a279-ae235b419791'; // Default to "Other"

      // Submit the report to Supabase
      const reportData = {
        dealId,
        reporterUserId: currentUser.user_id,
        uploaderUserId: finalUploaderUserId,
        reasonCodeId: reasonCodeId,
        reasonText: selectedOptions.includes('Other') ? additionalDetails : undefined,
      };

      const result = await reportService.submitReport(reportData);

      if (result.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. We will review it and take appropriate action.',
          [{ text: 'OK', onPress: () => {
            // Navigate back to the main feed, not the deal detail screen
            // Since the reported deal should no longer be visible
            navigation.goBack();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
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
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Report Content</Text>
        
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Options */}
        <View style={styles.optionsContainer}>
          {reportOptions.map((option, index) => {
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
                      <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.checkmarkPlaceholder} />
                  )}
                </TouchableOpacity>
                {index < reportOptions.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Additional Details - Only show when "Other" is selected */}
        {selectedOptions.includes('Other') && (
          <View style={styles.detailsContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Please provide details about why you're reporting this deal."
              placeholderTextColor="#999999"
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
    ...a.flex_1,
    ...a.bg_white,
  },
  header: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.items_center,
    paddingHorizontal: 22,
    paddingVertical: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  headerButtonText: {
    fontSize: tokens.fontSize.md,
    ...a.text_black,
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: tokens.fontSize.md,
    ...a.text_black,
    fontWeight: tokens.fontWeight.bold,
    fontFamily: 'Inter',
  },
  submitButtonText: {
    fontSize: tokens.fontSize.md,
    ...a.text_primary_600,
    fontWeight: tokens.fontWeight.bold,
    fontFamily: 'Inter',
  },
  content: {
    ...a.flex_1,
  },
  optionsContainer: {
    ...a.bg_white,
  },
  optionRow: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.items_center,
    paddingVertical: tokens.space._2xl,
    paddingHorizontal: tokens.space.xl,
    ...a.bg_white,
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: tokens.fontSize.sm,
    ...a.text_black,
    ...a.flex_1,
    paddingLeft: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C1C1C1',
    marginHorizontal: tokens.space.sm,
  },
  checkmark: {
    width: 24,
    height: 24,
    ...a.rounded_xs,
    ...a.bg_primary_500,
    ...a.justify_center,
    ...a.items_center,
  },
  checkmarkPlaceholder: {
    width: 24,
    height: 24,
  },
  detailsContainer: {
    paddingHorizontal: tokens.space.xl,
    paddingTop: tokens.space.lg,
    paddingBottom: tokens.space._3xl,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    ...a.rounded_sm,
    padding: tokens.space.md,
    fontSize: tokens.fontSize.xs,
    ...a.text_black,
    minHeight: 128,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  characterCount: {
    fontSize: tokens.fontSize.xs,
    ...a.text_gray_400,
    ...a.text_right,
    marginTop: tokens.space.sm,
    fontFamily: 'Inter',
  },
});

export default ReportContentScreen;