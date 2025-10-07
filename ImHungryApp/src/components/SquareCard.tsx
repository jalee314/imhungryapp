import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

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
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#757575',
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 14,
  },
  subtitle: {
    fontSize: 10,
    color: '#000',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 12,
  },
  distance: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Inter',
    textAlign: 'center', // Add this to center the distance
    letterSpacing: 0,
    lineHeight: 14,
  },
  dealCount: {
    fontSize: 11,
    color: '#FFA05C',
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center', // Add this to center the deal count
    letterSpacing: 0,
    lineHeight: 14,
  },
});

export default SquareCard;