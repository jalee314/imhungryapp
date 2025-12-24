import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react-native';

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
          size={18}
          color={isUpvoted ? "#FF8C4C" : "#000000"}
          fill={isUpvoted ? "#FF8C4C" : "transparent"}
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
          size={18}
          color={isDownvoted ? "#9796FF" : "#000000"}
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    height: 28,
    width: 85,
    overflow: 'hidden',
  },
  upvoteArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingLeft: 8,
    paddingRight: 2,
  },
  downvoteArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 10,
  },
  voteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginLeft: 4,
  },
  voteSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#DEDEDE',
  },
});

export default memo(VoteButtons);
