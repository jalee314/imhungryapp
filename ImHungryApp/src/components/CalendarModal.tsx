import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { BRAND, STATIC, GRAY, FONT_SIZE, RADIUS, ALPHA_COLORS } from '../ui/alf';

import ModalHeader from './ui/ModalHeader';


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
      <SafeAreaView style={styles.safeArea}>
        <ModalHeader
          title="Expiration Date"
          onCancel={onClose}
          onDone={handleConfirm}
        />
        {selectedDate && !noExpirationKnown && (
          <View style={styles.selectedDateContainer}>
            <View style={styles.selectedDatePill}>
              <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={16} color={GRAY[900]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Calendar
          onDayPress={(day) => {
            // Get today's date as a 'YYYY-MM-DD' string.
            // .toISOString() returns UTC, but splitting at 'T' gives us the correct date part regardless of timezone.
            const todayString = new Date().toISOString().split('T')[0];

            // Compare the strings directly. This is reliable and avoids all timezone issues.
            if (day.dateString < todayString) {
              // Ignore selection if the selected date string is lexicographically smaller than today's.
              return;
            }

            setSelectedDate(day.dateString);
            if (noExpirationKnown) {
              setNoExpirationKnown(false);
            }
          }}
          markedDates={{
            [selectedDate || '']: { selected: true, selectedColor: BRAND.primary },
          }}
          theme={{
            todayTextColor: BRAND.primary,
            arrowColor: STATIC.black,
          }}
        />

        {/* Separator line */}
        <View style={styles.separator} />

        {/* No expiration known toggle */}
        <TouchableOpacity
          style={styles.noExpirationContainer}
          onPress={handleToggleNoExpiration}
        >
          <Text style={styles.noExpirationText}>Mark if expiration is unknown</Text>
          <View style={[
            styles.checkbox,
            noExpirationKnown ? styles.checkboxActive : {}
          ]}>
            {noExpirationKnown && (
              <Ionicons name="checkmark" size={16} color={STATIC.white} />
            )}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  selectedDateContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ALPHA_COLORS.brandPrimary20,
    borderRadius: RADIUS.circle,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  selectedDateText: {
    fontSize: FONT_SIZE.sm,
    color: GRAY[900],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: GRAY[350],
    marginVertical: 16,
    marginHorizontal: 16,
  },
  noExpirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noExpirationText: {
    fontSize: FONT_SIZE.xs,
    color: STATIC.black,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GRAY[350],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  }
});
