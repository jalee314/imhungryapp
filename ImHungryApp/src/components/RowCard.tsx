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
                
                {/* User profile section */}
                {data.userDisplayName && (
                  <View style={styles.userProfileSection}>
                    <TouchableOpacity 
                      style={styles.userProfileContainer}
                      onPress={handleUserPress}
                      activeOpacity={0.7}
                    >
                      {data.userProfilePhoto ? (
                        <Image 
                          source={{ uri: data.userProfilePhoto }} 
                          style={styles.userProfileImage} 
                        />
                      ) : (
                        <View style={styles.userProfilePlaceholder}>
                          <Ionicons name="person" size={12} color="#666" />
                        </View>
                      )}
                      <Text style={styles.userProfileText}>
                        Shared by {data.userDisplayName}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    marginHorizontal: 12, // Further reduced to better match Figma design
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 0, // Remove padding to let content span full width
    width: '100%',
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
    paddingRight: 8, // Add padding to prevent text from touching arrow
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
    paddingLeft: 5, // Match Anima CSS padding
    alignSelf: 'stretch',
    minWidth: 20, // Ensure arrow has consistent width
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userProfileText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    color: '#888888',
  },
});

export default RowCard;
