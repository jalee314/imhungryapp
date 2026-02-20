import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

import ScreenHeader from '../../components/ui/ScreenHeader';
import { STATIC, GRAY } from '../../ui/alf';

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader title="FAQ" onBack={handleBack} />

      {/* Dotted Line */}
      <View style={styles.dottedLine} />

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {faqData.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {section.emoji} {section.title}
              </Text>
              {section.questions.map((question, questionIndex) => (
                <View key={questionIndex} style={styles.questionContainer}>
                  <Text style={styles.sectionContent}>
                    {question.content}
                  </Text>
                  {question.contentData && (
                    <Text style={styles.sectionContentData}>
                      {question.contentData}
                    </Text>
                  )}
                </View>
              ))}
              {sectionIndex < faqData.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC.white,
  },

  dottedLine: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[350],
    borderStyle: 'dashed',
    marginTop: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 18,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    color: STATIC.black,
    marginBottom: 16,
  },
  questionContainer: {
    marginBottom: 16,
  },
  sectionContent: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
  },
  sectionContentData: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 19,
    color: STATIC.black,
    marginTop: 8,
  },
  separator: {
    height: 0.5,
    backgroundColor: GRAY[350],
    marginTop: 16,
  },
});

export default FAQPage;
