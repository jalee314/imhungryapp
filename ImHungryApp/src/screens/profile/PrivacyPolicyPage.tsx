import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

import ScreenHeader from '../../components/ui/ScreenHeader';
import { STATIC } from '../../ui/alf';

const PrivacyPolicyPage = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const privacyData = [
    { type: 'main_title', text: 'ImHungri Privacy Policy' },
    { type: 'effective_date', text: 'Last Updated: 9/12/2025' },
    { type: 'paragraph', text: 'ImHungri ("we," "our," or "us") values your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have when using our app.' },
    { type: 'heading', text: '1. Information We Collect' },
    { type: 'paragraph', text: 'When you use ImHungri, we may collect the following information:' },
    { type: 'subheading', text: 'a. Account Information' },
    { type: 'list_item', text: 'Name, email, and phone number (used for login, support, and account recovery).' },
    { type: 'list_item', text: 'Authentication provider (e.g., Sign in with Apple, email/password).' },
    { type: 'list_item', text: 'Profile preferences (e.g., dietary or cuisine interests).' },
    { type: 'subheading', text: 'b. Location Data' },
    { type: 'list_item', text: 'Precise GPS coordinates (used to show nearby deals).' },
    { type: 'list_item', text: 'Location is stored in our database while the app is running and is deleted once the session ends.' },
    { type: 'list_item', text: 'Users may deny location access and instead enter their ZIP code manually.' },
    { type: 'subheading', text: 'c. App Usage' },
    { type: 'list_item', text: 'Saved deals (when you bookmark a deal).' },
    { type: 'list_item', text: 'Viewed deals and interactions (e.g., tapping "get directions").' },
    { type: 'list_item', text: 'Engagement logs (kept while the account is active).' },
    { type: 'subheading', text: 'd. User-Generated Content' },
    { type: 'list_item', text: 'If you post a deal, we collect the deal title, description, images, merchant details, and timestamps.' },
    { type: 'list_item', text: 'Reports and flags submitted by other users are stored for moderation purposes.' },
    { type: 'subheading', text: 'e. Merchant & Deal Data' },
    { type: 'list_item', text: 'Business names, addresses, locations, categories, and promotions provided by merchants or sourced by us.' },
    { type: 'subheading', text: 'f. Device & Analytics Data' },
    { type: 'list_item', text: 'App version, operating system version, and crash/error logs.' },
    { type: 'list_item', text: 'Non-identifiable analytics events (e.g., deal viewed, app session length).' },
    { type: 'subheading', text: 'g. Support & Reports' },
    { type: 'list_item', text: 'If you contact support or report a deal, we may collect your message, reason, and related metadata.' },
    { type: 'heading', text: '2. How We Use Your Information' },
    { type: 'paragraph', text: 'We use the information we collect to:' },
    { type: 'list_item', text: 'Provide and improve the ImHungri service.' },
    { type: 'list_item', text: 'Personalize your experience (e.g., showing relevant deals nearby).' },
    { type: 'list_item', text: 'Track engagement with deals (e.g., saves, views, directions).' },
    { type: 'list_item', text: 'Moderate user-generated content and respond to reports.' },
    { type: 'list_item', text: 'Communicate with you about your account, updates, or support requests.' },
    { type: 'list_item', text: 'Comply with legal obligations.' },
    { type: 'heading', text: '3. User-Generated Content & Moderation' },
    { type: 'paragraph', text: 'To keep ImHungri safe and useful, all user-submitted deals are subject to moderation. We provide:' },
    { type: 'list_item', text: 'Filtering: Tools to prevent objectionable content.' },
    { type: 'list_item', text: 'Reporting: Users can flag inappropriate or false deals.' },
    { type: 'list_item', text: 'Timely review: Our team will investigate reports promptly.' },
    { type: 'list_item', text: 'Blocking: Users who violate our terms may be suspended or blocked.' },
    { type: 'heading', text: '4. How We Share Your Information' },
    { type: 'paragraph', text: 'We do not sell your personal information. We may share data only in the following situations:' },
    { type: 'list_item', text: 'With service providers who help us operate the app (e.g., cloud hosting, analytics).' },
    { type: 'list_item', text: 'For legal reasons if required by law or to protect rights and safety.' },
    { type: 'list_item', text: 'Aggregate or anonymized data may be shared to improve features, but never in a way that identifies you.' },
    { type: 'heading', text: '5. Your Choices' },
    { type: 'list_item', text: 'Permissions: You may deny optional permissions (e.g., location, notifications).' },
    { type: 'list_item', text: 'Account Deletion: You can delete your account in the app at any time. When deleted, we remove or anonymize your personal data, except where retention is required by law.' },
    { type: 'list_item', text: 'Do Not Sell My Personal Information: ImHungri does not sell your personal data, but California residents may still submit requests under CCPA.' },
    { type: 'heading', text: '6. Data Retention' },
    { type: 'list_item', text: 'Account and profile data are kept until you request deletion.' },
    { type: 'list_item', text: 'Engagement logs and user-submitted deals are kept while your account is active.' },
    { type: 'list_item', text: 'Location data is stored only while the app is running.' },
    { type: 'list_item', text: 'Support and reports are retained only as long as needed to resolve issues.' },
    { type: 'heading', text: '7. Security' },
    { type: 'paragraph', text: 'We implement reasonable security measures to protect your data from unauthorized access, use, or disclosure. No system is 100% secure, but we strive to safeguard your information.' },
    { type: 'heading', text: '8. Children\'s Privacy' },
    { type: 'paragraph', text: 'ImHungri is not directed at children under 13. We do not knowingly collect personal data from children.' },
    { type: 'heading', text: '9. U.S. Residents' },
    { type: 'paragraph', text: 'This app is intended for use in the United States only. If you are located elsewhere, please do not use the app.' },
    { type: 'heading', text: '10. Changes to This Policy' },
    { type: 'paragraph', text: 'We may update this Privacy Policy from time to time. If changes are significant, we will notify you within the app or by email.' },
    { type: 'heading', text: '11. Contact Us' },
    { type: 'paragraph', text: 'If you have questions or concerns about this Privacy Policy, please contact us at:\nImHungri.app@gmail.com' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Privacy & Policy" onBack={handleBack} />

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.textContainer}>
            {privacyData.map((item, index) => {
              let textStyle;
              switch (item.type) {
                case 'main_title':
                  textStyle = styles.mainTitle;
                  break;
                case 'effective_date':
                  textStyle = styles.effectiveDate;
                  break;
                case 'heading':
                  textStyle = styles.heading;
                  break;
                case 'subheading':
                  textStyle = styles.subheading;
                  break;
                case 'list_item':
                  textStyle = styles.listItem;
                  return (
                    <Text key={index} style={textStyle}>
                      • {item.text}
                    </Text>
                  );
                case 'paragraph':
                default:
                  textStyle = styles.paragraph;
                  break;
              }
              return (
                <Text key={index} style={textStyle}>
                  {item.text}
                </Text>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC.white,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 18,
  },
  scrollContainer: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: STATIC.black,
    marginBottom: 12,
  },
  effectiveDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: STATIC.black,
    marginBottom: 12,
  },
  heading: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: STATIC.black,
    marginTop: 16,
    marginBottom: 8,
  },
  subheading: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: STATIC.black,
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: STATIC.black,
    marginBottom: 8,
  },
  listItem: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: STATIC.black,
    marginLeft: 16,
    marginBottom: 4,
  },
});

export default PrivacyPolicyPage;
