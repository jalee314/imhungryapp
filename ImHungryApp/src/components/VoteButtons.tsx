import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Monicon } from '@monicon/native';

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
      <TouchableOpacity
        style={styles.voteButton}
        onPress={onUpvote}
        activeOpacity={0.6}
      >
        <Monicon
          name="ph:arrow-fat-up-fill"
          size={18}
          color={isUpvoted ? "#FF8C4C" : "#D8D8D8"}
        />
      </TouchableOpacity>
      <Text style={styles.voteCount}>{votes}</Text>
      <View style={styles.voteSeparator} />
      <TouchableOpacity
        style={styles.voteButton}
        onPress={onDownvote}
        activeOpacity={0.6}
      >
        <Monicon
          name="ph:arrow-fat-down-fill"
          size={18}
          color={isDownvoted ? "#9796FF" : "#D8D8D8"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 2,
    height: 28,
    width: 85,
  },
  voteButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  voteCount: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '400',
    color: '#000000',
    marginHorizontal: 6,
  },
  voteSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 6,
  },
});

export default memo(VoteButtons);
