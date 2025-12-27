import React, { useState, useEffect } from 'react';
import { Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '#/ui';
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  calendarHeaderText: {
    fontSize: 17,
    color: tokens.color.black,
  },
  calendarHeaderTitle: {
    fontSize: 17,
    fontWeight: tokens.fontWeight.semibold,
  },
  selectedDateContainer: {
    padding: tokens.space.lg,
    alignItems: 'flex-start',
  },
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C4C30',
    borderRadius: tokens.space.xl,
    paddingVertical: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    gap: tokens.space.sm,
  },
  selectedDateText: {
    fontSize: tokens.fontSize.sm,
    color: '#333',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C1C1C1',
    marginVertical: tokens.space.lg,
    marginHorizontal: tokens.space.lg,
  },
  noExpirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
  },
  noExpirationText: {
    fontSize: tokens.fontSize.xs,
    color: tokens.color.black,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: tokens.space.xs,
    borderWidth: 1,
    borderColor: '#C1C1C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: tokens.color.primary_600,
    borderColor: tokens.color.primary_600,
  }
});