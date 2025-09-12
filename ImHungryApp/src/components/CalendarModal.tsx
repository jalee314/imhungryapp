import React, { useState, useEffect } from 'react';
import { Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button } from 'react-native';
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

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate, visible]);

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const handleSetUnknown = () => {
    onConfirm('Unknown');
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
            <Text style={[styles.calendarHeaderText, { color: '#FFA05C', fontWeight: 'bold' }]}>Done</Text>
          </TouchableOpacity>
        </View>
        {selectedDate && (
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
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate || '']: { selected: true, selectedColor: '#FFA05C' },
          }}
          theme={{
            todayTextColor: '#FFA05C',
            arrowColor: '#000',
          }}
        />
        <View style={styles.unknownButtonContainer}>
            <TouchableOpacity style={styles.unknownButton} onPress={handleSetUnknown}>
                <Text style={styles.unknownButtonText}>Unknown Expiration Date</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  calendarHeaderText: {
    fontSize: 17,
    color: '#007AFF',
  },
  calendarHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  selectedDateContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA05C30',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#333',
  },
  unknownButtonContainer: {
    padding: 16,
  },
  unknownButton: {
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unknownButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});