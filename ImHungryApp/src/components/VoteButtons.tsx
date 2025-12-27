import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react-native';
import * as tokens from '#/ui/tokens';

const { width: screenWidth } = Dimensions.get('window');

// Base design width (iPhone 15 = 393pt)
const BASE_WIDTH = 393;
// Scale factor for responsive sizing
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

// Dynamic sizes
const PILL_WIDTH = scale(85);
const PILL_HEIGHT = scale(28);
const ARROW_SIZE = Math.round(scale(18));

interface VoteButtonsProps {
  votes: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({
  votes,
  isUpvoted,
  isDownvoted,
  onUpvote,
  onDownvote,
}) => {
  return (
    <View style={styles.voteContainer}>
      {/* Left half - upvote touchable area */}
      <TouchableOpacity
        style={styles.upvoteArea}
        onPress={onUpvote}
        activeOpacity={0.6}
      >
        <ArrowBigUp
          size={ARROW_SIZE}
          color={isUpvoted ? tokens.color.primary_600 : tokens.color.black}
          fill={isUpvoted ? tokens.color.primary_600 : "transparent"}
        />
        <Text style={styles.voteCount}>{votes}</Text>
      </TouchableOpacity>
      
      <View style={styles.voteSeparator} />
      
      {/* Right half - downvote touchable area */}
      <TouchableOpacity
        style={styles.downvoteArea}
        onPress={onDownvote}
        activeOpacity={0.6}
      >
        <ArrowBigDown
          size={ARROW_SIZE}
          color={isDownvoted ? "#9796FF" : tokens.color.black}
          fill={isDownvoted ? "#9796FF" : "transparent"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.color.white,
    borderWidth: 1,
    borderColor: tokens.color.gray_300,
    borderRadius: 30,
    height: PILL_HEIGHT,
    width: PILL_WIDTH,
    overflow: 'hidden',
  },
  upvoteArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingLeft: scale(8),
    paddingRight: scale(2),
  },
  downvoteArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: scale(10),
  },
  voteCount: {
    fontFamily: 'Inter',
    fontSize: scale(10),
    fontWeight: '400',
    color: tokens.color.black,
    marginLeft: scale(4),
  },
  voteSeparator: {
    width: 1,
    height: scale(12),
    backgroundColor: tokens.color.gray_200,
  },
});

export default memo(VoteButtons);
