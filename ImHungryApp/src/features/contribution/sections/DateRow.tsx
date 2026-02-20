/**
 * @file DateRow — Expiration date selection row
 *
 * Tappable row that opens the CalendarModal (managed by the screen).
 * Optionally shows an inline clear button when a date is set.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, Pressable } from '../../../ui/primitives';

export interface DateRowProps {
  /** Current expiration date value (ISO string, 'Unknown', or null). */
  expirationDate: string | null;
  /** Called when the row is tapped. */
  onPress: () => void;
  /** Optional callback to clear the date inline (used by edit screen). */
  onClear?: () => void;
}

const rowMinHeightStyle = { minHeight: 38 };
const dateLabelStyle = { fontSize: 11 };

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

export function DateRow({ expirationDate, onPress, onClear }: DateRowProps) {
  const displayText = formatDisplayDate(expirationDate);

  return (
    <Pressable row gap="lg" py={6} px="lg" align="center" style={rowMinHeightStyle} onPress={onPress}>
      <Ionicons name="time-outline" size={20} color="#4E4E4E" />
      <Box flex={1}>
        <Text size="xs" color="#000000">Expiration Date</Text>
        {displayText && (
          <Text style={dateLabelStyle} color="#888889" mt="2xs">{displayText}</Text>
        )}
      </Box>
      {onClear && expirationDate ? (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color="#888889" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={12} color="black" />
      )}
    </Pressable>
  );
}
