/**
 * @file DateRow — Expiration date selection row
 *
 * Tappable row that opens the CalendarModal (managed by the screen).
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable } from '../../../ui/primitives';
import { GRAY, STATIC } from '../../../ui/alf/tokens';

export interface DateRowProps {
  /** Current expiration date value (ISO string, 'Unknown', or null). */
  expirationDate: string | null;
  /** Called when the row is tapped. */
  onPress: () => void;
}

/**
 * Format storage date into a human-readable display string.
 * Matches the formatting used in DealCreationScreen.
 */
function formatDisplayDate(dateString: string | null): string | null {
  if (!dateString || dateString === 'Unknown') {
    return dateString === 'Unknown' ? 'Not Known' : null;
  }
  const date = new Date(dateString);
  return new Date(
    date.getTime() + date.getTimezoneOffset() * 60000,
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DateRow({ expirationDate, onPress }: DateRowProps) {
  const displayText = formatDisplayDate(expirationDate);

  return (
    <Pressable row gap="sm" py={14} px="md" onPress={onPress}>
      <Ionicons name="time-outline" size={20} color={GRAY[700]} />
      <Box flex={1}>
        <Text size="sm" weight="medium" color="textMuted">Expiration Date</Text>
        {displayText && (
          <Text size="xs" color="textSubtle" mt="2xs">{displayText}</Text>
        )}
      </Box>
      <Ionicons name="chevron-forward" size={12} color={STATIC.black} />
    </Pressable>
  );
}
