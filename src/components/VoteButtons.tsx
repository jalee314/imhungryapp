import { BRAND, STATIC } from '@ui/alf/tokens';
import { Box, Text, Pressable } from '@ui/primitives';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react-native';
import React, { memo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Base design width (iPhone 15 = 393pt)
const BASE_WIDTH = 393;
// Scale factor for responsive sizing
const scale = (size: number) => (screenWidth / BASE_WIDTH) * size;

// Dynamic sizes
const PILL_WIDTH = scale(85);
const PILL_HEIGHT = scale(28);
const ARROW_SIZE = Math.round(scale(18));

// Vote state colors
const UPVOTE_COLOR = BRAND.primary; // #FF8C4C
const DOWNVOTE_COLOR = '#9796FF';
const INACTIVE_COLOR = STATIC.black;

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
  const upvoteColor = isUpvoted ? UPVOTE_COLOR : INACTIVE_COLOR;
  const downvoteColor = isDownvoted ? DOWNVOTE_COLOR : INACTIVE_COLOR;

  return (
    <Box
      row
      align="center"
      bg="#FFFFFF"
      borderWidth={1}
      borderColor="#D7D7D7"
      rounded={30}
      h={PILL_HEIGHT}
      w={PILL_WIDTH}
      overflow="hidden"
    >
      {/* Left half - upvote touchable area */}
      <Pressable
        flex={1}
        row
        align="center"
        justify="center"
        h="100%"
        pl={scale(8)}
        pr={scale(2)}
        onPress={onUpvote}
        opacityPressed={0.6}
      >
        <ArrowBigUp
          size={ARROW_SIZE}
          color={upvoteColor}
          fill={isUpvoted ? UPVOTE_COLOR : 'transparent'}
        />
        <Text style={styles.voteCount}>{votes}</Text>
      </Pressable>
      
      <Box w={1} h={scale(12)} bg="#DEDEDE" />
      
      {/* Right half - downvote touchable area */}
      <Pressable
        align="center"
        justify="center"
        h="100%"
        px={scale(10)}
        onPress={onDownvote}
        opacityPressed={0.6}
      >
        <ArrowBigDown
          size={ARROW_SIZE}
          color={downvoteColor}
          fill={isDownvoted ? DOWNVOTE_COLOR : 'transparent'}
        />
      </Pressable>
    </Box>
  );
};

const styles = StyleSheet.create({
  voteCount: {
    fontFamily: 'Inter',
    fontSize: scale(10),
    fontWeight: '400',
    color: '#000000',
    marginLeft: scale(4),
  },
});

export default memo(VoteButtons);
