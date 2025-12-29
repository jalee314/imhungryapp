import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens, atoms as a } from '#/ui';

export interface RowCardData {
  id: string;
  title: string;
  subtitle: string;
  image: string | any;
  distance?: string;
  dealCount?: number;
  views?: number;
  postedDate?: string;
  expiresIn?: string;
  // User profile information for favorites
  userId?: string;
  userProfilePhoto?: string;
  userDisplayName?: string;
}

interface RowCardProps {
  data: RowCardData;
  variant: 'explore-deal-card' | 'rest-deal' | 'favorites-deal-card';
  onPress?: (id: string) => void;
  onUserPress?: (userId: string) => void;
  style?: any;
}

const RowCard: React.FC<RowCardProps> = ({ data, variant, onPress, onUserPress, style }) => {
  const handlePress = () => {
    onPress?.(data.id);
  };

  const handleUserPress = () => {
    if (data.userId && onUserPress) {
      onUserPress(data.userId);
    }
  };

  const renderContent = () => {
    switch (variant) {
      case 'explore-deal-card':
        return (
          <View style={styles.content}>
            <View style={styles.frame}>
              <Image source={data.image} style={styles.image} />
            </View>
            
            <View style={styles.textFrame}>
              <View style={styles.dealTitle}>
                <Text style={[styles.titleText, styles.exploreTitle]} numberOfLines={2}>
                  {data.title}
                </Text>
              </View>
              
              <View style={styles.dealDetails}>
                <Text style={[styles.subtitleText, styles.exploreSubtitle]}>
                  Posted {data.postedDate} • {data.expiresIn} • {data.views} views
                </Text>
              </View>
            </View>
            
            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={16} color={tokens.color.gray_500} />
            </View>
          </View>
        );

      case 'rest-deal':
        return (
          <View style={styles.content}>
            <View style={styles.frame}>
              <Image source={data.image} style={styles.image} />
            </View>
            
            <View style={styles.textFrame}>
              <View style={styles.dealTitle}>
                <Text style={[styles.titleText, styles.restTitle]} numberOfLines={2}>
                  {data.title}
                </Text>
              </View>
              
              <View style={styles.dealDetails}>
                <Text style={[styles.subtitleText, styles.restSubtitle]}>
                  {data.distance} • {data.dealCount} Deals
                </Text>
              </View>
            </View>
            
            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={16} color={tokens.color.black} />
            </View>
          </View>
        );

      case 'favorites-deal-card':
        return (
          <View style={styles.content}>
            <View style={styles.frame}>
              <Image source={data.image} style={styles.image} />
            </View>
            
            <View style={styles.favoritesTextFrame}>
              <Text style={[styles.titleText, styles.favoritesTitle]} numberOfLines={2}>
                {data.title}
              </Text>
              <Text style={[styles.subtitleText, styles.favoritesSubtitle]}>
                {data.subtitle}
              </Text>
            </View>
            
            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={16} color={tokens.color.black} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.rowCard, styles[variant], style]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowCard: {
    ...a.bg_white,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 12, // Further reduced to better match Figma design
    marginVertical: 4,
  },
  content: {
    ...a.flex_row,
    ...a.items_center,
    gap: 16,
    paddingHorizontal: 0, // Remove padding to let content span full width
    ...a.w_full,
  },
  frame: {
    ...a.items_center,
    ...a.justify_center,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  textFrame: {
    ...a.flex_1,
    flexDirection: 'column',
    gap: 4,
    height: 76,
    ...a.justify_center,
    paddingRight: 8, // Add padding to prevent text from touching arrow
  },
  favoritesTextFrame: {
    ...a.flex_1,
    flexDirection: 'column',
    ...a.justify_center,
    gap: 4,
    paddingRight: 8,
  },
  dealTitle: {
    alignSelf: 'stretch',
  },
  titleText: {
    ...a.text_black,
    letterSpacing: -0.35,
    lineHeight: 17,
  },
  exploreTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  restTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  dealDetails: {
    alignSelf: 'stretch',
  },
  subtitleText: {
    color: tokens.color.gray_600,
  },
  exploreSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  restSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  favoritesSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  arrow: {
    ...a.items_center,
    ...a.justify_center,
    padding: 6,
    paddingLeft: 5, // Match Anima CSS padding
    alignSelf: 'stretch',
    minWidth: 20, // Ensure arrow has consistent width
  },
  
  // Variant-specific styles
  'explore-deal-card': {
    height: 96,
  },
  'rest-deal': {
    height: 96,
  },
  'favorites-deal-card': {
    height: 96,
  },
  // User profile styles
  userProfileSection: {
    marginTop: 4,
  },
  userProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userProfileImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  userProfilePlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    ...a.bg_gray_100,
    ...a.justify_center,
    ...a.items_center,
    marginRight: 6,
  },
  userProfileText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: tokens.color.gray_500,
  },
});

export default RowCard;
