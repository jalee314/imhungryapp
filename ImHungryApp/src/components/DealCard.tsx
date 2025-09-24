import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface Deal {
  id: string;
  title: string;
  restaurant: string;
  details: string;
  image: string;
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  cuisine?: string;
  timeAgo: string;
  author?: string;
}

interface DealCardProps {
  deal: Deal;
  variant?: 'community' | 'standard';
  onUpvote?: (dealId: string) => void;
  onDownvote?: (dealId: string) => void;
  onFavorite?: (dealId: string) => void;
  onPress?: (dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({
  deal,
  variant = 'standard',
  onUpvote,
  onDownvote,
  onFavorite,
  onPress,
}) => {
  const isCommunity = variant === 'community';

  const handleUpvote = () => {
    onUpvote?.(deal.id);
  };

  const handleDownvote = () => {
    onDownvote?.(deal.id);
  };

  const handleFavorite = () => {
    onFavorite?.(deal.id);
  };

  const handlePress = () => {
    onPress?.(deal.id);
  };

  const renderContent = () => {
    if (isCommunity) {
      // Community variant: Image first, then title
      return (
        <>
          <Image source={{ uri: deal.image }} style={styles.communityImage} />
          <Text style={styles.communityTitle}>{deal.title}</Text>
          <Text style={styles.communityDetails}>{deal.details}</Text>
        </>
      );
    } else {
      // Standard variant: Title first, then image
      return (
        <>
          <Text style={styles.standardTitle}>{deal.title}</Text>
          <Image source={{ uri: deal.image }} style={styles.standardImage} />
          <Text style={styles.standardDetails}>{deal.details}</Text>
        </>
      );
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCommunity ? styles.communityCard : styles.standardCard
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {renderContent()}
      
      {/* Interactions */}
      <View style={styles.cardInteractions}>
        <View style={styles.voteContainer}>
          <TouchableOpacity 
            style={[styles.voteButton, deal.isUpvoted && styles.upvoted]}
            onPress={handleUpvote}
          >
            <MaterialCommunityIcons 
              name="arrow-up" 
              size={12} 
              color={deal.isUpvoted ? "#FFF" : "#000"} 
            />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{deal.votes}</Text>
          <View style={styles.voteSeparator} />
          <TouchableOpacity 
            style={[styles.voteButton, deal.isDownvoted && styles.downvoted]}
            onPress={handleDownvote}
          >
            <MaterialCommunityIcons 
              name="arrow-down" 
              size={12} 
              color={deal.isDownvoted ? "#FFF" : "#000"} 
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.favoriteButton, deal.isFavorited && styles.favorited]}
          onPress={handleFavorite}
        >
          <MaterialCommunityIcons 
            name={deal.isFavorited ? "heart" : "heart-outline"} 
            size={16} 
            color={deal.isFavorited ? "#FF8C4C" : "#000"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  communityCard: {
    width: 220,
    marginRight: 8,
  },
  standardCard: {
    width: 185,
    borderWidth: 0.5,
    borderColor: '#AAAAAA',
    marginBottom: 8,
  },
  // Community variant styles
  communityImage: {
    width: 204,
    height: 144,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#757575',
    marginBottom: 8,
  },
  communityTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'center',
    width: 204,
    height: 30,
    marginBottom: 8,
  },
  communityDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    width: 204,
    height: 24,
    marginBottom: 8,
  },
  // Standard variant styles
  standardTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 15,
    color: '#000000',
    textAlign: 'center',
    width: 169,
    height: 30,
    marginBottom: 8,
  },
  standardImage: {
    width: 169,
    height: 144,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#757575',
    marginBottom: 8,
  },
  standardDetails: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#000000',
    width: 169,
    height: 24,
    marginBottom: 8,
  },
  // Interaction styles
  cardInteractions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  voteButton: {
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvoted: {
    backgroundColor: '#FF8C4C',
  },
  downvoted: {
    backgroundColor: '#9796FF',
  },
  voteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#000000',
    marginHorizontal: 6,
  },
  voteSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#D8D8D8',
    marginHorizontal: 6,
  },
  favoriteButton: {
    backgroundColor: '#F8F4F4',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 30,
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favorited: {
    backgroundColor: '#FF8C4C',
  },
});

export default DealCard;
