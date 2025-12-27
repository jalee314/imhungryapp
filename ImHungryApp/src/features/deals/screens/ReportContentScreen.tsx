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
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FF8C4C',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#000000',
    flex: 1,
    paddingLeft: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C1C1C1',
    marginHorizontal: 10,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFA05C',
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
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: '#000000',
    minHeight: 128,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'Inter',
  },
});

export default ReportContentScreen;