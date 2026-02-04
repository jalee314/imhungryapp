import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';

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

  const getTextStyle = (type: string) => {
    switch (type) {
      case 'main_title':
        return { weight: 'bold' as const, marginBottom: 12, marginTop: 0 };
      case 'effective_date':
        return { weight: 'regular' as const, marginBottom: 12, marginTop: 0 };
      case 'heading':
        return { weight: 'bold' as const, marginBottom: 8, marginTop: 16 };
      case 'subheading':
        return { weight: 'bold' as const, marginBottom: 4, marginTop: 12 };
      case 'list_item':
        return { weight: 'regular' as const, marginBottom: 4, marginTop: 0, marginLeft: 16 };
      case 'paragraph':
      default:
        return { weight: 'regular' as const, marginBottom: 8, marginTop: 0 };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Box row justifyBetween alignCenter px="2xl" pt="2xl" pb="3xl">
        <Pressable onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text 
          size="base" 
          weight="bold" 
          color="text" 
          flex={1} 
          align="center"
          style={{ fontFamily: typography.fontFamily.regular, lineHeight: 19 }}
        >
          Terms & Conditions
        </Text>
        <Box width={24} />
      </Box>

      {/* Content */}
      <Box flex={1} px="2xl" pb="2xl">
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Box>
            {termsData.map((item, index) => {
              const style = getTextStyle(item.type);
              return (
                <Text 
                  key={index}
                  size="xs" 
                  weight={style.weight}
                  color="text"
                  style={{ 
                    fontFamily: typography.fontFamily.regular, 
                    lineHeight: 19,
                    marginBottom: style.marginBottom,
                    marginTop: style.marginTop,
                    marginLeft: item.type === 'list_item' ? style.marginLeft : 0,
                  }}
                >
                  {item.type === 'list_item' ? `• ${item.text}` : item.text}
                </Text>
              );
            })}
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

export default TermsConditionsPage;
