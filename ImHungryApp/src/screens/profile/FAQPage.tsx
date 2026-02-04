import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';

const FAQPage = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const faqData = [
    {
      emoji: '🍔',
      title: 'General',
      questions: [
        {
          content: 'What is ImHungri?',
          contentData: 'ImHungri is a community-powered app where you can discover and share the best food deals around you.'
        },
        {
          content: 'Are the deals verified?',
          contentData: 'Deals are uploaded by both our team and community members. Popular deals are reviewed for accuracy, but we always recommend double-checking expiration and terms at the restaurant.'
        },
        {
          content: 'What if a deal is not working or is false info?',
          contentData: 'Use the report button (⋯) on the deal to flag it. Our team will review and remove invalid deals.'
        },
        {
          content: 'What are the up/down arrows?',
          contentData: 'We are constantly looking for users to provide feedback to deals. The up/down arrows are community voting buttons that help indicate to users on the quality of the deal.'
        }
      ]
    },
    {
      emoji: '💸',
      title: 'Deals & Redemptions',
      questions: [
        {
          content: 'How do I redeem a deal?',
          contentData: 'Tap a deal card to view details. Show the promotion to the cashier or follow the redemption instructions listed.'
        },
        {
          content: 'Do deals expire?',
          contentData: 'Yes. Each deal has an expiration date displayed on its card. If a deal has ended, it will be removed from the feed. If a deal didn\'t have a set expiration date, it will default to last for 14 days.'
        },
        {
          content: 'Why can\'t I find a deal I saw earlier?',
          contentData: 'Deals may have expired, sold out, or been removed if reported as invalid.'
        },
        {
          content: 'Can I save deals for later?',
          contentData: 'Yes! Tap the ❤️ icon to save a deal. You\'ll find all your saved deals in your Favorites tab.'
        }
      ]
    },
    {
      emoji: '👥',
      title: 'Community & Contribution',
      questions: [
        {
          content: 'How can I post a deal?',
          contentData: 'Go to the Contribute tab, upload a photo or details of the deal, and submit. Other users can then see and interact with your post.'
        },
        {
          content: 'What happens after I post a deal?',
          contentData: 'Deals go live instantly. Our team may review flagged content to ensure accuracy and community safety.'
        },
        {
          content: 'Can I edit or delete my deal after posting?',
          contentData: 'Yes, go to your profile → "My Deals" → choose the post you want to edit or delete.'
        },
        {
          content: 'What are the rules for posting deals?',
          contentData: 'Deals must be real, accurate, and food-related. Fake, expired, or offensive content will be removed. See our Community Guidelines for details.'
        }
      ]
    },
    {
      emoji: '🚩',
      title: 'Safety & Moderation',
      questions: [
        {
          content: 'How do I block a user?',
          contentData: 'Tap the "⋯" menu on their profile or post → select Block User. You won\'t see their content anymore.'
        },
        {
          content: 'How do I unblock a user?',
          contentData: 'Go to Profile → Settings → Privacy & Safety → Blocked Users, then the user you want to unblock → Done.'
        },
        {
          content: 'How do I report a deal?',
          contentData: 'Tap the "⋯" menu on a deal → select Report and choose a reason (Spam, Offensive, Expired, Fake, Other).'
        },
        {
          content: 'What happens when I report content?',
          contentData: 'The deal will be hidden from your feed and reviewed by our team. If confirmed, it will be removed for everyone.'
        }
      ]
    },
    {
      emoji: '📈',
      title: 'For Restaurants & Partners',
      questions: [
        {
          content: 'Can my restaurant be featured?',
          contentData: 'Yes! Restaurants can soon partner with ImHungri to highlight official deals. Contact us through the Profile → Settings → Contact Support option. We\'ll work together for a partnership.'
        },
        {
          content: 'Is there a cost to advertise deals?',
          contentData: 'Community uploads are free. Featured placements or promotions for restaurants may include advertising options. Contact us to learn more.'
        }
      ]
    },
    {
      emoji: '🛠️',
      title: 'Troubleshooting',
      questions: [
        {
          content: 'Why can\'t I log in?',
          contentData: 'Check your internet connection and try again. If issues continue, reset your password or contact support.'
        },
        {
          content: 'How do I reset my password?',
          contentData: 'Go to the login screen → "Forgot Password?" and follow the instructions.'
        },
        {
          content: 'I found a bug. What should I do?',
          contentData: 'We\'d love to fix it! Report bugs via Profile → Settings → Contact Support.'
        }
      ]
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Box row justifyBetween alignCenter px="2xl" pt="2xl">
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
          FAQ
        </Text>
        <Box width={24} />
      </Box>

      {/* Dotted Line */}
      <Box 
        mt="3xl"
        style={{
          height: 1,
          borderBottomWidth: 1,
          borderBottomColor: '#C1C1C1',
          borderStyle: 'dashed',
        }}
      />

      {/* Scrollable Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Box px="2xl" gap="lg">
          {faqData.map((section, sectionIndex) => (
            <Box key={sectionIndex} flex={1}>
              <Text 
                size="base" 
                weight="bold" 
                color="text" 
                mb="xl"
                style={{ fontFamily: typography.fontFamily.regular, lineHeight: 19 }}
              >
                {section.emoji} {section.title}
              </Text>
              {section.questions.map((question, questionIndex) => (
                <Box key={questionIndex} mb="xl">
                  <Text 
                    size="xs" 
                    weight="bold" 
                    color="text"
                    style={{ fontFamily: typography.fontFamily.regular, lineHeight: 19 }}
                  >
                    {question.content}
                  </Text>
                  {question.contentData && (
                    <Text 
                      size="xs" 
                      color="text" 
                      mt="m"
                      style={{ fontFamily: typography.fontFamily.regular, lineHeight: 19 }}
                    >
                      {question.contentData}
                    </Text>
                  )}
                </Box>
              ))}
              {sectionIndex < faqData.length - 1 && (
                <Box 
                  height={0.5} 
                  bg="border" 
                  mt="xl"
                  style={{ backgroundColor: '#C1C1C1' }}
                />
              )}
            </Box>
          ))}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQPage;
