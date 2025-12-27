import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { tokens } from '#/ui';

const ContactUsPage = () => {
  const navigation = useNavigation();


  const handleEmailPress = () => {
    Linking.openURL('mailto:imhungri.app@gmail.com');
  };

  const handleFeedbackFormPress = () => {
    // Open feedback form - you can replace with actual URL
    Linking.openURL('https://docs.google.com/forms/d/e/1FAIpQLSce_wGZMptFQ5fB_WdhEW5a6ujprt0KdLLajs0D7H4hdbo21A/viewform?usp=header');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.titleText}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Email Section */}
        <View style={styles.contactItem}>
          <Text style={styles.labelText}>Email Us:</Text>
          <TouchableOpacity onPress={handleEmailPress}>
            <Text style={styles.emailText}>imhungri.app@gmail.com</Text>
          </TouchableOpacity>
        </View>

        {/* Separator Line */}
        <View style={styles.separator} />

        {/* Feedback Form Section */}
        <View style={styles.contactItem}>
          <Text style={styles.labelText}>Feedback Form:</Text>
          <TouchableOpacity onPress={handleFeedbackFormPress}>
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>CLICK HERE</Text>
              <View style={styles.underline} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Separator Line under Feedback Form */}
        <View style={styles.separator} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.space.xl,
    paddingVertical: tokens.space.xl,
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.bold,
    fontSize: tokens.fontSize.md,
    color: tokens.color.black,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,    
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.space.xl,
    paddingBottom: tokens.space._2xl,
    paddingTop: tokens.space._2xl,
  },
  labelText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.md,
    color: tokens.color.black,
  },
  emailText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.sm,
    color: tokens.color.black,
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontFamily: 'Inter',
    fontWeight: tokens.fontWeight.normal,
    fontSize: tokens.fontSize.sm,
    color: tokens.color.black,
  },
  underline: {
    height: 1,
    backgroundColor: tokens.color.black,
    width: '100%',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: tokens.color.gray_200,
    marginHorizontal: tokens.space.xl,
  },

});

export default ContactUsPage;
