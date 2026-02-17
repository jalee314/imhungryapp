/**
 * @file DealActionsBar — Vote buttons + favorite + share.
 *
 * Purely presentational. Wraps the existing VoteButtons component.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Monicon } from '@monicon/native';
import VoteButtons from '../../../components/VoteButtons';
import { Box } from '../../../ui/primitives';
import { STATIC, GRAY, RADIUS, SPACING, BORDER_WIDTH } from '../../../ui/alf';
import type { DealInteractions } from '../types';
import { Deal } from '../../../components/DealCard';

export interface DealActionsBarProps {
  dealData: Deal;
  interactions: DealInteractions;
}

export function DealActionsBar({ dealData, interactions }: DealActionsBarProps) {
  return (
    <Box
      row
      justify="space-between"
      align="center"
      px="2xl"
      mb="sm"
    >
      <VoteButtons
        votes={dealData.votes}
        isUpvoted={dealData.isUpvoted}
        isDownvoted={dealData.isDownvoted}
        onUpvote={interactions.handleUpvote}
        onDownvote={interactions.handleDownvote}
      />

      <Box row gap="xs">
        <TouchableOpacity
          style={{
            backgroundColor: STATIC.white,
            borderWidth: BORDER_WIDTH.thin,
            borderColor: GRAY[325],
            borderRadius: RADIUS.pill,
            width: 40,
            height: 28,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={interactions.handleFavorite}
          activeOpacity={0.6}
        >
          <Monicon
            name={dealData.isFavorited ? 'mdi:heart' : 'mdi:heart-outline'}
            size={19}
            color={dealData.isFavorited ? '#FF1E00' : '#000'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: STATIC.white,
            borderWidth: BORDER_WIDTH.thin,
            borderColor: GRAY[325],
            borderRadius: RADIUS.pill,
            width: 40,
            height: 28,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={interactions.handleShare}
        >
          <Monicon name="mdi-light:share" size={24} color={STATIC.black} />
        </TouchableOpacity>
      </Box>
    </Box>
  );
}
