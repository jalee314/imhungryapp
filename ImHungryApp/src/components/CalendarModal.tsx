/**
 * CalendarModal - Date Selection Modal
 * 
 * A modal for selecting expiration dates with calendar.
 * Uses atomic components and theme tokens for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Box, Text, Pressable, Divider } from './atoms';
import { colors, spacing, borderRadius } from '../lib/theme';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string | null) => void;
  initialDate: string | null;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function CalendarModal({ visible, onClose, onConfirm, initialDate }: CalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [noExpirationKnown, setNoExpirationKnown] = useState(false);

  useEffect(() => {
    setSelectedDate(initialDate === 'Unknown' ? null : initialDate);
    setNoExpirationKnown(initialDate === 'Unknown');
  }, [initialDate, visible]);

  const handleConfirm = () => {
    if (noExpirationKnown) {
      onConfirm('Unknown');
    } else {
      onConfirm(selectedDate);
    }
  };

  const handleToggleNoExpiration = () => {
    setNoExpirationKnown(!noExpirationKnown);
    if (!noExpirationKnown) {
      setSelectedDate(null);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Box row justifyBetween alignCenter p="m" borderBottom={1} borderColor="border">
          <Pressable onPress={onClose}>
            <Text size="md" color="text">Cancel</Text>
          </Pressable>
          <Text size="md" weight="semibold" color="text">Expiration Date</Text>
          <Pressable onPress={handleConfirm}>
            <Text size="md" weight="bold" color="primaryDark">Done</Text>
          </Pressable>
        </Box>

        {/* Selected Date Pill */}
        {selectedDate && !noExpirationKnown && (
          <Box p="m" alignStart>
            <Box 
              row 
              alignCenter 
              gap="s"
              py="s" 
              px="m"
              style={{ backgroundColor: '#FF8C4C30' }}
              rounded="pill"
            >
              <Text size="sm" color="text">{formatDate(selectedDate)}</Text>
              <Pressable onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={16} color={colors.text} />
              </Pressable>
            </Box>
          </Box>
        )}

        {/* Calendar */}
        <Calendar
          onDayPress={(day) => {
            const todayString = new Date().toISOString().split('T')[0];
            if (day.dateString < todayString) {
              return;
            }
            setSelectedDate(day.dateString);
            if (noExpirationKnown) {
              setNoExpirationKnown(false);
            }
          }}
          markedDates={{
            [selectedDate || '']: { selected: true, selectedColor: colors.primaryDark },
          }}
          theme={{
            todayTextColor: colors.primaryDark,
            arrowColor: colors.text,
          }}
        />

        {/* Separator */}
        <Box mx="m" my="m">
          <Divider />
        </Box>
        
        {/* No expiration toggle */}
        <Pressable 
          onPress={handleToggleNoExpiration}
          row
          alignCenter
          justifyBetween
          px="m"
          py="s"
        >
          <Text size="xs" color="text">Mark if expiration is unknown</Text>
          <Box
            width={20}
            height={20}
            rounded="xs"
            border={1}
            borderColor={noExpirationKnown ? 'primaryDark' : 'borderDark'}
            bg={noExpirationKnown ? 'primaryDark' : 'transparent'}
            center
          >
            {noExpirationKnown && (
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            )}
          </Box>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
