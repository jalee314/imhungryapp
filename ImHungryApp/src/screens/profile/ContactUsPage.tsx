import React from 'react';
import { SafeAreaView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text, Pressable } from '../../components/atoms';
import { colors, typography } from '../../lib/theme';

const ContactUsPage = () => {
  const navigation = useNavigation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:imhungri.app@gmail.com');
  };

  const handleFeedbackFormPress = () => {
    Linking.openURL('https://docs.google.com/forms/d/e/1FAIpQLSce_wGZMptFQ5fB_WdhEW5a6ujprt0KdLLajs0D7H4hdbo21A/viewform?usp=header');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Box row justifyBetween alignCenter px="2xl" py="2xl">
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text 
          size="base" 
          weight="bold" 
          color="text" 
          flex={1} 
          align="center"
          style={{ fontFamily: typography.fontFamily.regular }}
        >
          Contact Us
        </Text>
        <Box width={24} />
      </Box>

      {/* Content */}
      <Box flex={1}>
        {/* Email Section */}
        <Box row justifyBetween alignCenter px="2xl" py="3xl">
          <Text 
            size="base" 
            color="text"
            style={{ fontFamily: typography.fontFamily.regular }}
          >
            Email Us:
          </Text>
          <Pressable onPress={handleEmailPress}>
            <Text 
              size="md" 
              color="text"
              style={{ fontFamily: typography.fontFamily.regular }}
            >
              imhungri.app@gmail.com
            </Text>
          </Pressable>
        </Box>

        {/* Separator Line */}
        <Box height={1} mx="2xl" style={{ backgroundColor: '#E0E0E0' }} />

        {/* Feedback Form Section */}
        <Box row justifyBetween alignCenter px="2xl" py="3xl">
          <Text 
            size="base" 
            color="text"
            style={{ fontFamily: typography.fontFamily.regular }}
          >
            Feedback Form:
          </Text>
          <Pressable onPress={handleFeedbackFormPress}>
            <Box alignCenter>
              <Text 
                size="md" 
                color="text"
                style={{ fontFamily: typography.fontFamily.regular }}
              >
                CLICK HERE
              </Text>
              <Box 
                height={1} 
                width="100%" 
                mt="xs"
                style={{ backgroundColor: colors.text }} 
              />
            </Box>
          </Pressable>
        </Box>

        {/* Separator Line under Feedback Form */}
        <Box height={1} mx="2xl" style={{ backgroundColor: '#E0E0E0' }} />
      </Box>
    </SafeAreaView>
  );
};

export default ContactUsPage;
