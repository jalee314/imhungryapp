import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OutlinedText from '../components/OutlinedText';
import { StatusBar } from 'expo-status-bar';

export default function LandingScreen() {
    return (
      <LinearGradient
        colors={['#FFF5AB', '#FFE100']}
        style={styles.centered}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar style="dark" />
        <OutlinedText />
      </LinearGradient>
    );
  }
  
  const styles = StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
  