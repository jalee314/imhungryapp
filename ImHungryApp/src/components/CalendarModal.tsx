import React, { useState, useEffect } from 'react';
import { Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens, atoms as a } from '#/ui';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.calendarHeaderText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.calendarHeaderTitle}>Expiration Date</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={[styles.calendarHeaderText, { color: '#FF8C4C', fontWeight: 'bold' }]}>Done</Text>
          </TouchableOpacity>
        </View>
        {selectedDate && !noExpirationKnown && (
          <View style={styles.selectedDateContainer}>
            <View style={styles.selectedDatePill}>
              <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={16} color="#333" />
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
            [selectedDate || '']: { selected: true, selectedColor: '#FF8C4C' },
          }}
          theme={{
            todayTextColor: '#FF8C4C',
            arrowColor: '#000',
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
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  calendarHeader: {
    ...a.flex_row,
    ...a.justify_between,
    ...a.align_center,
    ...a.p_lg,
    ...a.border_b,
    borderBottomColor: tokens.color.gray_200,
  },
  calendarHeaderText: {
    fontSize: 17,
    color: tokens.color.black,
  },
  calendarHeaderTitle: {
    ...a.font_semibold,
    fontSize: 17,
  },
  selectedDateContainer: {
    ...a.p_lg,
    ...a.align_start,
  },
  selectedDatePill: {
    ...a.flex_row,
    ...a.align_center,
    ...a.py_sm,
    ...a.px_md,
    ...a.gap_sm,
    backgroundColor: '#FF8C4C30',
    borderRadius: tokens.radius.xl,
  },
  selectedDateText: {
    ...a.text_sm,
    color: tokens.color.gray_800,
  },
  separator: {
    ...a.my_lg,
    ...a.mx_lg,
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.color.gray_400,
  },
  noExpirationContainer: {
    ...a.flex_row,
    ...a.align_center,
    ...a.justify_between,
    ...a.px_lg,
    ...a.py_sm,
  },
  noExpirationText: {
    ...a.text_xs,
    ...a.text_black,
  },
  checkbox: {
    ...a.justify_center,
    ...a.align_center,
    ...a.border,
    width: 20,
    height: 20,
    borderRadius: tokens.radius.xs,
    borderColor: tokens.color.gray_400,
  },
  checkboxActive: {
    ...a.bg_primary_600,
    ...a.border_primary_600,
  }
});