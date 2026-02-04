/**
 * VoteButtons - Upvote/Downvote Pill Component
 * 
 * A compact voting interface with upvote and downvote buttons.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React, { memo } from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react-native';
import { Box, Text } from './atoms';
import { colors } from '../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

// Base design width (iPhone 15 = 393pt)
const BASE_WIDTH = 393;
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
    <Box
      row
      alignCenter
      bg="background"
      border={1}
      borderColor="borderLight"
      rounded={30}
      height={PILL_HEIGHT}
      width={PILL_WIDTH}
      overflow="hidden"
    >
      {/* Left half - upvote touchable area */}
      <TouchableOpacity
        onPress={onUpvote}
        activeOpacity={0.6}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          paddingLeft: scale(8),
          paddingRight: scale(2),
        }}
      >
        <ArrowBigUp
          size={ARROW_SIZE}
          color={isUpvoted ? colors.primaryDark : colors.text}
          fill={isUpvoted ? colors.primaryDark : 'transparent'}
        />
        <Text 
          size={scale(10)} 
          weight="normal" 
          color="text" 
          ml={scale(4)}
        >
          {votes}
        </Text>
      </TouchableOpacity>

      {/* Separator */}
      <Box 
        width={1} 
        height={scale(12)} 
        bg="border" 
      />

      {/* Right half - downvote touchable area */}
      <TouchableOpacity
        onPress={onDownvote}
        activeOpacity={0.6}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          paddingHorizontal: scale(10),
        }}
      >
        <ArrowBigDown
          size={ARROW_SIZE}
          color={isDownvoted ? '#9796FF' : colors.text}
          fill={isDownvoted ? '#9796FF' : 'transparent'}
        />
      </TouchableOpacity>
    </Box>
  );
};

export default memo(VoteButtons);
