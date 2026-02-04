/**
 * DealCardSkeleton - Loading State for DealCard
 * 
 * A skeleton placeholder for DealCard components.
 * Supports both horizontal and vertical variants.
 * Uses Skeleton atom and Box for consistent styling.
 */

import React from 'react';
import { Dimensions } from 'react-native';
import { Box, Skeleton } from './atoms';
import { borderRadius, spacing } from '../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

// Card dimensions matching DealCard
const HORIZONTAL_PADDING = 20;
const CARD_GAP = 4;
const VERTICAL_CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;
const HORIZONTAL_CARD_PADDING = 10;
const HORIZONTAL_CARD_WIDTH = (screenWidth - HORIZONTAL_CARD_PADDING - 20) / 1.32;

interface DealCardSkeletonProps {
  variant?: 'horizontal' | 'vertical';
}

const DealCardSkeleton: React.FC<DealCardSkeletonProps> = ({ variant = 'vertical' }) => {
  if (variant === 'horizontal') {
    return (
      <Box
        bg="background"
        rounded="md"
        py="m"
        px="s"
        alignStart
        width={HORIZONTAL_CARD_WIDTH}
        height={280}
        justifyCenter
      >
        {/* Image skeleton */}
        <Skeleton width={260} height={167} rounded="s" style={{ marginBottom: spacing.s }} />
        
        {/* Title skeleton */}
        <Box width="100%" mb="s" height={30} justifyStart>
          <Skeleton width="90%" height={12} rounded="sm" />
        </Box>
        
        {/* Details skeleton */}
        <Skeleton width="100%" height={24} rounded="xs" style={{ marginBottom: spacing.s }} />
        
        {/* Interactions skeleton */}
        <Box row justifyBetween alignCenter width="100%">
          <Skeleton width={80} height={28} rounded={30} />
          <Skeleton width={62} height={28} rounded={30} />
        </Box>
      </Box>
    );
  }

  // Vertical variant
  return (
    <Box
      bg="background"
      rounded="lg"
      p="s"
      alignStart
      width={VERTICAL_CARD_WIDTH}
      justifyStart
    >
      {/* Image skeleton */}
      <Skeleton width="100%" height={175} rounded="s" style={{ marginBottom: spacing.s }} />
      
      {/* Title skeleton */}
      <Skeleton 
        width={VERTICAL_CARD_WIDTH - 24} 
        height={30} 
        rounded="xs" 
        style={{ marginBottom: spacing.s }} 
      />
      
      {/* Details skeleton */}
      <Skeleton 
        width={VERTICAL_CARD_WIDTH - 24} 
        height={24} 
        rounded="xs" 
        style={{ marginBottom: spacing.s }} 
      />
      
      {/* Interactions skeleton */}
      <Box row justifyBetween alignCenter width="100%">
        <Skeleton width={70} height={28} rounded={30} />
        <Skeleton width={40} height={28} rounded={30} />
      </Box>
    </Box>
  );
};

export default DealCardSkeleton;
