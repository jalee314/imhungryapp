import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { tokens, atoms as a } from '#/ui';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = 107; // Fixed width to match Figma design

export interface SquareCardData {
  id: string;
  title: string;
  subtitle: string;
  image: string | any;
  distance?: string;
  dealCount?: number;
}

interface SquareCardProps {
  data: SquareCardData;
  onPress?: (id: string) => void;
}

const SquareCard: React.FC<SquareCardProps> = ({ data, onPress }) => {
  const handlePress = () => {
    onPress?.(data.id);
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={data.image} style={styles.image} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {data.title}
        </Text>
        
        <Text style={styles.subtitle} numberOfLines={1}>
          {data.distance && data.dealCount 
            ? `${data.distance} • ${data.dealCount} Deals`
            : data.subtitle
          }
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: 124, // Fixed height to match Figma design
    ...a.bg_white,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 0.5,
    ...a.border_gray_500,
    padding: 4,
    ...a.justify_between,
    ...a.items_center,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    ...a.overflow_hidden,
  },
  image: {
    ...a.w_full,
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    ...a.w_full,
    ...a.items_center,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    ...a.text_black,
    fontFamily: 'Inter',
    ...a.text_center,
    marginBottom: 0,
    lineHeight: 14,
  },
  subtitle: {
    fontSize: 10,
    ...a.text_black,
    fontFamily: 'Inter',
    ...a.text_center,
    lineHeight: 12,
  },
  distance: {
    fontSize: 11,
    ...a.text_gray_400,
    fontFamily: 'Inter',
    ...a.text_center,
    letterSpacing: 0,
    lineHeight: 14,
  },
  dealCount: {
    fontSize: 11,
    ...a.text_primary_500,
    fontFamily: 'Inter',
    fontWeight: '500',
    ...a.text_center,
    letterSpacing: 0,
    lineHeight: 14,
  },
});

export default SquareCard;