import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../../components/ui/ScreenHeader';

import { STATIC } from '../../ui/alf';

const TermsConditionsPage = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const termsData = [
    { type: 'main_title', text: 'ImHungri – Terms of Service' },
    { type: 'effective_date', text: 'Effective Date: October 9, 2025' },
    { type: 'paragraph', text: 'Welcome to ImHungri. By using our app, you agree to these Terms of Service ("Terms"). Please read them carefully. If you do not agree, you may not use the app.' },
    { type: 'heading', text: '1. About ImHungri' },
    { type: 'paragraph', text: 'ImHungri is a community-powered platform for discovering and sharing food deals from restaurants, cafes, and food vendors. Users may browse, save, and post deals.' },
    { type: 'heading', text: '2. Eligibility' },
    { type: 'list_item', text: 'You must be at least 13 years old to use ImHungri.' },
    { type: 'list_item', text: 'By creating an account, you confirm that the information you provide is accurate and that you will comply with these Terms.' },
    { type: 'heading', text: '3. User Accounts' },
    { type: 'list_item', text: 'You are responsible for maintaining the security of your account.' },
    { type: 'list_item', text: 'You may log in using Apple ID, Google, phone number, or other supported methods.' },
    { type: 'list_item', text: 'You are responsible for all activity under your account.' },
    { type: 'heading', text: '4. User-Generated Content' },
    { type: 'paragraph', text: 'When posting deals or other content, you agree to follow our Community Guidelines.' },
    { type: 'subheading', text: 'Allowed Content' },
    { type: 'list_item', text: 'Real and verifiable food deals from restaurants, cafes, bakeries, or food vendors.' },
    { type: 'list_item', text: 'Accurate details including restaurant name, location, expiration date, and type of deal.' },
    { type: 'list_item', text: 'Respectful, safe, and food-related content only.' },
    { type: 'subheading', text: 'Prohibited Content' },
    { type: 'list_item', text: 'Fake, misleading, or expired deals.' },
    { type: 'list_item', text: 'Spam, irrelevant ads, or self-promotion unrelated to food deals.' },
    { type: 'list_item', text: 'Pornography, sexual content, violence, hate speech, harassment, or offensive material.' },
    { type: 'list_item', text: 'Content that could harm users, including scams, unsafe claims, or phishing links.' },
    { type: 'paragraph', text: 'We may remove any content that violates these Terms. Repeated violations may result in suspension or permanent removal of your account.' },
    { type: 'heading', text: '5. Reporting and Moderation' },
    { type: 'list_item', text: 'Users can report deals or block other users at any time.' },
    { type: 'paragraph', text: 'Reported content is reviewed by our team and may be removed. ImHungri reserves the right to remove or restrict content or accounts that violate these Terms.' },
    { type: 'heading', text: '6. Privacy and Data' },
    { type: 'paragraph', text: 'Our Privacy Policy explains how we collect, use, and protect your information. By using ImHungri, you also agree to our Privacy Policy.' },
    { type: 'heading', text: '7. Account Deletion' },
    { type: 'paragraph', text: 'You may delete your account at any time through Profile → Settings → Account → Delete Account. Deletion is permanent and will remove your profile and saved data.' },
    { type: 'heading', text: '8. Disclaimer of Warranties' },
    { type: 'paragraph', text: 'ImHungri is provided "as is" without warranties of any kind. We do not guarantee the accuracy or availability of deals. Always verify details with the restaurant before redeeming.' },
    { type: 'heading', text: '9. Limitation of Liability' },
    { type: 'paragraph', text: 'To the maximum extent permitted by law, ImHungri is not liable for any damages resulting from your use of the app, including inaccurate deals, technical issues, or third-party actions.' },
    { type: 'heading', text: '10. Changes to Terms' },
    { type: 'paragraph', text: 'We may update these Terms from time to time. Continued use of ImHungri after updates means you agree to the revised Terms.' },
    { type: 'heading', text: '11. Contact Us' },
    { type: 'paragraph', text: 'If you have questions about these Terms, please contact us at:\nimhungri.app@gmail.com' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Terms & Conditions" onBack={handleBack} />

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.textContainer}>
            {termsData.map((item, index) => {
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
  },
  scrollContainer: {
    flex: 1,
  },
  textContainer: {},
  mainTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginBottom: 12,
  },
  effectiveDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginBottom: 12,
  },
  heading: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginTop: 16,
    marginBottom: 8,
  },
  subheading: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginBottom: 8,
  },
  listItem: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginLeft: 16,
    marginBottom: 4,
  },
});

export default TermsConditionsPage;
