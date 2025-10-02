import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}

interface RowCardProps {
  data: RowCardData;
  variant: 'explore-deal-card' | 'rest-deal' | 'favorites-deal-card';
  onPress?: (id: string) => void;
  style?: any;
}

const RowCard: React.FC<RowCardProps> = ({ data, variant, onPress, style }) => {
  const handlePress = () => {
    onPress?.(data.id);
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
              <Ionicons name="chevron-forward" size={16} color="#666" />
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
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </View>
        );

      case 'favorites-deal-card':
        return (
          <View style={styles.content}>
            <View style={styles.frame}>
              <Image source={data.image} style={styles.image} />
            </View>
            
            <View style={styles.textFrame}>
              <View style={styles.dealTitle}>
                <Text style={[styles.titleText, styles.favoritesTitle]} numberOfLines={2}>
                  {data.title}
                </Text>
              </View>
              
              <View style={styles.dealDetails}>
                <Text style={[styles.subtitleText, styles.favoritesSubtitle]}>
                  {data.subtitle}
                </Text>
              </View>
            </View>
            
            <View style={styles.arrow}>
              <Ionicons name="chevron-forward" size={16} color="#666" />
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 0, // Remove horizontal margin
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16, // Match restaurant info section exactly
  },
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  textFrame: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    height: 66,
    justifyContent: 'center',
  },
  dealTitle: {
    alignSelf: 'stretch',
  },
  titleText: {
    color: '#000000',
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
    color: '#666666',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  
  // Variant-specific styles
  'explore-deal-card': {
    height: 86,
  },
  'rest-deal': {
    height: 86,
  },
  'favorites-deal-card': {
    height: 86,
  },
});

export default RowCard;
