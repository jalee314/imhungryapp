import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Offsets = [-2.5, -1, 0, 1, 2.5];

export default function OutlinedText() {
  return (
    <View style={styles.wrapper}>
      {Offsets.flatMap((x) =>
        Offsets.map((y) => {
          if (x === 0 && y === 0) return null;
          return (
            <Text key={`${x}-${y}`} style={[styles.outlinedText, styles.outline, { left: x, top: y }]}>
              ImHungri
            </Text>
          );
        })
      )}
      <Text style={styles.outlinedText}>ImHungri</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outlinedText: {
    fontSize: 64,
    color: '#FFA05C',
    textAlign: 'center',
    fontFamily: 'Mitr-Bold',
  },
  outline: {
    color: '#000',
    position: 'absolute',
  },
});
